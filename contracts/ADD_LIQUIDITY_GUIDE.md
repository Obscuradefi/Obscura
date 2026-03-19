# Quick Guide: Add Liquidity 100,000 untuk Semua Token

## Prerequisites
✅ SimpleAMM contract sudah di-deploy
✅ Sudah approve semua token ke SimpleAMM contract

---

## Amount dalam Wei
**100,000 tokens = `100000000000000000000000` (23 digit)**

Ini adalah amount yang akan digunakan untuk semua token.

---

## Step-by-Step Add Liquidity

Untuk setiap token di bawah, panggil fungsi `addLiquidity` di SimpleAMM contract:

### 1. USDO
```solidity
addLiquidity(
    "0x191798C747807ae164f2a28fA5DFb5145AcE4b6B",
    "100000000000000000000000"
)
```

### 2. USDT
```solidity
addLiquidity(
    "0xdf273C73aE8a405d200e87b869b1C53013e5f64b",
    "100000000000000000000000"
)
```

### 3. USDe
```solidity
addLiquidity(
    "0xCAfb242bE67dc84419750da1C69d6792907d602f",
    "100000000000000000000000"
)
```

### 4. GOLD
```solidity
addLiquidity(
    "0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a",
    "100000000000000000000000"
)
```

### 5. AAPL
```solidity
addLiquidity(
    "0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A",
    "100000000000000000000000"
)
```

### 6. MSTR
```solidity
addLiquidity(
    "0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719",
    "100000000000000000000000"
)
```

---

## Cara Execute di Remix

1. **Buka SimpleAMM contract** yang sudah di-deploy
2. **Expand "addLiquidity" function**
3. **Input parameters:**
   - `token`: Copy address dari list di atas
   - `amount`: `100000000000000000000000`
4. **Click "transact"**
5. **Confirm di MetaMask**
6. **Tunggu konfirmasi**
7. **Ulangi untuk token berikutnya**

---

## Expected Result

Setelah semua liquidity ditambahkan, harga di AMM akan menjadi:

- **USDO/USDT** = 1:1 (100k / 100k)
- **USDO/USDe** = 1:1 (100k / 100k)
- **USDO/GOLD** = 1:1 (100k / 100k)
- **USDO/AAPL** = 1:1 (100k / 100k)
- **USDO/MSTR** = 1:1 (100k / 100k)

**Note:** Harga 1:1 ini untuk initial liquidity. Nanti bisa disesuaikan dengan menambah/kurangi liquidity per token.

---

## Checklist

- [ ] USDO - 100,000 tokens
- [ ] USDT - 100,000 tokens
- [ ] USDe - 100,000 tokens
- [ ] GOLD - 100,000 tokens
- [ ] AAPL - 100,000 tokens
- [ ] MSTR - 100,000 tokens

---

## Troubleshooting

**Error: "Transfer failed"**
→ Cek approval! Pastikan semua token sudah di-approve ke SimpleAMM contract

**Error: "Insufficient balance"**
→ Mint token dulu atau kurangi amount

**Gas terlalu mahal?**
→ Normal untuk Base Sepolia, tunggu gas turun atau proceed
