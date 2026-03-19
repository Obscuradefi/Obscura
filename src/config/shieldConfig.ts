// Config for Rialo Shield/Unshield features
import { parseAbi } from 'viem';

// NOTE: This address needs to be updated after deployment.
// For now, we can use a placeholder or the user can deploy the contract provided in /contracts/RialoPrivacyPool.sol
export const SHIELD_CONTRACT_ADDRESS = '0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45'; // Placeholder (Hardhat default 1) or update with real deploy

export const SHIELD_ABI = parseAbi([
    'function shield(address token, uint256 amount) external',
    'function unshield(address token, uint256 amount) external',
    'function getEncryptedBalance(address user, address token) view returns (uint256)',
    'event Shielded(address indexed user, address indexed token, uint256 amount)',
    'event Unshielded(address indexed user, address indexed token, uint256 amount)'
]);

// Map public tokens to their "Privacy" display names
export const PRIVACY_TOKENS: Record<string, string> = {
    'USDO': 'cUSDO',
    'USDT': 'cUSDT',
    'USDe': 'cUSDe',
};
