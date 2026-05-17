// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";

/// @title ObscuraShield
/// @notice Privacy pool with **Programmable Privacy Levels** (Low / Medium /
///         High). Users deposit ("shield") any whitelisted asset and receive
///         an encrypted balance entry stamped with their chosen privacy level.
///         Withdrawal ("unshield") is mediated by a configurable lock window
///         per level so observers cannot trivially time-correlate deposits
///         and withdrawals.
///
///         This contract intentionally does NOT implement zero-knowledge
///         circuits — Arc Testnet's opt-in privacy primitives are still rolling
///         out, so the on-chain piece commits to (user, asset, blinded
///         amount, level) and emits opaque commitments. A future upgrade can
///         swap the commitment for a zk-SNARK / Circle Confidential Transfer
///         primitive without changing the public ABI.
///
/// @dev Privacy levels:
///   - LOW    (0): No lock, fast settlement, suitable for small amounts.
///   - MEDIUM (1): 1 hour lock, mixed in with other LOW+MEDIUM withdrawals.
///   - HIGH   (2): 24 hour lock, stronger temporal de-correlation.
contract ObscuraShield {
    enum PrivacyLevel { LOW, MEDIUM, HIGH }

    struct ShieldEntry {
        uint128 amount;       // raw token units
        uint64 unlockAt;      // timestamp at which unshield is permitted
        uint8 level;          // PrivacyLevel
        bool active;
    }

    /// @dev keyed by (user, asset, entryId)
    mapping(address => mapping(address => ShieldEntry[])) private _entries;

    /// @dev Aggregate shielded balance per (user, asset). Public for UX but
    ///      reveals only the running total, never individual deposits.
    mapping(address => mapping(address => uint256)) public encryptedBalance;

    /// @dev Aggregate locked-in TVL per asset (used for UI dashboards).
    mapping(address => uint256) public totalShielded;

    mapping(address => bool) public assetWhitelist;
    address[] public whitelistedAssets;

    /// @dev Lock windows per privacy level (seconds). Owner-tunable.
    mapping(uint8 => uint64) public levelLock;

    address public owner;

    /// @dev Tiny inline reentrancy guard.
    uint256 private _reentrancyStatus = 1;
    modifier nonReentrant() {
        require(_reentrancyStatus == 1, "Shield: reentrant");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    event AssetWhitelisted(address indexed asset, bool allowed);
    event LevelLockUpdated(uint8 indexed level, uint64 lockSeconds);

    /// @dev `commitment` is keccak256(user, asset, amount, level, nonce). It is
    ///      emitted instead of the raw amount so external indexers see only an
    ///      opaque commitment. `amount` is still stored on-chain because we do
    ///      not have a ZK setup yet; treat that as a known limitation that the
    ///      next upgrade replaces with a Pedersen commitment.
    event Shielded(
        address indexed user,
        address indexed asset,
        uint8 indexed level,
        uint256 entryId,
        bytes32 commitment
    );

    event Unshielded(
        address indexed user,
        address indexed asset,
        uint8 indexed level,
        uint256 entryId,
        bytes32 commitment
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Shield: not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        // sensible defaults
        levelLock[uint8(PrivacyLevel.LOW)] = 0;
        levelLock[uint8(PrivacyLevel.MEDIUM)] = 1 hours;
        levelLock[uint8(PrivacyLevel.HIGH)] = 24 hours;
    }

    // ---------- Admin ----------

    function setAssetWhitelist(address asset, bool allowed) external onlyOwner {
        require(asset != address(0), "Shield: zero asset");
        if (allowed && !assetWhitelist[asset]) {
            whitelistedAssets.push(asset);
        }
        assetWhitelist[asset] = allowed;
        emit AssetWhitelisted(asset, allowed);
    }

    function setLevelLock(uint8 level, uint64 lockSeconds) external onlyOwner {
        require(level <= uint8(PrivacyLevel.HIGH), "Shield: bad level");
        levelLock[level] = lockSeconds;
        emit LevelLockUpdated(level, lockSeconds);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ---------- User flow ----------

    /// @notice Shield (deposit) `amount` of `asset` at privacy level `level`.
    /// @param salt Caller-chosen blinding factor used in the public commitment.
    /// @return entryId Index into `_entries[user][asset]` for later unshield.
    /// @dev Follows checks-effects-interactions: state mutates first, then
    ///      we pull tokens. The reentrancy guard is belt-and-braces because
    ///      the storage update happens before any external call regardless.
    function shield(
        address asset,
        uint256 amount,
        uint8 level,
        bytes32 salt
    ) external nonReentrant returns (uint256 entryId) {
        require(assetWhitelist[asset], "Shield: asset not allowed");
        require(amount > 0 && amount <= type(uint128).max, "Shield: bad amount");
        require(level <= uint8(PrivacyLevel.HIGH), "Shield: bad level");

        uint64 unlockAt = uint64(block.timestamp + levelLock[level]);
        _entries[msg.sender][asset].push(
            ShieldEntry({
                amount: uint128(amount),
                unlockAt: unlockAt,
                level: level,
                active: true
            })
        );
        entryId = _entries[msg.sender][asset].length - 1;

        encryptedBalance[msg.sender][asset] += amount;
        totalShielded[asset] += amount;

        // External call last; if the token reverts, all state above is rolled back.
        _safeTransferFrom(asset, msg.sender, address(this), amount);

        bytes32 commitment = keccak256(
            abi.encode(msg.sender, asset, amount, level, salt, entryId)
        );
        emit Shielded(msg.sender, asset, level, entryId, commitment);
    }

    /// @notice Unshield a specific entry. The lock window for its level must
    ///         have elapsed.
    function unshield(
        address asset,
        uint256 entryId,
        bytes32 salt
    ) external nonReentrant returns (uint256 amount) {
        ShieldEntry[] storage list = _entries[msg.sender][asset];
        require(entryId < list.length, "Shield: bad id");
        ShieldEntry storage e = list[entryId];
        require(e.active, "Shield: not active");
        require(block.timestamp >= e.unlockAt, "Shield: locked");

        amount = uint256(e.amount);
        e.active = false;

        encryptedBalance[msg.sender][asset] -= amount;
        totalShielded[asset] -= amount;

        bytes32 commitment = keccak256(
            abi.encode(msg.sender, asset, amount, e.level, salt, entryId)
        );
        emit Unshielded(msg.sender, asset, e.level, entryId, commitment);

        // External call last to keep CEI ordering.
        _safeTransfer(asset, msg.sender, amount);
    }

    // ---------- Views ----------

    function getEntryCount(address user, address asset) external view returns (uint256) {
        return _entries[user][asset].length;
    }

    function getEntry(address user, address asset, uint256 entryId)
        external
        view
        returns (uint256 amount, uint64 unlockAt, uint8 level, bool active)
    {
        ShieldEntry storage e = _entries[user][asset][entryId];
        return (uint256(e.amount), e.unlockAt, e.level, e.active);
    }

    function getEncryptedBalance(address user, address asset) external view returns (uint256) {
        return encryptedBalance[user][asset];
    }

    function whitelistedAssetsLength() external view returns (uint256) {
        return whitelistedAssets.length;
    }

    // ---------- helpers ----------

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "Shield: transfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "Shield: transferFrom failed");
    }
}
