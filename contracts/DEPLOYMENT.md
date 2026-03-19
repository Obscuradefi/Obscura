# SimpleAMM Deployment Guide

## Prerequisites
- Solidity compiler (>= 0.8.20)
- Hardhat or Remix IDE
- Base Sepolia testnet ETH
- OpenZeppelin contracts

## Option 1: Deploy with Remix (Easiest)

1. **Open Remix IDE**: https://remix.ethereum.org

2. **Create new file**: `SimpleAMM.sol`
   - Copy contract from: `d:\website\OBSCURA\contracts\SimpleAMM.sol`

3. **Install OpenZeppelin**:
   - Go to "File Explorer" → "Install from npm"
   - Install: `@openzeppelin/contracts@5.0.0`

4. **Compile**:
   - Select compiler version: `0.8.20+`
   - Click "Compile SimpleAMM.sol"

5. **Deploy to Base Sepolia**:
   - Switch MetaMask to Base Sepolia
   - In Remix: Deploy & Run Transactions tab
   - Environment: "Injected Provider - MetaMask"
   - Select contract: "SimpleAMM"
   - Click "Deploy"
   - Confirm transaction in MetaMask

6. **Copy deployed address**:
   - After deployment, copy contract address
   - Update `SIMPLE_AMM_ADDRESS` in `src/config/dexConfig.ts`

## Option 2: Deploy with Hardhat

```bash
# Install dependencies
npm install --save-dev hardhat @openzeppelin/contracts

# Create deployment script
npx hardhat run scripts/deploy-amm.js --network baseSepolia
```

## Setelah Deploy Contract

### 1. Update Contract Address (Wajib!)
Setelah deploy berhasil, copy contract address dari Remix, lalu update file `src/config/dexConfig.ts`:

```typescript
// Ganti address ini dengan address contract yang baru di-deploy
export const SIMPLE_AMM_ADDRESS = '0xYOUR_DEPLOYED_ADDRESS_HERE' as const;
```

**Cara copy address:**
- Di Remix, setelah deploy, lihat di bagian "Deployed Contracts"
- Copy address yang muncul (contoh: `0xABCD...1234`)
- Paste ke file config

---

### 2. Tambah Liquidity Awal (Penting!)

AMM butuh liquidity untuk bisa jalan! Untuk setiap token, ikuti 3 langkah ini:

#### Langkah A: Mint Token (Kalau belum punya)

Karena token Anda punya fungsi `mint()` public, bisa mint sebanyak yang mau:

**Di Remix atau BaseScan:**

**Token Addresses (Base Sepolia):**
- AAPL: `0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A`
- USDe: `0xCAfb242bE67dc84419750da1C69d6792907d602f`
- GOLD: `0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a`
- MSTR: `0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719`
- USDO: `0x191798C747807ae164f2a28fA5DFb5145AcE4b6B`
- USDT: `0xdf273C73aE8a405d200e87b869b1C53013e5f64b`

1. Buka contract token di Remix/BaseScan
2. Panggil fungsi: `mint(address to, uint256 amount)`
   - `to`: **Wallet address Anda**
   - `amount`: **Jumlah token** (dalam wei, misal `1000000000000000000000` = 1000 token)
3. Confirm transaction

**Saran jumlah untuk testing:**
- USDO: 100,000 tokens
- AAPL: 500 tokens  
- GOLD: 50 tokens
- USDT: 100,000 tokens
- USDe: 100,000 tokens
- MSTR: 100 tokens

#### Langkah B: Approve AMM Contract

Sebelum add liquidity, contract AMM harus di-approve dulu untuk transfer token Anda:

**Untuk SETIAP token:**
1. Buka contract token di Remix/BaseScan
2. Panggil fungsi: `approve(address spender, uint256 amount)`
   - `spender`: **SimpleAMM contract address** (yang baru di-deploy)
   - `amount`: **Jumlah besar** (misal `999999999999999999999999999999` untuk unlimited)
3. Confirm transaction
4. Tunggu konfirmasi

**Ulangi untuk semua token** (USDO, AAPL, GOLD, USDT, USDe, MSTR)

#### Langkah C: Add Liquidity via UI

Setelah approve selesai:
1. Buka aplikasi OBSCURA: `http://localhost:5173/app`
2. Klik tab **"Liquidity"** (akan saya buat nanti)
3. Pilih token yang mau ditambah liquidity
4. Input jumlah
5. Klik "Add Liquidity"
6. Confirm di MetaMask

**ATAU** bisa langsung via Remix:
1. Buka SimpleAMM contract yang sudah di-deploy
2. Panggil fungsi: `addLiquidity(address token, uint256 amount)`
   - `token`: Address token (misal AAPL address)
   - `amount`: Jumlah (dalam wei, contoh: `500000000000000000000` = 500 tokens)
3. Confirm transaction

**Contoh liquidity untuk testing:**
- Pool USDO: 100,000 tokens
- Pool AAPL: 500 tokens (→ harga AAPL = 100000/500 = $200 per AAPL)
- Pool GOLD: 50 tokens (→ harga GOLD = 100000/50 = $2000 per GOLD)
- Pool USDT: 100,000 tokens
- Pool USDe: 100,000 tokens  
- Pool MSTR: 100 tokens

## Verification

After adding liquidity, test AMM swap:
1. Go to Swap tab
2. Select small amount (triggers AMM route)
3. See dynamic pricing from pool reserves
4. Execute swap
5. Verify pricing changes based on reserves

## Contract Functions

### Read Functions
- `reserves(address token)` - Get token reserve
- `getAmountOut(tokenIn, tokenOut, amountIn)` - Preview swap output
- `getPrice(tokenIn, tokenOut)` - Get current price
- `liquidityShares(provider, token)` - Get LP shares

### Write Functions
- `swap(tokenIn, tokenOut, amountIn, minAmountOut)` - Execute swap
- `addLiquidity(token, amount)` - Add liquidity
- `removeLiquidity(token, shares)` - Remove liquidity
