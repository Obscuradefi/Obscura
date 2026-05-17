// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title ObscuraNanopay
/// @notice Sub-cent payment channels for agent-to-service billing on Arc.
///         Inspired by Circle's Nanopayments primitive — instead of paying
///         on-chain for every micro-transaction (which would cost more in
///         gas than the payment itself), the payer opens a channel funded
///         with USDC and signs *off-chain* increment messages. The payee
///         (e.g. an RFQ maker, a Pyth pusher, or an LLM service) accumulates
///         these messages and settles on-chain in batches whenever it makes
///         economic sense.
///
///         Used by Obscura's intent agent to pay:
///           - 0.001 USDC per RFQ quote requested from a maker
///           - 0.0005 USDC per Jatevo LLM intent parse
///           - 0.0001 USDC per Pyth update fee paid on the agent's behalf
///
///         The channel design is deliberately simple: monotonically-increasing
///         `nonce`-style amount, signed by the payer. Settlement at any time.
///         No multi-party state channel complexity — Obscura's flows are
///         strictly client-to-service.
///
/// @dev    Compatible with Circle Wallets (developer-controlled or modular).
///         The agent's session key signs off-chain `Settle` messages without
///         the user clicking on every $0.001 charge.
contract ObscuraNanopay {
    // ---------- domain ----------

    string public constant NAME = "ObscuraNanopay";
    string public constant VERSION = "1";

    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @dev keccak256("ChannelClaim(bytes32 channelId,address payer,address payee,uint256 totalSpent,uint256 nonce)")
    bytes32 public immutable CLAIM_TYPEHASH;

    // ---------- storage ----------

    address public immutable USDC;

    struct Channel {
        address payer;          // who deposited
        address payee;          // who can claim
        uint128 deposited;      // raw USDC units deposited
        uint128 claimed;        // raw USDC units claimed so far
        uint64  closesAt;       // timestamp the payer can sweep unspent funds
        bool    open;
    }

    mapping(bytes32 => Channel) public channels;
    /// @dev replay protection on settle calls
    mapping(bytes32 => uint256) public lastNonce;

    /// @dev Default channel cooldown — payers cannot withdraw remaining
    ///      funds until this many seconds after `closeChannel` is called.
    ///      Gives the payee time to settle their last batch.
    uint64 public cooldown = 1 hours;

    address public owner;

    // ---------- events ----------

    event ChannelOpened(
        bytes32 indexed channelId,
        address indexed payer,
        address indexed payee,
        uint256 deposit
    );
    event ChannelTopUp(bytes32 indexed channelId, uint256 amount);
    event ChannelClaim(
        bytes32 indexed channelId,
        address indexed payee,
        uint256 increment,
        uint256 totalSpent,
        uint256 nonce
    );
    event ChannelClosed(bytes32 indexed channelId, uint64 sweepableAt);
    event ChannelSwept(bytes32 indexed channelId, address indexed payer, uint256 refund);
    event CooldownUpdated(uint64 newCooldown);

    // ---------- modifiers ----------

    modifier onlyOwner() {
        require(msg.sender == owner, "Nanopay: not owner");
        _;
    }

    uint256 private _reentrancyStatus = 1;
    modifier nonReentrant() {
        require(_reentrancyStatus == 1, "Nanopay: reentrant");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    // ---------- constructor ----------

    constructor(address _usdc) {
        require(_usdc != address(0), "Nanopay: usdc=0");
        USDC = _usdc;
        owner = msg.sender;

        CLAIM_TYPEHASH = keccak256(
            "ChannelClaim(bytes32 channelId,address payer,address payee,uint256 totalSpent,uint256 nonce)"
        );

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                keccak256(bytes(NAME)),
                keccak256(bytes(VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    // ---------- admin ----------

    function setCooldown(uint64 newCooldown) external onlyOwner {
        require(newCooldown <= 7 days, "Nanopay: too long");
        cooldown = newCooldown;
        emit CooldownUpdated(newCooldown);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ---------- core ----------

    /// @notice Open a new payment channel funded with `deposit` USDC.
    /// @return channelId Deterministic ID derived from (payer, payee, salt).
    function openChannel(
        address payee,
        uint256 deposit,
        bytes32 salt
    ) external nonReentrant returns (bytes32 channelId) {
        require(payee != address(0) && payee != msg.sender, "Nanopay: bad payee");
        require(deposit > 0 && deposit <= type(uint128).max, "Nanopay: bad deposit");

        channelId = keccak256(abi.encode(msg.sender, payee, salt));
        require(!channels[channelId].open && channels[channelId].payer == address(0),
            "Nanopay: channel exists");

        channels[channelId] = Channel({
            payer: msg.sender,
            payee: payee,
            deposited: uint128(deposit),
            claimed: 0,
            closesAt: 0,
            open: true
        });

        _safeTransferFrom(USDC, msg.sender, address(this), deposit);
        emit ChannelOpened(channelId, msg.sender, payee, deposit);
    }

    /// @notice Top up an existing channel (e.g. when the agent has burned
    ///         through its initial allowance).
    function topUp(bytes32 channelId, uint256 amount) external nonReentrant {
        Channel storage c = channels[channelId];
        require(c.open, "Nanopay: closed");
        require(c.payer == msg.sender, "Nanopay: not payer");
        require(amount > 0 && uint256(c.deposited) + amount <= type(uint128).max,
            "Nanopay: bad amount");

        c.deposited = uint128(uint256(c.deposited) + amount);
        _safeTransferFrom(USDC, msg.sender, address(this), amount);
        emit ChannelTopUp(channelId, amount);
    }

    /// @notice Payee claims accumulated payments by submitting a payer-signed
    ///         message stating the running total. We pay out `totalSpent -
    ///         claimed` and update `claimed`.
    function claim(
        bytes32 channelId,
        uint256 totalSpent,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        Channel storage c = channels[channelId];
        require(c.payer != address(0), "Nanopay: no channel");
        require(msg.sender == c.payee, "Nanopay: not payee");
        require(totalSpent <= c.deposited, "Nanopay: exceeds deposit");
        require(totalSpent >= c.claimed, "Nanopay: regress");
        require(nonce > lastNonce[channelId], "Nanopay: stale nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                channelId,
                c.payer,
                c.payee,
                totalSpent,
                nonce
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        require(_recover(digest, signature) == c.payer, "Nanopay: bad sig");

        uint256 increment = totalSpent - c.claimed;
        c.claimed = uint128(totalSpent);
        lastNonce[channelId] = nonce;

        _safeTransfer(USDC, c.payee, increment);
        emit ChannelClaim(channelId, c.payee, increment, totalSpent, nonce);
    }

    /// @notice Payer signals they want to close. After `cooldown` seconds the
    ///         payer can sweep any unclaimed deposit. Payee should claim
    ///         outstanding amounts before the cooldown expires.
    function closeChannel(bytes32 channelId) external {
        Channel storage c = channels[channelId];
        require(c.open, "Nanopay: closed");
        require(c.payer == msg.sender, "Nanopay: not payer");
        c.open = false;
        c.closesAt = uint64(block.timestamp + cooldown);
        emit ChannelClosed(channelId, c.closesAt);
    }

    /// @notice After cooldown, payer reclaims unspent funds.
    function sweep(bytes32 channelId) external nonReentrant {
        Channel storage c = channels[channelId];
        require(c.payer == msg.sender, "Nanopay: not payer");
        require(!c.open, "Nanopay: still open");
        require(block.timestamp >= c.closesAt, "Nanopay: cooldown");
        require(c.deposited > c.claimed, "Nanopay: nothing to sweep");

        uint256 refund = c.deposited - c.claimed;
        c.claimed = c.deposited;

        _safeTransfer(USDC, c.payer, refund);
        emit ChannelSwept(channelId, c.payer, refund);
    }

    // ---------- views ----------

    function balance(bytes32 channelId) external view returns (uint256) {
        Channel storage c = channels[channelId];
        return c.deposited - c.claimed;
    }

    function quoteId(address payer, address payee, bytes32 salt)
        external
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(payer, payee, salt));
    }

    // ---------- helpers ----------

    function _recover(bytes32 hash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "Nanopay: bad sig len");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Nanopay: bad v");
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "Nanopay: ecrecover");
        return signer;
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "Nanopay: transfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))),
            "Nanopay: transferFrom failed");
    }
}
