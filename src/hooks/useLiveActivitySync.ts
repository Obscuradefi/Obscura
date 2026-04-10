import { useState } from 'react';
import { useAccount, useWatchContractEvent } from 'wagmi';
import { formatUnits } from 'viem';
import { addActivity } from '../lib/fluxMock';
import { SIMPLE_AMM_ADDRESS, SIMPLE_AMM_ABI } from '../config/dexConfig';
import { SHIELD_CONTRACT_ADDRESS, SHIELD_ABI } from '../config/shieldConfig';
import { FLUX_ASSETS } from '../data/fluxAssets';

// Keep track of processed transaction hashes in memory
// to prevent duplicate additions on re-renders / re-polls
const processedTxs = new Set<string>();

const getTokenSymbol = (address: string) => {
    if (!address) return 'Token';
    const asset = FLUX_ASSETS.find(a => 
        a.contractAddress && a.contractAddress.toLowerCase() === address.toLowerCase()
    );
    return asset ? asset.symbol : 'Token';
};

export function useLiveActivitySync() {
    const { address } = useAccount();

    // Watch Swap
    useWatchContractEvent({
        address: SIMPLE_AMM_ADDRESS,
        abi: SIMPLE_AMM_ABI,
        eventName: 'Swap',
        args: { user: address }, 
        onLogs(logs) {
            logs.forEach(log => {
                if (!log.transactionHash || processedTxs.has(log.transactionHash)) return;
                
                // Only process events belonging to the currently connected user
                if (log.args.user?.toLowerCase() === address?.toLowerCase()) {
                    processedTxs.add(log.transactionHash);
                    
                    const tokenIn = getTokenSymbol(log.args.tokenIn as string);
                    const tokenOut = getTokenSymbol(log.args.tokenOut as string);
                    const amountIn = formatUnits(log.args.amountIn as bigint, 18);
                    const amountOut = formatUnits(log.args.amountOut as bigint, 18);
                    
                    addActivity({
                        type: 'swap',
                        description: `Swapped ${parseFloat(amountIn).toFixed(2)} ${tokenIn} for ${parseFloat(amountOut).toFixed(2)} ${tokenOut}`
                    });
                }
            });
        },
    });

    // Watch Shielded
    useWatchContractEvent({
        address: SHIELD_CONTRACT_ADDRESS,
        abi: SHIELD_ABI,
        eventName: 'Shielded',
        args: { user: address }, 
        onLogs(logs) {
            logs.forEach(log => {
                if (!log.transactionHash || processedTxs.has(log.transactionHash)) return;

                if (log.args.user?.toLowerCase() === address?.toLowerCase()) {
                    processedTxs.add(log.transactionHash);

                    const token = getTokenSymbol(log.args.token as string);
                    const amount = formatUnits(log.args.amount as bigint, 18);
                    
                    addActivity({
                        type: 'shield',
                        description: `Shielded ${parseFloat(amount).toFixed(2)} ${token}`
                    });
                }
            });
        },
    });

    // Watch Unshielded
    useWatchContractEvent({
        address: SHIELD_CONTRACT_ADDRESS,
        abi: SHIELD_ABI,
        eventName: 'Unshielded',
        args: { user: address }, 
        onLogs(logs) {
            logs.forEach(log => {
                if (!log.transactionHash || processedTxs.has(log.transactionHash)) return;

                if (log.args.user?.toLowerCase() === address?.toLowerCase()) {
                    processedTxs.add(log.transactionHash);

                    const token = getTokenSymbol(log.args.token as string);
                    const amount = formatUnits(log.args.amount as bigint, 18);
                    
                    addActivity({
                        type: 'unshield',
                        description: `Unshielded ${parseFloat(amount).toFixed(2)} ${token}`
                    });
                }
            });
        },
    });
}
