# 🎯 Deploy SimpleAMM_Pyth via Remix IDE

## Step 1: Buka Remix
👉 **https://remix.ethereum.org**

---

## Step 2: Upload Files ke Remix

### **2.1 Buat Folder Structure**
Di Remix sidebar kiri (File Explorer):
```
contracts/
  ├── SimpleAMM_Pyth.sol  ← Main contract
  └── (dependencies auto-loaded by Remix)
```

### **2.2 Copy-Paste Contract**
1. Klik **"Create New File"** → `SimpleAMM_Pyth.sol`
2. Copy isi dari `d:\website\OBSCURA\contracts\SimpleAMM_Pyth.sol`
3. Paste ke Remix editor

---

## Step 3: Compile Contract

### **3.1 Buka Compiler Tab**
- Klik icon **"Solidity Compiler"** (di sidebar kiri)

### **3.2 Settings**
```
Compiler: 0.8.20 atau 0.8.21+
EVM Version: default
Optimization: Enabled (200 runs) ← Optional tapi recommended
```

### **3.3 Compile**
- Klik **"Compile SimpleAMM_Pyth.sol"**
- Tunggu sampai muncul ✅ **green checkmark**

**Kalau ada error import:**
```
Remix akan auto-download dependencies dari npm:
- @openzeppelin/contracts
- @pythnetwork/pyth-sdk-solidity
```

Tunggu sebentar, Remix akan otomatis resolve!

---

## Step 4: Deploy Contract

### **4.1 Buka Deploy Tab**
- Klik icon **"Deploy & Run Transactions"** (di sidebar kiri)

### **4.2 Settings**
```
ENVIRONMENT: Injected Provider - MetaMask
  └─ Ini akan connect ke MetaMask Anda

ACCOUNT: [Your MetaMask account address]

GAS LIMIT: 3000000 (default OK)

CONTRACT: SimpleAMM (dropdown pilih ini)
```

### **4.3 Constructor Parameter**
**PENTING!** Sebelum deploy, isi parameter:

```
_PYTHCONTRACT: 0xA2aa501b19aff244D90cc15a4Cf739D2725B5729
```
☝️ **Ini address Pyth Oracle di Base Sepolia!**

### **4.4 Connect MetaMask**
1. Pastikan MetaMask network: **Base Sepolia**
2. Pastikan punya ETH untuk gas fee

### **4.5 Deploy!**
- Klik **"Deploy"** (orange button)
- Confirm di MetaMask popup
- Tunggu transaction confirmed!

✅ **Contract deployed!** Address akan muncul di "Deployed Contracts" panel

**CATAT CONTRACT ADDRESS INI!**
Example: `0x...` ← Simpan ini!

---

## Step 5: Set Price Feed IDs

Setelah deploy, expand contract di panel "Deployed Contracts":

### **5.1 Set GOLD Price Feed**
```
Function: setPriceFeedId
  token: [GOLD token address]
  priceFeedId: 0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2
  
Klik "transact" → Confirm di MetaMask
```

### **5.2 Set AAPL Price Feed**
```
Function: setPriceFeedId
  token: [AAPL token address]
  priceFeedId: 0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688
  
Klik "transact" → Confirm di MetaMask
```

### **5.3 Set MSTR Price Feed**
```
Function: setPriceFeedId
  token: [MSTR token address]
  priceFeedId: 0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09
  
Klik "transact" → Confirm di MetaMask
```

### **5.4 Set USDT Price Feed**
```
Function: setPriceFeedId
  token: [USDT token address]
  priceFeedId: 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b
  
Klik "transact" → Confirm di MetaMask
```

### **5.5 Set USDe Price Feed**
```
Function: setPriceFeedId
  token: [USDe token address]
  priceFeedId: 0x6ec879b1e9963de5ee97e9c8710b742d6228252a5e2ca12d4ae81d7fe5ee8c5d
  
Klik "transact" → Confirm di MetaMask
```

### **5.6 Set USDO Price Feed**
```
Function: setPriceFeedId
  token: [USDO token address]
  priceFeedId: 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
  
Klik "transact" → Confirm di MetaMask
```

---

## Step 6: Verify Contract (Optional)

### **6.1 Buka BaseScan**
👉 **https://sepolia.basescan.org/address/[YOUR_CONTRACT_ADDRESS]**

### **6.2 Verify & Publish**
- Klik tab **"Contract"**
- Klik **"Verify and Publish"**
- Select: **Solidity (Single file)**
- Compiler: **0.8.20**
- Optimization: **Yes** (200 runs)
- Paste **flattened source code** dari Remix

**Atau pakai Remix Plugin:**
- Install plugin **"Sourcify"** di Remix
- Auto-verify setelah deploy!

---

## Step 7: Test Swap!

### **Test via Remix:**

1. **Approve tokens first:**
   - Buka token contract di Remix
   - Call `approve(spender, amount)`
     - spender: [SimpleAMM contract address]
     - amount: 1000000000000000000000 (1000 tokens)

2. **Call swapWithPyth:**
   - Di SimpleAMM contract panel
   - Expand `swapWithPyth` function
   - Isi parameters:
     ```
     tokenIn: [USDT address]
     tokenOut: [GOLD address]
     amountIn: 10000000000000000000 (10 USDT)
     minAmountOut: 0
     priceUpdate: ["0x..."] ← Need to fetch from Pyth first!
     ```
   - **VALUE (ETH):** 2 wei (for Pyth fee)
   - Klik "transact"

---

## 📝 **Token Addresses (Base Sepolia)**

Ganti dengan address token Anda yang udah deploy:
```
USDT:  0x...
USDe:  0x...
USDO:  0x...
GOLD:  0x...
AAPL:  0x...
MSTR:  0x...
```

---

## ⚠️ **Important Notes**

### **Pyth Price Update:**
Untuk call `swapWithPyth()`, Anda butuh fetch price update dulu dari:
```
https://hermes.pyth.network/v2/updates/price/latest?ids[]=0x765d...
```

Ini lebih mudah dilakukan dari **frontend/JavaScript**, bukan Remix!

### **Alternative Testing:**
Untuk test awal, bisa pakai regular `swap()` function dulu (without Pyth):
```
swap(tokenIn, tokenOut, amountIn, minAmountOut)
```

---

## 🎉 **Done!**

Contract Anda sekarang deployed dengan:
- ✅ AMM swap functionality
- ✅ Pyth oracle integration
- ✅ Price feeds configured

**Next:** Update frontend untuk call `swapWithPyth()` dengan real price data! 🚀
