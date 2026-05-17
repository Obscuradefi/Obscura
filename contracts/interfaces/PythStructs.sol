// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

/// @notice Pyth on-chain price struct. Mirrors the canonical SDK definition.
library PythStructs {
    struct Price {
        // Price multiplied by 10^expo. Negative `price` is allowed (e.g. for FX
        // pairs); Obscura rejects non-positive prices in the AMM.
        int64 price;
        // Confidence interval (1-sigma).
        uint64 conf;
        // Exponent (typically -8 for crypto, -5/-8 for equities/commodities).
        int32 expo;
        // Unix timestamp of the publish.
        uint256 publishTime;
    }
}
