// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IPyth} from "./interfaces/IPyth.sol";
import {PythStructs} from "./interfaces/PythStructs.sol";

/// @title ObscuraRFQ
/// @notice Onchain settlement for off-chain Request-for-Quote trades. A
///         whitelisted **maker** signs an EIP-712 Quote off-chain (typically
///         streamed over a websocket / pulled from a quote API). Any **taker**
///         can submit the signed quote together with their input tokens and
///         atomically receive the output amount.
///
///         Each settlement is bounded by Pyth: the maker's quoted exchange
///         rate must be within `maxDeviationBps` of the on-chain Pyth oracle
///         price. This guards takers against a compromised maker key from
///         signing absurd quotes, and is the key narrative differentiator
///         vs. a "trust the maker" RFQ.
///
/// @dev    Quotes are single-use (tracked by `quoteId`). Replay protection +
///         expiry are enforced. The contract is dependency-free aside from
///         IERC20/IPyth interfaces already shipped in /contracts.
contract ObscuraRFQ {
    // ---------- domain ----------

    string public constant NAME = "ObscuraRFQ";
    string public constant VERSION = "1";

    bytes32 public immutable DOMAIN_SEPARATOR;

    /// @dev keccak256("Quote(bytes32 quoteId,address maker,address taker,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOut,uint256 expiry)")
    ///      Computed in the constructor so we never ship a stale typehash.
    bytes32 public immutable QUOTE_TYPEHASH;

    // ---------- state ----------

    IPyth public immutable pyth;
    address public owner;

    /// @dev Per-asset Pyth feed registration. Same shape as ObscuraAMM.
    struct AssetInfo {
        bytes32 priceId;
        uint8 decimals;
        bool listed;
        bool inverted;
    }
    mapping(address => AssetInfo) public assetInfo;

    /// @dev Maker whitelist. In production this would be a permissioned
    ///      institution onboarded by Circle. For the hackathon we run a
    ///      single maker EOA controlled by the deployer.
    mapping(address => bool) public isMaker;

    /// @dev quoteId => filled? Prevents replay.
    mapping(bytes32 => bool) public filled;

    /// @dev Maximum allowed deviation between the maker's implied price and
    ///      the Pyth oracle price, in basis points (200 = 2%). Acts as a
    ///      circuit breaker against malicious or compromised makers.
    uint16 public maxDeviationBps = 200;

    // ---------- events ----------

    event MakerSet(address indexed maker, bool allowed);
    event AssetListed(address indexed asset, bytes32 priceId, uint8 decimals, bool inverted);
    event MaxDeviationSet(uint16 bps);
    event Settled(
        bytes32 indexed quoteId,
        address indexed maker,
        address indexed taker,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    // ---------- modifiers ----------

    modifier onlyOwner() {
        require(msg.sender == owner, "RFQ: not owner");
        _;
    }

    uint256 private _reentrancyStatus = 1;
    modifier nonReentrant() {
        require(_reentrancyStatus == 1, "RFQ: reentrant");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    // ---------- constructor ----------

    constructor(address _pyth) {
        require(_pyth != address(0), "RFQ: pyth=0");
        pyth = IPyth(_pyth);
        owner = msg.sender;

        QUOTE_TYPEHASH = keccak256(
            "Quote(bytes32 quoteId,address maker,address taker,address tokenIn,address tokenOut,uint256 amountIn,uint256 amountOut,uint256 expiry)"
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

    function setMaker(address maker, bool allowed) external onlyOwner {
        require(maker != address(0), "RFQ: zero maker");
        isMaker[maker] = allowed;
        emit MakerSet(maker, allowed);
    }

    function listAsset(
        address asset,
        bytes32 priceId,
        uint8 decimals_,
        bool inverted
    ) external onlyOwner {
        require(asset != address(0), "RFQ: bad asset");
        require(!assetInfo[asset].listed, "RFQ: already listed");
        require(priceId != bytes32(0), "RFQ: bad priceId");
        assetInfo[asset] = AssetInfo({
            priceId: priceId,
            decimals: decimals_,
            listed: true,
            inverted: inverted
        });
        emit AssetListed(asset, priceId, decimals_, inverted);
    }

    /// @dev USDC is a special case: it has a fixed $1 price and 6 decimals,
    ///      so we don't list a Pyth feed for it. Callers register USDC by
    ///      supplying address(0) as the priceId here.
    function listUSDC(address usdc) external onlyOwner {
        require(!assetInfo[usdc].listed, "RFQ: already listed");
        assetInfo[usdc] = AssetInfo({
            priceId: bytes32(0),
            decimals: 6,
            listed: true,
            inverted: false
        });
        emit AssetListed(usdc, bytes32(0), 6, false);
    }

    function setMaxDeviationBps(uint16 bps) external onlyOwner {
        require(bps <= 1000, "RFQ: too loose"); // 10% hard cap
        maxDeviationBps = bps;
        emit MaxDeviationSet(bps);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ---------- core ----------

    /// @notice Settle a maker-signed quote. Caller must be the `taker`
    ///         encoded in the quote (or address(0) for "any taker").
    function settle(
        bytes32 quoteId,
        address maker,
        address taker,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 expiry,
        bytes calldata signature
    ) external nonReentrant {
        require(!filled[quoteId], "RFQ: filled");
        require(block.timestamp <= expiry, "RFQ: expired");
        require(isMaker[maker], "RFQ: bad maker");
        require(taker == address(0) || taker == msg.sender, "RFQ: bad taker");
        require(amountIn > 0 && amountOut > 0, "RFQ: zero amount");
        require(tokenIn != tokenOut, "RFQ: same token");
        require(assetInfo[tokenIn].listed && assetInfo[tokenOut].listed, "RFQ: not listed");

        // 1. Verify EIP-712 signature.
        bytes32 structHash = keccak256(
            abi.encode(
                QUOTE_TYPEHASH,
                quoteId,
                maker,
                taker,
                tokenIn,
                tokenOut,
                amountIn,
                amountOut,
                expiry
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
        require(_recover(digest, signature) == maker, "RFQ: bad sig");

        // 2. Pyth ceiling check: implied rate must be within tolerance of
        //    the on-chain Pyth oracle.
        _checkPythCeiling(tokenIn, tokenOut, amountIn, amountOut);

        // 3. Effects.
        filled[quoteId] = true;

        // 4. Interactions: pull from taker, push from maker.
        _safeTransferFrom(tokenIn, msg.sender, maker, amountIn);
        _safeTransferFrom(tokenOut, maker, msg.sender, amountOut);

        emit Settled(quoteId, maker, msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /// @notice View helper: compute the "fair" amountOut implied by the
    ///         current Pyth prices, ignoring fees. Useful for clients that
    ///         want to sanity-check a maker's quote before submitting.
    function fairAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256) {
        if (amountIn == 0 || tokenIn == tokenOut) return 0;
        return _convert(tokenIn, tokenOut, amountIn);
    }

    // ---------- internal ----------

    function _checkPythCeiling(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) internal view {
        uint256 fair = _convert(tokenIn, tokenOut, amountIn);
        require(fair > 0, "RFQ: zero fair");

        // Allow amountOut in [fair * (1 - dev), fair * (1 + dev)].
        uint256 dev = maxDeviationBps; // bps (out of 10_000)
        uint256 lower = (fair * (10_000 - dev)) / 10_000;
        uint256 upper = (fair * (10_000 + dev)) / 10_000;
        require(amountOut >= lower && amountOut <= upper, "RFQ: deviation");
    }

    /// @dev USDC = $1, otherwise pull from Pyth. Inverts when needed.
    function _convert(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        (uint256 priceIn, int32 expoIn, uint8 decIn) = _priceFor(tokenIn);
        (uint256 priceOut, int32 expoOut, uint8 decOut) = _priceFor(tokenOut);
        if (priceIn == 0 || priceOut == 0) return 0;

        int256 netExpo =
            (int256(expoIn) - int256(expoOut)) +
            (int256(uint256(decOut)) - int256(uint256(decIn)));

        uint256 num = amountIn * priceIn;
        uint256 den = priceOut;
        if (netExpo >= 0) {
            return num * (10 ** uint256(netExpo)) / den;
        } else {
            return num / (den * (10 ** uint256(-netExpo)));
        }
    }

    function _priceFor(address asset)
        internal
        view
        returns (uint256 price, int32 expo, uint8 decimals_)
    {
        AssetInfo storage info = assetInfo[asset];
        require(info.listed, "RFQ: not listed");
        // USDC special-case: priceId == 0 means $1 fixed at -8 expo.
        if (info.priceId == bytes32(0)) {
            return (1e8, int32(-8), info.decimals);
        }

        PythStructs.Price memory p = pyth.getPriceUnsafe(info.priceId);
        require(p.price > 0, "RFQ: pyth<=0");
        if (!info.inverted) {
            return (uint256(uint64(p.price)), p.expo, info.decimals);
        }

        // High-precision inversion (see ObscuraAMM._getPriceForCalc for math).
        uint256 denom = uint256(uint64(p.price));
        require(denom > 0, "RFQ: pyth=0");
        int256 shift;
        if (p.expo < 0) {
            shift = int256(uint256(int256(-p.expo))) + 18;
        } else {
            shift = int256(18) - int256(uint256(int256(p.expo)));
        }
        require(shift >= 0 && shift <= 60, "RFQ: bad shift");
        uint256 invertedPrice = (10 ** uint256(shift)) / denom;
        require(invertedPrice > 0, "RFQ: invert=0");
        return (invertedPrice, int32(-18), info.decimals);
    }

    function _recover(bytes32 hash, bytes memory sig) internal pure returns (address) {
        require(sig.length == 65, "RFQ: bad sig len");
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "RFQ: bad v");
        address signer = ecrecover(hash, v, r, s);
        require(signer != address(0), "RFQ: ecrecover");
        return signer;
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "RFQ: transferFrom failed");
    }
}
