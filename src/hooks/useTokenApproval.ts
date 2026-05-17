import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';
import { ERC20_ABI } from '../config/dexConfig';
import { OBSCURA_AMM_ADDRESS } from '../config/arc';

/**
 * Track ERC-20 allowance vs a given spender (default: ObscuraAMM) and expose
 * an `approve` button. Decimals must be passed because USDC on Arc is 6 dec.
 */
export function useTokenApproval(
    tokenAddress: string | undefined,
    amount: string,
    decimals: number = 18,
    spenderAddress?: `0x${string}`
) {
    const { address } = useAccount();
    const [needsApproval, setNeedsApproval] = useState(false);
    const spender = spenderAddress || OBSCURA_AMM_ADDRESS;

    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: address && tokenAddress ? [address, spender] : undefined,
        query: {
            enabled: !!address && !!tokenAddress,
        },
    });

    const {
        writeContract: approve,
        data: approvalHash,
        isPending: isApprovePending,
        error: approveError,
    } = useWriteContract();

    const {
        isLoading: isApprovalConfirming,
        isSuccess: isApprovalConfirmed,
    } = useWaitForTransactionReceipt({
        hash: approvalHash,
    });

    useEffect(() => {
        if (!amount || !tokenAddress) {
            setNeedsApproval(false);
            return;
        }
        if (allowance === undefined) {
            setNeedsApproval(true);
            return;
        }
        try {
            const amountBN = parseUnits(amount, decimals);
            setNeedsApproval((allowance as bigint) < amountBN);
        } catch {
            setNeedsApproval(false);
        }
    }, [allowance, amount, tokenAddress, decimals]);

    useEffect(() => {
        if (isApprovalConfirmed) {
            refetchAllowance();
        }
    }, [isApprovalConfirmed, refetchAllowance]);

    const handleApprove = () => {
        if (!tokenAddress || !amount) return;
        try {
            const amountBN = parseUnits(amount, decimals);
            approve({
                address: tokenAddress as `0x${string}`,
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [spender, amountBN],
            });
        } catch (error) {
            console.error('Approval error:', error);
        }
    };

    return {
        needsApproval,
        allowance,
        handleApprove,
        isApprovePending,
        isApprovalConfirming,
        isApprovalConfirmed,
        approvalHash,
        approveError,
    };
}
