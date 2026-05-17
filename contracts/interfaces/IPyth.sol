// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {PythStructs} from "./PythStructs.sol";

/// @notice Minimal slice of the Pyth on-chain interface used by Obscura.
/// @dev Source: https://github.com/pyth-network/pyth-sdk-solidity
///      Arc Testnet contract: 0x2880aB155794e7179c9eE2e38200202908C17B43
interface IPyth {
    /// @notice Pull an unverified price (no max-age check). Reverts if the
    ///         feed has never been initialised.
    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory);

    /// @notice Pull a price guaranteed to be at most `age` seconds old.
    function getPriceNoOlderThan(bytes32 id, uint256 age)
        external
        view
        returns (PythStructs.Price memory);

    /// @notice Same as above for the EMA price (used for less-volatile
    ///         display values; Obscura uses the spot `getPriceNoOlderThan`).
    function getEmaPriceNoOlderThan(bytes32 id, uint256 age)
        external
        view
        returns (PythStructs.Price memory);

    /// @notice Push fresh price data sourced from Hermes. Caller pays the
    ///         per-update fee returned by `getUpdateFee`.
    function updatePriceFeeds(bytes[] calldata updateData) external payable;

    /// @notice Per-update fee in wei (USDC on Arc, since USDC is native gas).
    function getUpdateFee(bytes[] calldata updateData) external view returns (uint256);
}
