// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MockToken
/// @notice Public-faucet ERC-20 used for Obscura's testnet markets (GOLD, AAPL,
///         MSTR, USDe, etc.) on Arc Testnet. Anyone can mint a capped amount per
///         call so demos and judges can interact without contacting an admin.
/// @dev Decimals are configurable so synthetic equities/commodities can match
///      their natural precision (e.g. 18) while stables can use 6.
contract MockToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    address public owner;
    uint256 public faucetAmount; // capped public mint per call

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event FaucetMinted(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "MockToken: not owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply,
        uint256 _faucetAmount
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        owner = msg.sender;
        faucetAmount = _faucetAmount;

        if (_initialSupply > 0) {
            totalSupply = _initialSupply;
            balanceOf[msg.sender] = _initialSupply;
            emit Transfer(address(0), msg.sender, _initialSupply);
        }
    }

    // ---------- ERC-20 ----------

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "MockToken: insufficient allowance");
            unchecked { allowance[from][msg.sender] = allowed - amount; }
        }
        _transfer(from, to, amount);
        return true;
    }

    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "MockToken: transfer to zero");
        uint256 bal = balanceOf[from];
        require(bal >= amount, "MockToken: insufficient balance");
        unchecked { balanceOf[from] = bal - amount; }
        balanceOf[to] += amount;
        emit Transfer(from, to, amount);
    }

    // ---------- Public faucet ----------

    /// @notice Mint up to `faucetAmount` tokens to `to`. Anyone can call.
    function faucet(address to) external {
        require(to != address(0), "MockToken: zero recipient");
        uint256 amt = faucetAmount;
        require(amt > 0, "MockToken: faucet disabled");
        totalSupply += amt;
        balanceOf[to] += amt;
        emit Transfer(address(0), to, amt);
        emit FaucetMinted(to, amt);
    }

    /// @notice Convenience: mint to caller.
    function mint() external {
        uint256 amt = faucetAmount;
        require(amt > 0, "MockToken: faucet disabled");
        totalSupply += amt;
        balanceOf[msg.sender] += amt;
        emit Transfer(address(0), msg.sender, amt);
        emit FaucetMinted(msg.sender, amt);
    }

    // ---------- Admin ----------

    function adminMint(address to, uint256 amount) external onlyOwner {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function setFaucetAmount(uint256 amt) external onlyOwner {
        faucetAmount = amt;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
