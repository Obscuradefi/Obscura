// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "./interfaces/IERC20.sol";
import {IPyth} from "./interfaces/IPyth.sol";
import {PythStructs} from "./interfaces/PythStructs.sol";

/// @title ObscuraAMM
/// @notice Multi-asset AMM where every swap settles at the **Pyth Network**
///         spot price. USDC is the universal quote token (and the native gas
///         token on Arc), so a swap of `amountIn` token A for token B returns
///         exactly:
///
///             amountOut = amountIn * price_A / price_B * (1 - fee)
///
///         …adjusted for token decimals and Pyth's exponent. There is no
///         constant-product slippage; the only "slippage" comes from the
///         0.30% pool fee and from price drift between quote and execution.
///
///         Reserves still exist per `(asset, USDC)` pool because LPs need a
///         place to seed and withdraw liquidity. Cross-asset swaps route
///         through the USDC reserves of both legs to keep each pool balanced.
///
/// @dev Pyth on Arc Testnet:
///        0x2880aB155794e7179c9eE2e38200202908C17B43
///      `getPriceUnsafe` is intentionally permissive: it relies on someone
///      pushing fresh prices to Pyth (Hermes pusher, governance keepers, or a
///      caller invoking `updatePriceFeeds`). The companion `swapWithPriceUpdate`
///      lets a user pay the per-update fee themselves to guarantee freshness.
contract ObscuraAMM {
    struct Pool {
        uint256 reserveAsset; // raw asset units
        uint256 reserveUSDC;  // raw USDC units (6 decimals on Arc)
        uint256 totalShares;  // LP shares for this pool
    }

    struct AssetInfo {
        bytes32 priceId;  // Pyth price feed id
        uint8 decimals;   // token decimals
        bool listed;
        // Pyth provides feeds in canonical form (e.g. EUR/USD = "USD per 1
        // EUR"). Some assets (notably JPYC, where Pyth lists USD/JPY = "JPY
        // per 1 USD") need to be inverted before they can be used as a price
        // *of* the asset in USD. When `inverted` is true, the contract treats
        // the Pyth price as `1 / price` with sign-flipped exponents.
        bool inverted;
    }

    address public immutable USDC;
    IPyth public immutable pyth;

    uint256 public constant FEE_BPS = 30;            // 0.30% swap fee
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @dev Pyth-fixed quote for USDC. We do not need a Pyth feed for the
    ///      quote token itself because by definition USDC = $1 in the AMM.
    ///      Constant chosen to keep the same expo as typical crypto feeds (-8)
    ///      for simpler arithmetic.
    int64 internal constant USDC_PRICE = 1e8;
    int32 internal constant USDC_EXPO = -8;

    mapping(address => Pool) public pools;                                  // asset => pool
    mapping(address => AssetInfo) public assetInfo;                         // asset => Pyth price id + decimals
    mapping(address => mapping(address => uint256)) public liquidityShares; // provider => asset => shares
    address[] public listedAssets;

    address public owner;

    /// @dev Tiny inline reentrancy guard. We avoid an OpenZeppelin import to
    ///      keep the contract dependency-free for hackathon judging.
    uint256 private _reentrancyStatus = 1;
    modifier nonReentrant() {
        require(_reentrancyStatus == 1, "AMM: reentrant");
        _reentrancyStatus = 2;
        _;
        _reentrancyStatus = 1;
    }

    event AssetListed(address indexed asset, bytes32 priceId, uint8 decimals, bool inverted);
    event LiquidityAdded(
        address indexed provider,
        address indexed asset,
        uint256 amountAsset,
        uint256 amountUSDC,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed provider,
        address indexed asset,
        uint256 amountAsset,
        uint256 amountUSDC,
        uint256 shares
    );
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "AMM: not owner");
        _;
    }

    constructor(address _usdc, address _pyth) {
        require(_usdc != address(0), "AMM: usdc=0");
        require(_pyth != address(0), "AMM: pyth=0");
        USDC = _usdc;
        pyth = IPyth(_pyth);
        owner = msg.sender;
    }

    // ---------- Admin ----------

    /// @notice Whitelist a non-USDC asset so it can be used as a pool side.
    ///         Caller must supply the matching Pyth price feed id and the
    ///         token's ERC-20 `decimals()` value. Set `inverted` when the
    ///         Pyth feed is quoted "wrong way round" (e.g. USD/JPY when you
    ///         actually need a USD-per-JPY price).
    function listAsset(
        address asset,
        bytes32 priceId,
        uint8 decimals_,
        bool inverted
    ) external onlyOwner {
        require(asset != address(0) && asset != USDC, "AMM: bad asset");
        require(!assetInfo[asset].listed, "AMM: already listed");
        require(priceId != bytes32(0), "AMM: bad priceId");
        assetInfo[asset] = AssetInfo({
            priceId: priceId,
            decimals: decimals_,
            listed: true,
            inverted: inverted
        });
        listedAssets.push(asset);
        emit AssetListed(asset, priceId, decimals_, inverted);
    }

    function isListed(address asset) external view returns (bool) {
        return asset == USDC || assetInfo[asset].listed;
    }

    function listedAssetsLength() external view returns (uint256) {
        return listedAssets.length;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    // ---------- Liquidity ----------

    /// @notice Add liquidity to (asset, USDC). LP shares track the geometric
    ///         mean of the deposit so the per-share USDC value stays stable
    ///         even as the (asset, USDC) ratio shifts under oracle-priced
    ///         swaps.
    function addLiquidity(
        address asset,
        uint256 amountAsset,
        uint256 amountUSDC
    ) external nonReentrant returns (uint256 shares) {
        require(assetInfo[asset].listed, "AMM: not listed");
        require(amountAsset > 0 && amountUSDC > 0, "AMM: zero amount");

        Pool storage p = pools[asset];

        if (p.totalShares == 0) {
            shares = _sqrt(amountAsset * amountUSDC);
            require(shares > 0, "AMM: shares=0");
        } else {
            uint256 sa = (amountAsset * p.totalShares) / p.reserveAsset;
            uint256 sb = (amountUSDC * p.totalShares) / p.reserveUSDC;
            shares = sa < sb ? sa : sb;
            require(shares > 0, "AMM: shares=0");
        }

        _safeTransferFrom(asset, msg.sender, address(this), amountAsset);
        _safeTransferFrom(USDC, msg.sender, address(this), amountUSDC);

        p.reserveAsset += amountAsset;
        p.reserveUSDC += amountUSDC;
        p.totalShares += shares;
        liquidityShares[msg.sender][asset] += shares;

        emit LiquidityAdded(msg.sender, asset, amountAsset, amountUSDC, shares);
    }

    function removeLiquidity(address asset, uint256 shares)
        external
        nonReentrant
        returns (uint256 amountAsset, uint256 amountUSDC)
    {
        require(assetInfo[asset].listed, "AMM: not listed");
        Pool storage p = pools[asset];
        uint256 userShares = liquidityShares[msg.sender][asset];
        require(shares > 0 && shares <= userShares, "AMM: bad shares");

        amountAsset = (shares * p.reserveAsset) / p.totalShares;
        amountUSDC = (shares * p.reserveUSDC) / p.totalShares;
        require(amountAsset > 0 && amountUSDC > 0, "AMM: zero out");

        liquidityShares[msg.sender][asset] = userShares - shares;
        p.totalShares -= shares;
        p.reserveAsset -= amountAsset;
        p.reserveUSDC -= amountUSDC;

        _safeTransfer(asset, msg.sender, amountAsset);
        _safeTransfer(USDC, msg.sender, amountUSDC);

        emit LiquidityRemoved(msg.sender, asset, amountAsset, amountUSDC, shares);
    }

    // ---------- Swap ----------

    /// @notice Oracle-priced swap. Pyth feeds are read with `getPriceUnsafe`
    ///         so callers should ensure the feeds were updated recently
    ///         (e.g. via `swapWithPriceUpdate`).
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant returns (uint256 amountOut) {
        return _swap(tokenIn, tokenOut, amountIn, minAmountOut);
    }

    /// @notice Same as `swap`, but pushes fresh Pyth price updates first. The
    ///         caller pays the per-update fee in native USDC (`msg.value`).
    ///
    /// @dev Follows checks-effects-interactions: update Pyth, run the swap,
    ///      THEN refund excess. If the swap reverts, the refund is rolled back
    ///      automatically and the user only pays the Pyth fee already consumed
    ///      by `updatePriceFeeds` (which is non-refundable by design).
    function swapWithPriceUpdate(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes[] calldata priceUpdateData
    ) external payable nonReentrant returns (uint256 amountOut) {
        uint256 fee;
        if (priceUpdateData.length > 0) {
            fee = pyth.getUpdateFee(priceUpdateData);
            require(msg.value >= fee, "AMM: pyth fee");
            pyth.updatePriceFeeds{value: fee}(priceUpdateData);
        } else {
            require(msg.value == 0, "AMM: no update");
        }

        amountOut = _swap(tokenIn, tokenOut, amountIn, minAmountOut);

        if (msg.value > fee) {
            (bool ok, ) = msg.sender.call{value: msg.value - fee}("");
            require(ok, "AMM: refund failed");
        }
    }

    function _swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) internal returns (uint256 amountOut) {
        require(amountIn > 0, "AMM: amountIn=0");
        require(tokenIn != tokenOut, "AMM: same token");

        if (tokenIn == USDC) {
            _safeTransferFrom(USDC, msg.sender, address(this), amountIn);
            amountOut = _swapUSDCToAsset(tokenOut, amountIn, msg.sender);
        } else if (tokenOut == USDC) {
            _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
            amountOut = _swapAssetToUSDC(tokenIn, amountIn, msg.sender);
        } else {
            // Cross-asset: route through USDC. Apply the fee only on the
            // exit leg so the user is charged exactly once.
            _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
            uint256 mid = _moveAssetToUSDCNoFee(tokenIn, amountIn);
            amountOut = _swapUSDCToAsset(tokenOut, mid, msg.sender);
        }

        require(amountOut >= minAmountOut, "AMM: slippage");
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    /// @dev Assumes `amountIn` of `asset` is already held by this contract.
    ///      Charges the standard pool fee.
    function _swapAssetToUSDC(address asset, uint256 amountIn, address recipient)
        internal
        returns (uint256 amountOut)
    {
        require(assetInfo[asset].listed, "AMM: not listed");
        Pool storage p = pools[asset];

        amountOut = _quote(asset, USDC, amountIn, true);
        require(p.reserveUSDC >= amountOut, "AMM: USDC reserve");

        p.reserveAsset += amountIn;
        p.reserveUSDC -= amountOut;

        if (recipient != address(this)) {
            _safeTransfer(USDC, recipient, amountOut);
        }
    }

    /// @dev Like `_swapAssetToUSDC` but skips the fee. Used for the entry
    ///      leg of a cross-asset hop so the user is only charged once.
    function _moveAssetToUSDCNoFee(address asset, uint256 amountIn)
        internal
        returns (uint256 amountOut)
    {
        require(assetInfo[asset].listed, "AMM: not listed");
        Pool storage p = pools[asset];

        amountOut = _quote(asset, USDC, amountIn, false);
        require(p.reserveUSDC >= amountOut, "AMM: USDC reserve");

        p.reserveAsset += amountIn;
        p.reserveUSDC -= amountOut;
    }

    /// @dev Assumes `amountIn` of USDC is already held by this contract.
    ///      Charges the standard pool fee.
    function _swapUSDCToAsset(address asset, uint256 amountIn, address recipient)
        internal
        returns (uint256 amountOut)
    {
        require(assetInfo[asset].listed, "AMM: not listed");
        Pool storage p = pools[asset];

        amountOut = _quote(USDC, asset, amountIn, true);
        require(p.reserveAsset >= amountOut, "AMM: asset reserve");

        p.reserveUSDC += amountIn;
        p.reserveAsset -= amountOut;

        if (recipient != address(this)) {
            _safeTransfer(asset, recipient, amountOut);
        }
    }

    // ---------- Quotes ----------

    /// @notice Quote without executing.
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256) {
        if (amountIn == 0 || tokenIn == tokenOut) return 0;
        if (tokenIn == USDC || tokenOut == USDC) {
            return _quote(tokenIn, tokenOut, amountIn, true);
        }
        // Cross-asset: simulate the two-leg path.
        uint256 mid = _quote(tokenIn, USDC, amountIn, false);
        if (mid == 0) return 0;
        return _quote(USDC, tokenOut, mid, true);
    }

    /// @notice Spot price of `asset` denominated in USDC, scaled to 1e18 to
    ///         match UI expectations. This is the **oracle** price, not the
    ///         pool ratio.
    function getPrice(address asset) external view returns (uint256) {
        if (asset == USDC) return 1e18;
        // 1 unit (raw) of asset valued in raw USDC units, times 1e18 / 10^6
        // to express it as USDC-per-asset scaled to 1e18.
        uint256 quoteUSDC = _quote(asset, USDC, 10 ** uint256(assetInfo[asset].decimals), false);
        return quoteUSDC * 1e18 / (10 ** 6);
    }

    function reserves(address asset) external view returns (uint256 rAsset, uint256 rUSDC) {
        Pool storage p = pools[asset];
        return (p.reserveAsset, p.reserveUSDC);
    }

    function totalShares(address asset) external view returns (uint256) {
        return pools[asset].totalShares;
    }

    /// @dev Core decimal-aware quote. `applyFee` toggles the 0.30% pool fee.
    ///
    ///     amountOut = amountIn * priceIn / priceOut * 10^((expoIn - expoOut) + (decOut - decIn))
    ///                 * (1 - fee)
    function _quote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bool applyFee
    ) internal view returns (uint256 amountOut) {
        if (amountIn == 0 || tokenIn == tokenOut) return 0;

        (uint256 priceIn, int32 expoIn, uint8 decIn) = _getPriceForCalc(tokenIn);
        (uint256 priceOut, int32 expoOut, uint8 decOut) = _getPriceForCalc(tokenOut);
        require(priceIn > 0 && priceOut > 0, "AMM: bad price");

        int256 netExpo =
            (int256(expoIn) - int256(expoOut)) +
            (int256(uint256(decOut)) - int256(uint256(decIn)));

        uint256 feeNum = applyFee ? BPS_DENOMINATOR - FEE_BPS : BPS_DENOMINATOR;
        uint256 num = amountIn * priceIn * feeNum;
        uint256 den = priceOut * BPS_DENOMINATOR;

        if (netExpo >= 0) {
            amountOut = num * (10 ** uint256(netExpo)) / den;
        } else {
            amountOut = num / (den * (10 ** uint256(-netExpo)));
        }
    }

    function _getPriceForCalc(address asset)
        internal
        view
        returns (uint256 price, int32 expo, uint8 decimals_)
    {
        if (asset == USDC) {
            return (uint256(uint64(USDC_PRICE)), USDC_EXPO, 6);
        }
        AssetInfo storage info = assetInfo[asset];
        require(info.listed, "AMM: not listed");
        PythStructs.Price memory p = pyth.getPriceUnsafe(info.priceId);
        require(p.price > 0, "AMM: pyth<=0");

        if (!info.inverted) {
            return (uint256(uint64(p.price)), p.expo, info.decimals);
        }

        // Inverted feed (e.g. Pyth publishes USD/JPY but we need USD per JPY).
        // Compute `1 / (price * 10^expo)` while retaining maximum precision
        // by targeting an inverted exponent of -18:
        //   invertedPrice * 10^(-18) = 10^(-expo) / price
        //   => invertedPrice = 10^(-expo + 18) / price
        // The shift is always positive in practice for FX feeds (expo is
        // typically negative and |expo| < 18).
        uint256 denom = uint256(uint64(p.price));
        require(denom > 0, "AMM: pyth=0");

        int256 shift;
        if (p.expo < 0) {
            shift = int256(uint256(int256(-p.expo))) + 18;
        } else {
            shift = int256(18) - int256(uint256(int256(p.expo)));
        }
        require(shift >= 0 && shift <= 60, "AMM: bad shift");

        uint256 invertedPrice = (10 ** uint256(shift)) / denom;
        require(invertedPrice > 0, "AMM: invert=0");
        return (invertedPrice, int32(-18), info.decimals);
    }

    // ---------- helpers ----------

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "AMM: transfer failed");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "AMM: transferFrom failed");
    }

    function _sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}
