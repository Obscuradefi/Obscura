
import { parseAbi } from 'viem';

export const SHIELD_CONTRACT_ADDRESS = '0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45'; 

export const SHIELD_ABI = parseAbi([
    'function shield(address token, uint256 amount) external',
    'function unshield(address token, uint256 amount) external',
    'function getEncryptedBalance(address user, address token) view returns (uint256)',
    'event Shielded(address indexed user, address indexed token, uint256 amount)',
    'event Unshielded(address indexed user, address indexed token, uint256 amount)'
]);

export const PRIVACY_TOKENS: Record<string, string> = {
    'USDO': 'cUSDO',
    'USDT': 'cUSDT',
    'USDe': 'cUSDe',
};
