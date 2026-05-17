// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPyth} from "./interfaces/IPyth.sol";
import {PythStructs} from "./interfaces/PythStructs.sol";

/// @title MockPyth
/// @notice Tiny in-memory Pyth implementation for Hardhat tests + local
///         development. Lets a deployer plant deterministic prices without
///         needing the real Pyth contract.
contract MockPyth is IPyth {
    mapping(bytes32 => PythStructs.Price) private _prices;

    /// @notice Set or update a price feed. Owner-only in production; here
    ///         anyone can call so tests can plug in arbitrary fixtures.
    function setPrice(
        bytes32 id,
        int64 price,
        uint64 conf,
        int32 expo,
        uint256 publishTime
    ) external {
        _prices[id] = PythStructs.Price({
            price: price,
            conf: conf,
            expo: expo,
            publishTime: publishTime == 0 ? block.timestamp : publishTime
        });
    }

    function getPriceUnsafe(bytes32 id) external view returns (PythStructs.Price memory) {
        PythStructs.Price memory p = _prices[id];
        require(p.publishTime > 0, "MockPyth: feed not set");
        return p;
    }

    function getPriceNoOlderThan(bytes32 id, uint256 age)
        external
        view
        returns (PythStructs.Price memory)
    {
        PythStructs.Price memory p = _prices[id];
        require(p.publishTime > 0, "MockPyth: feed not set");
        require(block.timestamp - p.publishTime <= age, "MockPyth: stale");
        return p;
    }

    function getEmaPriceNoOlderThan(bytes32 id, uint256 age)
        external
        view
        returns (PythStructs.Price memory)
    {
        return this.getPriceNoOlderThan(id, age);
    }

    function updatePriceFeeds(bytes[] calldata) external payable {
        // No-op: tests plant prices via `setPrice` instead.
    }

    function getUpdateFee(bytes[] calldata) external pure returns (uint256) {
        return 0;
    }
}
