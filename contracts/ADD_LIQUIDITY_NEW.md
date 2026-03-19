# 🚀 ADD LIQUIDITY TO NEW CONTRACT

**New SimpleAMM (Pyth Oracle):** `0xa056f6Eee4DF3B8262C6D3a5912584aAae726845`

---

## 📋 STEP-BY-STEP GUIDE

### **Phase 1: APPROVE Tokens** (6 Transactions)

Di Remix, untuk SETIAP token, call function `approve()`:

---

#### **1️⃣ Approve USDO**

**Contract:** `0x191798C747807ae164f2a28fA5DFb5145AcE4b6B` (RialoUSDO)

```
Function: approve
  spender: 0xa056f6Eee4DF3B8262C6D3a5912584aAae726845
  amount: 999999999999999999999999999999
```

**Click "transact" → Confirm MetaMask** ✅

---

#### **2️⃣ Approve USDT**

**Contract:** `0xdf273C73aE8a405d200e87b869b1C53013e5f64b` (RialoUSDT)

```
Function: approve
  spender: 0xa056f6Eee4DF3B8262C6D3a5912584aAae726845
  amount: 999999999999999999999999999999
```

**Click "transact" → Confirm MetaMask** ✅

---

#### **3️⃣ Approve USDe**

**Contract:** `0xCAfb242bE67dc84419750da1C69d6792907d602f` (RialoUSDe)

```
Function: approve
  spender: 0xa056f6Eee4DF3B8262C6D3a5912584aAae726845
  amount: 999999999999999999999999999999
```

**Click "transact" → Confirm MetaMask** ✅

---

#### **4️⃣ Approve GOLD**

**Contract:** `0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a` (RialoGOLD)

```
Function: approve
  spender: 0xa056f6Eee4DF3B8262C6D3a5912584aAae726845
  amount: 999999999999999999999999999999
```

**Click "transact" → Confirm MetaMask** ✅

---

#### **5️⃣ Approve AAPL**

**Contract:** `0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A` (RialoAAPL)

```
Function: approve
  spender: 0xa056f6Eee4DF3B8262C6D3a5912584aAae726845
  amount: 999999999999999999999999999999
```

**Click "transact" → Confirm MetaMask** ✅

---

#### **6️⃣ Approve MSTR**

**Contract:** `0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719` (RialoMSTR)

```
Function: approve
  spender: 0xa056f6Eee4DF3B8262C6D3a5912584aAae726845
  amount: 999999999999999999999999999999
```

**Click "transact" → Confirm MetaMask** ✅

---

## ✅ Phase 1 Complete!

**6 Approvals done!** Now proceed to Phase 2.

---

### **Phase 2: ADD LIQUIDITY** (6 Transactions)

Di Remix, load **SimpleAMM contract** (`0xa056f6Ee...`), call function `addLiquidity()` **6 kali**:

---

#### **1️⃣ Add USDO Liquidity**

```
Function: addLiquidity
  token: 0x191798C747807ae164f2a28fA5DFb5145AcE4b6B
  amount: 100000000000000000000000
```

**Amount:** 100,000 USDO (100000 * 10^18)  
**Click "transact" → Confirm MetaMask** ✅

---

#### **2️⃣ Add USDT Liquidity**

```
Function: addLiquidity
  token: 0xdf273C73aE8a405d200e87b869b1C53013e5f64b
  amount: 100000000000000000000000
```

**Amount:** 100,000 USDT  
**Click "transact" → Confirm MetaMask** ✅

---

#### **3️⃣ Add USDe Liquidity**

```
Function: addLiquidity
  token: 0xCAfb242bE67dc84419750da1C69d6792907d602f
  amount: 100000000000000000000000
```

**Amount:** 100,000 USDe  
**Click "transact" → Confirm MetaMask** ✅

---

#### **4️⃣ Add GOLD Liquidity**

```
Function: addLiquidity
  token: 0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a
  amount: 100000000000000000000000
```

**Amount:** 100,000 GOLD  
**Click "transact" → Confirm MetaMask** ✅

---

#### **5️⃣ Add AAPL Liquidity**

```
Function: addLiquidity
  token: 0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A
  amount: 100000000000000000000000
```

**Amount:** 100,000 AAPL  
**Click "transact" → Confirm MetaMask** ✅

---

#### **6️⃣ Add MSTR Liquidity**

```
Function: addLiquidity
  token: 0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719
  amount: 100000000000000000000000
```

**Amount:** 100,000 MSTR  
**Click "transact" → Confirm MetaMask** ✅

---

## ✅ Phase 2 Complete!

**All liquidity added!** Now verify.

---

### **Phase 3: VERIFY RESERVES**

Di Remix, call function `reserves()` untuk check:

```
Function: reserves
  token: 0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a (GOLD)

Expected Output: 100000000000000000000000 (100k GOLD)
```

If returns **non-zero**, **SUCCESS!** ✅

---

## 📊 Summary

After all 12 transactions (6 approves + 6 add liquidity):

| Token | Reserve | LP Shares |
|-------|---------|-----------|
| USDO | 100,000 | 100,000 |
| USDT | 100,000 | 100,000 |
| USDe | 100,000 | 100,000 |
| GOLD | 100,000 | 100,000 |
| AAPL | 100,000 | 100,000 |
| MSTR | 100,000 | 100,000 |

**Total Gas:** ~12 × 100k gas = 1.2M gas (~0.001 ETH)

---

## 🎯 Next: TEST SWAP!

1. Buka app: http://localhost:5173/app
2. Go to Swap tab
3. Swap USDO → GOLD (10 USDO)
4. Should work! 🎉

---

## ⚠️ Troubleshooting

### "Insufficient balance" error?
→ Mint tokens first! Call `mint(your_wallet, amount)` on each token contract

### "Transfer failed"?
→ Check approval: call `allowance(your_wallet, SimpleAMM_address)`

### "Insufficient liquidity"?
→ Verify reserves: call `reserves(token_address)`
