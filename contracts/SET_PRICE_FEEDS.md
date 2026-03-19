# 🎯 SET PRICE FEEDS - COPY PASTE GUIDE

**Contract:** `0xa056f6Eee4DF3B8262C6D3a5912584aAae726845`  
**Network:** Base Sepolia

---

## 📋 6 Transactions untuk Set Price Feeds

Di Remix, expand SimpleAMM contract, call function `setPriceFeedId` **6 kali** dengan data berikut:

---

### **1️⃣ AAPL (Apple Stock)**

```
token: 0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A
priceFeedId: 0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688
```

**Click "transact" → Confirm MetaMask** ✅

---

### **2️⃣ USDE (Ethena USDe)**

```
token: 0xCAfb242bE67dc84419750da1C69d6792907d602f
priceFeedId: 0x6ec879b1e9963de5ee97e9c8710b742d6228252a5e2ca12d4ae81d7fe5ee8c5d
```

**Click "transact" → Confirm MetaMask** ✅

---

### **3️⃣ GOLD (Gold Token)**

```
token: 0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a
priceFeedId: 0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2
```

**Click "transact" → Confirm MetaMask** ✅

---

### **4️⃣ MSTR (MicroStrategy Stock)**

```
token: 0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719
priceFeedId: 0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09
```

**Click "transact" → Confirm MetaMask** ✅

---

### **5️⃣ USDO (USDO Stablecoin)**

```
token: 0x191798C747807ae164f2a28fA5DFb5145AcE4b6B
priceFeedId: 0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a
```

**Click "transact" → Confirm MetaMask** ✅

---

### **6️⃣ USDT (Tether USD)**

```
token: 0xdf273C73aE8a405d200e87b869b1C53013e5f64b
priceFeedId: 0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b
```

**Click "transact" → Confirm MetaMask** ✅

---

## ✅ Verification

Setelah 6 transactions selesai, verify dengan call function `priceFeedIds`:

```
priceFeedIds(0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A)
→ Should return: 0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688
```

If returns non-zero bytes32, **SUCCESS!** ✅

---

## 📊 Summary

| Token | Address | Pyth Price Feed |
|-------|---------|-----------------|
| AAPL | `0x8cc4...738A` | Apple/USD Equity |
| USDe | `0xCAfb...602f` | Ethena USDe/USD |
| GOLD | `0xcC4c...E88a` | XAU/USD Commodity |
| MSTR | `0x8Ed9...7719` | MicroStrategy/USD Equity |
| USDO | `0x1917...4b6B` | USDO/USD (via USDC) |
| USDT | `0xdf27...f64b` | Tether/USD Stablecoin |

---

**Total Gas Needed:** ~6 × 50,000 gas = 300,000 gas (~0.0003 ETH on Base Sepolia)

**Next:** After all 6 done, update frontend contract address! 🚀
