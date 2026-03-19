// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleAMM
 * @notice Automated Market Maker with constant product formula (x*y=k)
 * @dev Supports multiple token pairs, all paired with USDO as base
 */
contract SimpleAMM is Ownable, ReentrancyGuard {
    // Fee: 0.3% = 3/1000
    uint256 public constant FEE_NUMERATOR = 3;
    uint256 public constant FEE_DENOMINATOR = 1000;
    
    // Reserves for each token
    mapping(address => uint256) public reserves;
    
    // Liquidity shares for each provider
    mapping(address => mapping(address => uint256)) public liquidityShares;
    mapping(address => uint256) public totalShares;
    
    // Events
    event LiquidityAdded(address indexed provider, address indexed token, uint256 amount, uint256 shares);
    event LiquidityRemoved(address indexed provider, address indexed token, uint256 amount, uint256 shares);
    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Calculate output amount for a swap using constant product formula
     * @dev Formula: amountOut = (reserveOut * amountIn * 997) / (reserveIn * 1000 + amountIn * 997)
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @return amountOut Output amount after fees
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
     * @notice Execute a token swap
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @param minAmountOut Minimum output amount (slippage protection)
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
     * @notice Add liquidity to a token pool
     * @param token Token address
     * @param amount Amount to add
     */
    function addLiquidity(address token, uint256 amount) external nonReentrant {
        require(amount > 0, "Invalid amount");
        
        // Transfer tokens to contract
        require(
            IERC20(token).transferFrom(msg.sender, address(this), amount),
            "Transfer failed"
        );
        
        // Calculate shares
        uint256 shares;
        if (totalShares[token] == 0) {
            // First liquidity provider gets shares equal to amount
            shares = amount;
        } else {
            // shares = (amount * totalShares) / currentReserve
            shares = (amount * totalShares[token]) / reserves[token];
        }
        
        // Update state
        reserves[token] += amount;
        liquidityShares[msg.sender][token] += shares;
        totalShares[token] += shares;
        
        emit LiquidityAdded(msg.sender, token, amount, shares);
    }
    
    /**
     * @notice Remove liquidity from a token pool
     * @param token Token address
     * @param shares Amount of shares to burn
     */
    function removeLiquidity(address token, uint256 shares) external nonReentrant {
        require(shares > 0, "Invalid shares");
        require(liquidityShares[msg.sender][token] >= shares, "Insufficient shares");
        
        // Calculate token amount: amount = (shares * reserve) / totalShares
        uint256 amount = (shares * reserves[token]) / totalShares[token];
        require(amount > 0, "Insufficient amount");
        
        // Update state
        liquidityShares[msg.sender][token] -= shares;
        totalShares[token] -= shares;
        reserves[token] -= amount;
        
        // Transfer tokens back
        require(
            IERC20(token).transfer(msg.sender, amount),
            "Transfer failed"
        );
        
        emit LiquidityRemoved(msg.sender, token, amount, shares);
    }
    
    /**
     * @notice Get current price of tokenOut in terms of tokenIn
     * @param tokenIn Base token
     * @param tokenOut Quote token
     * @return price Price ratio (reserveOut/reserveIn scaled by 1e18)
     */
    function getPrice(address tokenIn, address tokenOut) 
        external 
        view 
        returns (uint256 price) 
    {
        require(reserves[tokenIn] > 0 && reserves[tokenOut] > 0, "No liquidity");
        // Price = reserveOut / reserveIn (scaled by 1e18 for precision)
        price = (reserves[tokenOut] * 1e18) / reserves[tokenIn];
    }
    
    /**
     * @notice Emergency withdrawal function (owner only)
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
}
