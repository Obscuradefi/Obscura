// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";

/**
 * @title SimpleAMM with Pyth Oracle
 * @notice AMM with both pool-based pricing and oracle-assisted pricing
 * @dev Supports swaps using either AMM formula or Pyth Network oracle prices
 */
contract SimpleAMM is Ownable, ReentrancyGuard {
    // Fee: 0.3% = 3/1000
    uint256 public constant FEE_NUMERATOR = 3;
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // Pyth Oracle
    IPyth public pyth;
    
    // Reserves for each token
    mapping(address => uint256) public reserves;
    
    // Pyth Price Feed IDs for each token
    mapping(address => bytes32) public priceFeedIds;
    
    // Liquidity shares for each provider
    mapping(address => mapping(address => uint256)) public liquidityShares;
    mapping(address => uint256) public totalShares;
    
    // Events
    event LiquidityAdded(address indexed provider, address indexed token, uint256 amount, uint256 shares);
    event LiquidityRemoved(address indexed provider, address indexed token, uint256 amount, uint256 shares);
    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event SwapWithOracle(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event PriceFeedUpdated(address indexed token, bytes32 priceFeedId);
    
    constructor(address _pythContract) Ownable(msg.sender) {
        pyth = IPyth(_pythContract);
    }
    
    /**
     * @notice Set Pyth price feed ID for a token
     * @param token Token address
     * @param priceFeedId Pyth price feed ID (hex format)
     */
    function setPriceFeedId(address token, bytes32 priceFeedId) external onlyOwner {
        priceFeedIds[token] = priceFeedId;
        emit PriceFeedUpdated(token, priceFeedId);
    }
    
    /**
     * @notice Calculate output amount for a swap using constant product formula
     * @dev Formula: amountOut = (reserveOut * amountIn * 997) / (reserveIn * 1000 + amountIn * 997)
     */
    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) 
        public 
        view 
        returns (uint256 amountOut) 
    {
        require(amountIn > 0, "Invalid input amount");
        require(reserves[tokenIn] > 0 && reserves[tokenOut] > 0, "Insufficient liquidity");
        
        uint256 reserveIn = reserves[tokenIn];
        uint256 reserveOut = reserves[tokenOut];
        
        // Apply 0.3% fee (multiply by 997/1000)
        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);
        uint256 numerator = reserveOut * amountInWithFee;
        uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;
        
        amountOut = numerator / denominator;
    }
    
    /**
     * @notice Execute a token swap using AMM pool pricing
     */
    function swap(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 minAmountOut
    ) 
        external 
        nonReentrant 
    {
        require(amountIn > 0, "Invalid input amount");
        require(reserves[tokenIn] > 0 && reserves[tokenOut] > 0, "Insufficient liquidity");
        
        uint256 amountOut = getAmountOut(tokenIn, tokenOut, amountIn);
        require(amountOut >= minAmountOut, "Slippage too high");
        require(amountOut <= reserves[tokenOut], "Insufficient output reserve");
        
        // Transfer tokens in
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "Transfer in failed"
        );
        
        // Update reserves
        reserves[tokenIn] += amountIn;
        reserves[tokenOut] -= amountOut;
        
        // Transfer tokens out
        require(
            IERC20(tokenOut).transfer(msg.sender, amountOut),
            "Transfer out failed"
        );
        
        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }
    
    /**
     * @notice Execute swap using Pyth oracle prices (ACCURATE MARKET PRICING!)
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param minAmountOut Minimum output (slippage protection)
     * @param priceUpdate Pyth price update data from Hermes API
     */
    function swapWithPyth(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        bytes[] calldata priceUpdate
    ) 
        external 
        payable 
        nonReentrant 
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Invalid input amount");
        require(priceFeedIds[tokenIn] != bytes32(0), "Price feed not set for tokenIn");
        require(priceFeedIds[tokenOut] != bytes32(0), "Price feed not set for tokenOut");
        
        // 1. Update Pyth oracle prices (pay small fee)
        uint256 updateFee = pyth.getUpdateFee(priceUpdate);
        require(msg.value >= updateFee, "Insufficient update fee");
        pyth.updatePriceFeeds{value: updateFee}(priceUpdate);
        
        // 2. Get current prices from oracle (max 60 seconds old)
        PythStructs.Price memory priceIn = pyth.getPriceNoOlderThan(
            priceFeedIds[tokenIn],
            60
        );
        PythStructs.Price memory priceOut = pyth.getPriceNoOlderThan(
            priceFeedIds[tokenOut],
            60
        );
        
        // 3. Calculate output using oracle prices with proper normalization
        // Formula: amountOut = amountIn * (priceIn / priceOut)
        // 
        // Pyth prices: actual_price = price * 10^expo
        // We normalize both prices to 18 decimals to match ERC20 token decimals
        //
        // Example: 
        //   USDO: price=100000000, expo=-8 → $1.00
        //   AAPL: price=27300000000, expo=-8 → $273.00
        //   10 USDO → 10 * $1 / $273 = 0.0366 AAPL ✅
        
        // Normalize prices to 18 decimals (standard ERC20)
        uint256 priceInNormalized = _normalizePythPrice(priceIn);
        uint256 priceOutNormalized = _normalizePythPrice(priceOut);
        
        // Calculate output: (amountIn * priceIn / priceOut)
        // This gives us the token amount based on USD value
        amountOut = (amountIn * priceInNormalized) / priceOutNormalized;
        
        // 4. Apply 0.3% fee
        uint256 fee = (amountOut * FEE_NUMERATOR) / FEE_DENOMINATOR;
        amountOut = amountOut - fee;
        
        // 5. Slippage protection
        require(amountOut >= minAmountOut, "Slippage too high");
        
        // 6. Check contract has enough tokens
        require(
            IERC20(tokenOut).balanceOf(address(this)) >= amountOut,
            "Insufficient contract balance"
        );
        
        // 7. Transfer tokens
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "Transfer in failed"
        );
        
        require(
            IERC20(tokenOut).transfer(msg.sender, amountOut),
            "Transfer out failed"
        );
        
        emit SwapWithOracle(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        
        // Refund excess ETH
        if (msg.value > updateFee) {
            payable(msg.sender).transfer(msg.value - updateFee);
        }
        
        return amountOut;
    }
    
    /**
     * @notice Normalize Pyth price to 18 decimals
     * @dev Converts Pyth price format (price * 10^expo) to standard 18 decimal format
     * @param pythPrice Pyth price struct with price and expo
     * @return normalized price in 18 decimals
     */
    function _normalizePythPrice(PythStructs.Price memory pythPrice) 
        internal 
        pure 
        returns (uint256) 
    {
        // Pyth price format: actualPrice = price * 10^expo
        // We want to convert to 18 decimals
        
        int64 price = pythPrice.price;
        int32 expo = pythPrice.expo;
        
        require(price > 0, "Invalid Pyth price");
        
        // Target: 18 decimals
        // If expo = -8, we need to multiply by 10^(18 - 8) = 10^10
        // If expo = -6, we need to multiply by 10^(18 - 6) = 10^12
        int32 adjustment = 18 + expo; // +expo because expo is negative
        
        uint256 normalizedPrice;
        
        if (adjustment >= 0) {
            // Need to scale up
            normalizedPrice = uint64(price) * (10 ** uint32(adjustment));
        } else {
            // Need to scale down
            normalizedPrice = uint64(price) / (10 ** uint32(-adjustment));
        }
        
        return normalizedPrice;
    }
    
    /**
     * @notice Add liquidity to a token pool
     */
    function addLiquidity(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        uint256 shares;
        if (totalShares[token] == 0) {
            shares = amount;
        } else {
            shares = (amount * totalShares[token]) / reserves[token];
        }
        
        reserves[token] += amount;
        liquidityShares[msg.sender][token] += shares;
        totalShares[token] += shares;
        
        emit LiquidityAdded(msg.sender, token, amount, shares);
    }
    
    /**
     * @notice Remove liquidity from a token pool
     */
    function removeLiquidity(address token, uint256 shares) external nonReentrant {
        require(shares > 0, "Invalid shares");
        require(liquidityShares[msg.sender][token] >= shares, "Insufficient shares");
        
        uint256 amount = (shares * reserves[token]) / totalShares[token];
        require(amount > 0, "Insufficient amount");
        
        liquidityShares[msg.sender][token] -= shares;
        totalShares[token] -= shares;
        reserves[token] -= amount;
        
        require(
            IERC20(token).transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit LiquidityRemoved(msg.sender, token, amount, shares);
    }
    
    /**
     * @notice Get pool price ratio
     */
    function getPrice(address tokenIn, address tokenOut) 
        external 
        view 
        returns (uint256 price) 
    {
        require(reserves[tokenIn] > 0 && reserves[tokenOut] > 0, "No liquidity");
        price = (reserves[tokenOut] * 1e18) / reserves[tokenIn];
    }
    
    /**
     * @notice Emergency withdrawal (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @notice Receive ETH for Pyth update fees
     */
    receive() external payable {}
}
