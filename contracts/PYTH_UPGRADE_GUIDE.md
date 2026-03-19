# 🚀 Upgrade SimpleAMM dengan Pyth Oracle

## 📋 **Apa yang Berubah?**

### **SEBELUM** (SimpleAMM.sol):
```
✅ swap() - menggunakan pool ratio (1:1)
❌ Harga tidak akurat! (1 USDO = 1 GOLD, padahal harusnya 1:5000)
```

### **SESUDAH** (SimpleAMM_Pyth.sol):
```
✅ swap() - tetap ada, pakai pool ratio
✅ swapWithPyth() - pakai real market price dari Pyth oracle!
```

---

## 🔧 **Step-by-Step Deployment**

### **Step 1: Install Pyth SDK**

```bash
cd d:\website\OBSCURA\contracts

# Install dependency
forge install pyth-network/pyth-sdk-solidity --no-commit
```

### **Step 2: Update foundry.toml**

Tambahkan remapping untuk Pyth:

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = [
    "@openzeppelin/=lib/openzeppelin-contracts/",
    "@pythnetwork/=lib/pyth-sdk-solidity/"
]
```

### **Step 3: Compile Contract**

```bash
forge build
```

Kalau ada error, cek:
- ✅ Pyth SDK terinstall di `lib/pyth-sdk-solidity`
- ✅ OpenZeppelin terinstall di `lib/openzeppelin-contracts`

### **Step 4: Deploy Contract Baru**

```bash
# Address Pyth Contract di Base Sepolia
PYTH_ADDRESS=0xA2aa501b19aff244D90cc15a4Cf739D2725B5729

forge create --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --constructor-args $PYTH_ADDRESS \
  SimpleAMM_Pyth.sol:SimpleAMM \
  --legacy
```

**CATAT ADDRESS CONTRACT BARU!** (example: `0x...`)

### **Step 5: Set Price Feed IDs**

Setelah deploy, set price feed untuk setiap token:

```bash
# Contract address dari step 4
CONTRACT_ADDRESS=0x...

# Set GOLD price feed
cast send $CONTRACT_ADDRESS \
  "setPriceFeedId(address,bytes32)" \
  $GOLD_TOKEN_ADDRESS \
  0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2 \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --legacy

# Set AAPL price feed
cast send $CONTRACT_ADDRESS \
  "setPriceFeedId(address,bytes32)" \
  $AAPL_TOKEN_ADDRESS \
  0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688 \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --legacy

# Set MSTR price feed
cast send $CONTRACT_ADDRESS \
  "setPriceFeedId(address,bytes32)" \
  $MSTR_TOKEN_ADDRESS \
  0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09 \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --legacy

# Set USDT price feed
cast send $CONTRACT_ADDRESS \
  "setPriceFeedId(address,bytes32)" \
  $USDT_TOKEN_ADDRESS \
  0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY \
  --legacy
```

### **Step 6: Add Liquidity (Optional)**

Transfer tokens ke contract untuk liquidity:

```bash
# Approve tokens
cast send $GOLD_TOKEN_ADDRESS \
  "approve(address,uint256)" \
  $CONTRACT_ADDRESS \
  100000000000000000000000 \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY

# Add liquidity
cast send $CONTRACT_ADDRESS \
  "addLiquidity(address,uint256)" \
  $GOLD_TOKEN_ADDRESS \
  100000000000000000000000 \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

---

## 🎯 **Cara Pakai di Frontend**

### **1. Fetch Pyth Price Update**

```typescript
// lib/pythClient.ts
export async function getPythPriceUpdate(priceIds: string[]): Promise<string[]> {
    const url = `https://hermes.pyth.network/v2/updates/price/latest?` +
        priceIds.map(id => `ids[]=${id}`).join('&');
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Return hex-encoded update data
    return [`0x${data.binary.data[0]}`];
}
```

### **2. Call swapWithPyth()**

```typescript
// hooks/useAMMSwap.ts
import { getPythPriceUpdate } from '../lib/pythClient';

export function useAMMSwap() {
    const swapWithOracle = async (
        tokenIn: Address,
        tokenOut: Address,
        amountIn: bigint,
        minAmountOut: bigint
    ) => {
        // 1. Get price feed IDs
        const priceIds = [
            PYTH_PRICE_IDS[tokenInSymbol],
            PYTH_PRICE_IDS[tokenOutSymbol]
        ];
        
        // 2. Fetch Pyth update blob
        const priceUpdate = await getPythPriceUpdate(priceIds);
        
        // 3. Calculate update fee (usually 1-2 wei per feed)
        const updateFee = BigInt(priceIds.length);
        
        // 4. Call contract with ETH for update fee
        const tx = await writeContract({
            address: SIMPLE_AMM_ADDRESS,
            abi: SimpleAMMABI,
            functionName: 'swapWithPyth',
            args: [tokenIn, tokenOut, amountIn, minAmountOut, priceUpdate],
            value: updateFee, // Pay Pyth update fee
        });
        
        return tx;
    };
    
    return { swapWithOracle };
}
```

---

## ✅ **Testing**

### **Test 1: Swap dengan Pool (AMM)**
```bash
# Regular swap (pool-based)
cast send $CONTRACT_ADDRESS \
  "swap(address,address,uint256,uint256)" \
  $USDO_ADDRESS \
  $GOLD_ADDRESS \
  10000000000000000000 \
  0 \
  --rpc-url https://sepolia.base.org \
  --private-key $PRIVATE_KEY
```

### **Test 2: Swap dengan Oracle (Accurate!)**
```bash
# Get price update from Hermes first
curl "https://hermes.pyth.network/v2/updates/price/latest?ids[]=0x765d..." > update.json

# Then call swapWithPyth (need to encode priceUpdate bytes)
# This is easier from frontend/JavaScript
```

---

## 📊 **Perbandingan**

| Method | Pricing | Accuracy | Cost |
|--------|---------|----------|------|
| `swap()` | Pool ratio (1:1) | ❌ Wrong | Gas only |
| `swapWithPyth()` | Pyth oracle | ✅ Accurate | Gas + 1 wei |

---

## 🎉 **Done!**

Contract sekarang support 2 mode:
1. **AMM Mode**: `swap()` - fast tapi price sesuai pool
2. **Oracle Mode**: `swapWithPyth()` - accurate market price!

User bisa pilih mana yang mau dipakai! 🚀
