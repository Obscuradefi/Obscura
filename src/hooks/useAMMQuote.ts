import { useReadContract } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { OBSCURA_AMM_ABI } from '../config/dexConfig';
import { OBSCURA_AMM_ADDRESS } from '../config/arc';

/**
 * Quote an `amountIn` of `tokenInAddress` -> `tokenOutAddress` against the
 * on-chain ObscuraAMM. Decimals must be passed for both legs because USDC on
 * Arc Testnet is 6-dec while mock assets are 18-dec.
 *
 * Because ObscuraAMM is *oracle-priced* (Pyth), the exchange rate is fixed
 * at the live Pyth price minus the 0.30% pool fee. We therefore expose:
 *   - feeBps: constant 30 (0.30%)
 *   - inventoryUtilization: how much of the destination pool the trade would
 *     consume, useful for surfacing "pool depth" warnings.
 *
 * Reserves come back as `(reserveAsset, reserveUSDC)` tuples for the
 * *non-USDC* side. For USDC itself there is no per-token pool so the hook
 * returns an empty utilization for that leg.
 */
export function useAMMQuote(
    tokenInAddress: string | undefined,
    tokenOutAddress: string | undefined,
    amountIn: string,
    decimalsIn: number,
    decimalsOut: number,
    usdcAddress?: string
) {
    const enabledQuote =
        !!tokenInAddress &&
        !!tokenOutAddress &&
        !!amountIn &&
        parseFloat(amountIn) > 0;

    const { data: amountOutBN, refetch } = useReadContract({
        address: OBSCURA_AMM_ADDRESS,
        abi: OBSCURA_AMM_ABI,
        functionName: 'getAmountOut',
        args: enabledQuote
            ? [
                  tokenInAddress as `0x${string}`,
                  tokenOutAddress as `0x${string}`,
                  parseUnits(amountIn, decimalsIn),
              ]
            : undefined,
        query: { enabled: enabledQuote },
    });

    const isUsdcIn = usdcAddress && tokenInAddress?.toLowerCase() === usdcAddress.toLowerCase();
    const isUsdcOut = usdcAddress && tokenOutAddress?.toLowerCase() === usdcAddress.toLowerCase();

    const { data: reservesIn } = useReadContract({
        address: OBSCURA_AMM_ADDRESS,
        abi: OBSCURA_AMM_ABI,
        functionName: 'reserves',
        args: tokenInAddress && !isUsdcIn ? [tokenInAddress as `0x${string}`] : undefined,
        query: { enabled: !!tokenInAddress && !isUsdcIn },
    });

    const { data: reservesOut } = useReadContract({
        address: OBSCURA_AMM_ADDRESS,
        abi: OBSCURA_AMM_ABI,
        functionName: 'reserves',
        args: tokenOutAddress && !isUsdcOut ? [tokenOutAddress as `0x${string}`] : undefined,
        query: { enabled: !!tokenOutAddress && !isUsdcOut },
    });

    const amountOut = amountOutBN ? parseFloat(formatUnits(amountOutBN as bigint, decimalsOut)) : 0;

    // A leg has liquidity if either it is USDC (sourced from any pool's USDC
    // reserve) or its (asset,USDC) pool has both reserves > 0.
    const inHasLiq = isUsdcIn ? true : !!reservesIn && (reservesIn as readonly bigint[])[0] > 0n;
    const outHasLiq = isUsdcOut ? true : !!reservesOut && (reservesOut as readonly bigint[])[0] > 0n;
    const hasLiquidity = inHasLiq && outHasLiq && amountOut > 0;

    // Inventory utilization = amountOut / reserveOut on the destination leg,
    // expressed as a percent. Above ~30% the user should consider splitting
    // the trade because the pool is running thin. This replaces the legacy
    // constant-product priceImpact metric that no longer applies to an
    // oracle-priced AMM.
    let inventoryUtilization = 0;
    if (hasLiquidity && enabledQuote) {
        if (isUsdcOut) {
            // selling asset for USDC -> consume the in-pool's USDC reserve
            const tuple = reservesIn as readonly bigint[] | undefined;
            const usdcReserve = tuple ? Number(formatUnits(tuple[1], 6)) : 0;
            if (usdcReserve > 0) inventoryUtilization = (amountOut / usdcReserve) * 100;
        } else {
            // buying `tokenOut` -> consume the out-pool's asset reserve
            const tuple = reservesOut as readonly bigint[] | undefined;
            const reserveAssetRaw = tuple ? Number(formatUnits(tuple[0], decimalsOut)) : 0;
            if (reserveAssetRaw > 0) inventoryUtilization = (amountOut / reserveAssetRaw) * 100;
        }
    }

    return {
        amountOut,
        amountOutBN,
        hasLiquidity,
        feeBps: 30,
        inventoryUtilization,
        // Backwards-compat alias so older consumers don't break.
        priceImpact: 0,
        refetch,
    };
}
