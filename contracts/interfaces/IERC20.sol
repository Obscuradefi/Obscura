// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Minimal ERC-20 interface used by Obscura contracts
/// @notice Compatible with native USDC on Arc Testnet (6 decimals ERC-20 wrapper)
///         and any other standard ERC-20 deployed on Arc.
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function decimals() external view returns (uint8);
}
