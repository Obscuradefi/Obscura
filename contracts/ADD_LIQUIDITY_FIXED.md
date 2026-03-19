# Add Liquidity - Fixed SimpleAMM Contract

**New Contract Address:** `0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB`

---

## 📋 **Complete Liquidity Setup**

For each of the 6 tokens, you need to do **2 transactions**:
1. **Approve** token to new contract
2. **Add Liquidity** to the pool

---

## 🔧 **Step-by-Step Guide**

### **1. USDO**

**Contract:** `0x191798C747807ae164f2a28fA5DFb5145AcE4b6B`

**Transaction 1 - Approve:**
```
Function: approve
spender: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
amount: 100000000000000000000000
```

**Transaction 2 - Add Liquidity:**
```
Contract: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
Function: addLiquidity
token: 0x191798C747807ae164f2a28fA5DFb5145AcE4b6B
amount: 100000000000000000000000
```

---

### **2. USDT**

**Contract:** `0xdf273C73aE8a405d200e87b869b1C53013e5f64b`

**Transaction 1 - Approve:**
```
Function: approve
spender: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
amount: 100000000000000000000000
```

**Transaction 2 - Add Liquidity:**
```
Contract: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
Function: addLiquidity
token: 0xdf273C73aE8a405d200e87b869b1C53013e5f64b
amount: 100000000000000000000000
```

---

### **3. USDe**

**Contract:** `0xCAfb242bE67dc84419750da1C69d6792907d602f`

**Transaction 1 - Approve:**
```
Function: approve
spender: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
amount: 100000000000000000000000
```

**Transaction 2 - Add Liquidity:**
```
Contract: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
Function: addLiquidity
token: 0xCAfb242bE67dc84419750da1C69d6792907d602f
amount: 100000000000000000000000
```

---

### **4. GOLD**

**Contract:** `0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a`

**Transaction 1 - Approve:**
```
Function: approve
spender: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
amount: 100000000000000000000000
```

**Transaction 2 - Add Liquidity:**
```
Contract: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
Function: addLiquidity
token: 0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a
amount: 100000000000000000000000
```

---

### **5. AAPL**

**Contract:** `0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A`

**Transaction 1 - Approve:**
```
Function: approve
spender: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
amount: 100000000000000000000000
```

**Transaction 2 - Add Liquidity:**
```
Contract: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
Function: addLiquidity
token: 0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A
amount: 100000000000000000000000
```

---

### **6. MSTR**

**Contract:** `0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719`

**Transaction 1 - Approve:**
```
Function: approve
spender: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
amount: 100000000000000000000000
```

**Transaction 2 - Add Liquidity:**
```
Contract: 0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB
Function: addLiquidity
token: 0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719
amount: 100000000000000000000000
```

---

## ✅ **Summary**

**Total Transactions:** 12 (6 approvals + 6 liquidity adds)

**Amount per token:** 100,000 tokens (100000000000000000000000 wei)

**Contract:** `0x8C03D994FBbF2793B4572C1A557b1744Aa13b1bB`

---

## ⚡ **Tips:**

1. **Copy-paste** addresses carefully (no spaces!)
2. **Confirm** each transaction in MetaMask
3. **Wait** for confirmation before next transaction
4. **Check reserves** after all done: call `reserves(tokenAddress)` on new contract

---

**Start with USDO and work through the list!** 🚀
