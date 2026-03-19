# Pyth Price Calculation Debug

## Current Contract Code (Lines 154-169):
```solidity
// 3. Calculate output using oracle prices
// Convert Pyth price format: price * 10^expo
int64 normalizedPriceIn = priceIn.price;
int64 normalizedPriceOut = priceOut.price;
int32 expoDiff = priceIn.expo - priceOut.expo;

// Calculate: amountOut = amountIn * (priceIn / priceOut)
if (expoDiff >= 0) {
    amountOut = (amountIn * uint64(normalizedPriceIn)) / 
                (uint64(normalizedPriceOut) * (10 ** uint32(expoDiff)));
} else {
    amountOut = (amountIn * uint64(normalizedPriceIn) * (10 ** uint32(-expoDiff))) / 
                uint64(normalizedPriceOut);
}
```

## Bug Analysis:

### Example Transaction:
- **Input**: 8 USDO (8 * 10^18 wei = 8000000000000000000)
- **USDO Price**: $1.00 (Pyth: price=100000000, expo=-8)
- **AAPL Price**: $273.00 (Pyth: price=27300000000, expo=-8)

### Current Calculation:
```
expoDiff = (-8) - (-8) = 0

amountOut = (8000000000000000000 * 100000000) / (27300000000 * 1)
amountOut = 800000000000000000000000000 / 27300000000
amountOut = 29304029304029 tokens
```

**WRONG!** Returns 29,304 AAPL (way too many!)

### Expected Calculation:
```
Real formula: amountOut = amountIn * (priceIn / priceOut)

In USD terms:
  amountIn in USD = 8 USDO * $1.00 = $8.00
  amountOut = $8.00 / $273.00 = 0.0293 AAPL

In wei (18 decimals):
  amountOut = 0.0293 * 10^18 = 29304029304029304 wei
  = 0.0293 AAPL ✅
```

## Root Cause:

**Missing decimal normalization!**

Current code:
- Takes `amountIn` in token decimals (10^18)
- Doesn't normalize Pyth prices to USD properly
- Formula treats raw price values as if they're already in token decimals

## Correct Formula:

```solidity
// Get Pyth prices in USD (normalize expo to 0)
uint256 priceInUSD_In = convertPythPrice(priceIn);   // $1.00 * 10^8
uint256 priceInUSD_Out = convertPythPrice(priceOut); // $273.00 * 10^8

// Calculate: how many tokenOut tokens equals amountIn USD value?
// amountOut = (amountIn * priceIn) / priceOut
// Both prices normalized to same exponent (e.g., 10^8 for USD)

amountOut = (amountIn * priceInUSD_In) / priceInUSD_Out;
```

## Fix needed:

Normalize both prices to same scale (e.g., 10^8 or 10^18), then divide!
