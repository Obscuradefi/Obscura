// Documentation content data for Obscura
// Structured content for the docs page

export interface DocSection {
    id: string;
    title: string;
    icon: string;
    pages: DocPage[];
}

export interface DocPage {
    id: string;
    title: string;
    content: DocBlock[];
}

export interface DocBlock {
    type: 'heading' | 'paragraph' | 'code' | 'list' | 'callout' | 'table' | 'divider' | 'steps';
    content?: string;
    language?: string;
    items?: string[];
    variant?: 'info' | 'warning' | 'tip' | 'danger';
    title?: string;
    headers?: string[];
    rows?: string[][];
    steps?: { title: string; description: string }[];
    level?: number;
}

export const docsContent: DocSection[] = [
    // ───────────────────────── GETTING STARTED ─────────────────────────
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: '🚀',
        pages: [
            {
                id: 'introduction',
                title: 'Introduction',
                content: [
                    { type: 'heading', content: 'What is Obscura?', level: 1 },
                    { type: 'paragraph', content: 'Obscura is a next-generation privacy-first DeFi protocol built on Rialo infrastructure. It combines AI-powered trading, hybrid AMM+RFQ routing, encrypted vaults, and on-chain privacy into a seamless decentralized finance experience.' },
                    { type: 'callout', variant: 'info', title: 'Current Status', content: 'Obscura is currently live on Base Sepolia Testnet. All assets are test tokens and have no real value.' },
                    { type: 'heading', content: 'Key Features', level: 2 },
                    { type: 'list', items: [
                        '**Privacy Layer** — Shield and unshield tokens. Your balances are encrypted on-chain — only you control visibility.',
                        '**Hybrid Routing** — Smart AMM + RFQ routing ensures best execution on every trade with zero slippage options.',
                        '**AI Agent Trading** — Swap tokens using natural language. Just describe what you want and the AI handles execution.',
                        '**Multi-Asset Support** — Trade stablecoins (USDO, USDT, USDe), commodities (GOLD), and tokenized stocks (AAPL, MSTR).',
                        '**Liquidity Provision** — Provide liquidity to pools and earn trading fees automatically.',
                        '**Portfolio Management** — Monitor all your positions, activity history, and shielded balances in one dashboard.',
                    ]},
                    { type: 'heading', content: 'Architecture Overview', level: 2 },
                    { type: 'paragraph', content: 'Obscura is designed as a modular DeFi stack with distinct layers:' },
                    { type: 'table', headers: ['Layer', 'Component', 'Description'], rows: [
                        ['Privacy', 'Shield/Unshield Protocol', 'Encrypt and decrypt token balances on-chain'],
                        ['Trading', 'AMM Engine', 'Constant product market maker (x × y = k)'],
                        ['Trading', 'RFQ System', 'Request for quote from professional market makers'],
                        ['Routing', 'Smart Router', 'Hybrid routing across AMM and RFQ for best price'],
                        ['AI', 'Swap Agent', 'Natural language processing for intent-based trading'],
                        ['Data', 'Price Oracles', 'Real-time feeds via Pyth Network integration'],
                    ]},
                ]
            },
            {
                id: 'quick-start',
                title: 'Quick Start',
                content: [
                    { type: 'heading', content: 'Quick Start Guide', level: 1 },
                    { type: 'paragraph', content: 'Get started with Obscura in just a few minutes. Follow these steps to begin trading privately.' },
                    { type: 'steps', steps: [
                        { title: 'Connect Your Wallet', description: 'Click the "Connect Wallet" button in the top right corner. Obscura supports MetaMask, WalletConnect, Coinbase Wallet, and other popular wallets. Make sure you are on the Base Sepolia testnet.' },
                        { title: 'Get Test Tokens', description: 'Click the "Faucet" button in the app header to mint 100 USDO test tokens for free. You\'ll need to confirm the transaction in your wallet.' },
                        { title: 'Explore the Dashboard', description: 'Navigate to the Portfolio tab to see your balances, or head to Swap to start trading. Use the tab bar to explore Markets, Liquidity, and Shield features.' },
                        { title: 'Make Your First Swap', description: 'Go to the Swap tab, select your input and output tokens, enter an amount, and execute. The smart router will find the best price across AMM and RFQ.' },
                        { title: 'Shield Your Assets', description: 'Navigate to the Shield tab to encrypt your token balances. Once shielded, your balance becomes private and only visible to you.' },
                    ]},
                    { type: 'callout', variant: 'tip', title: 'Pro Tip', content: 'Try typing "swap 5 USDO to GOLD" in the AI Agent chat (bottom-right corner) for hands-free trading!' },
                ]
            },
            {
                id: 'glossary',
                title: 'Glossary',
                content: [
                    { type: 'heading', content: 'Glossary', level: 1 },
                    { type: 'paragraph', content: 'Key terms and concepts used throughout Obscura documentation.' },
                    { type: 'table', headers: ['Term', 'Definition'], rows: [
                        ['AMM', 'Automated Market Maker — an algorithm that provides liquidity and determines swap prices using mathematical formulas.'],
                        ['RFQ', 'Request for Quote — a trading mechanism where professional market makers compete to offer the best price.'],
                        ['Shield', 'The process of encrypting your token balance on-chain, making it private.'],
                        ['Unshield', 'The process of decrypting your shielded token balance back to a public token.'],
                        ['cUSDO', 'Confidential USDO — the shielded (encrypted) version of USDO tokens.'],
                        ['Slippage', 'The difference between the expected price and the actual executed price of a trade.'],
                        ['Price Impact', 'The effect your trade has on the market price, determined by trade size relative to pool liquidity.'],
                        ['LP', 'Liquidity Provider — someone who deposits tokens into a pool to earn trading fees.'],
                        ['TVL', 'Total Value Locked — the total value of assets deposited in a DeFi protocol.'],
                        ['MEV', 'Maximal Extractable Value — profit extracted by reordering, inserting, or removing transactions within a block.'],
                        ['Smart Router', 'Obscura\'s routing engine that compares prices across AMM and RFQ to find the best execution path.'],
                        ['Reactive Transactions', 'Rialo\'s native conditional execution system that enables automatic on-chain actions without external keepers.'],
                        ['REX', 'Rialo\'s encryption extension for on-chain privacy.'],
                    ]},
                ]
            },
        ]
    },

    // ───────────────────────── CORE CONCEPTS ─────────────────────────
    {
        id: 'core-concepts',
        title: 'Core Concepts',
        icon: '💡',
        pages: [
            {
                id: 'privacy-layer',
                title: 'Privacy Layer',
                content: [
                    { type: 'heading', content: 'Privacy Layer', level: 1 },
                    { type: 'paragraph', content: 'Obscura\'s Privacy Layer is the core feature that sets it apart from traditional DEXs. It allows users to shield their token balances, making them invisible on the public blockchain while retaining full control and usability.' },
                    { type: 'heading', content: 'How Shielding Works', level: 2 },
                    { type: 'paragraph', content: 'When you shield tokens, they are deposited into the RialoPrivacyPool smart contract (0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45 on Base Sepolia). The contract encrypts your balance using REX (Rialo Encryption Extension) technology, converting your public ERC-20 tokens into confidential tokens (prefixed with "c").' },
                    { type: 'table', headers: ['Public Token', 'Shielded Token', 'Description'], rows: [
                        ['USDO', 'cUSDO', 'Confidential USDO — the shielded version of the native stablecoin'],
                        ['USDT', 'cUSDT', 'Confidential USDT — the shielded version of Tether USD'],
                        ['USDe', 'cUSDe', 'Confidential USDe — the shielded version of Ethena USDe'],
                    ]},
                    { type: 'code', language: 'text', content: 'Shielding Flow:\n\nUser deposits 100 USDO\n  → approve() Privacy Pool to spend USDO\n  → shield(USDO_address, 100e18)\n  → ERC-20 transferred to Privacy Pool contract\n  → _encryptedBalances[user][USDO] += 100e18\n  → emit Shielded(user, USDO, 100e18)\n  → User sees 100 cUSDO in dashboard' },
                    { type: 'heading', content: 'Unshielding', level: 2 },
                    { type: 'paragraph', content: 'Unshielding is the reverse process. You burn your confidential tokens (cUSDO) and the Privacy Pool releases the equivalent amount of public tokens (USDO) back to your wallet. No approval is needed for unshielding since the contract already holds the tokens.' },
                    { type: 'code', language: 'text', content: 'Unshielding Flow:\n\nUser calls unshield(USDO_address, 50e18)\n  → require _encryptedBalances[user][USDO] >= 50e18\n  → _encryptedBalances[user][USDO] -= 50e18\n  → ERC-20 transferred back to user\n  → emit Unshielded(user, USDO, 50e18)' },
                    { type: 'callout', variant: 'warning', title: 'Important', content: 'Shielding and unshielding require on-chain transactions and gas fees. The shielded balance is only visible when you connect the wallet that performed the shielding. On the current testnet, stored encrypted balances use a simplified mapping — on Rialo mainnet, this will use native REX chain-level encryption.' },
                    { type: 'heading', content: 'Privacy Pool Contract', level: 2 },
                    { type: 'paragraph', content: 'The RialoPrivacyPool is a mock implementation of Rialo\'s REX privacy layer deployed on Base Sepolia. It simulates the shield (deposit) and unshield (withdraw) logic. In production, shielded assets would be handled by a confidential RFC (Request for Computation) interacting with the REX layer.' },
                    { type: 'code', language: 'solidity', content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ncontract RialoPrivacyPool {\n    // Mapping: User → Token → Encrypted Balance\n    mapping(address => mapping(address => uint256)) private _encryptedBalances;\n\n    event Shielded(address indexed user, address indexed token, uint256 amount);\n    event Unshielded(address indexed user, address indexed token, uint256 amount);\n\n    function shield(address token, uint256 amount) external {\n        require(amount > 0, "Amount must be greater than 0");\n        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);\n        require(success, "Transfer failed");\n        _encryptedBalances[msg.sender][token] += amount;\n        emit Shielded(msg.sender, token, amount);\n    }\n\n    function unshield(address token, uint256 amount) external {\n        require(amount > 0, "Amount must be greater than 0");\n        require(_encryptedBalances[msg.sender][token] >= amount, "Insufficient encrypted balance");\n        _encryptedBalances[msg.sender][token] -= amount;\n        bool success = IERC20(token).transfer(msg.sender, amount);\n        require(success, "Transfer failed");\n        emit Unshielded(msg.sender, token, amount);\n    }\n\n    function getEncryptedBalance(address user, address token) external view returns (uint256) {\n        return _encryptedBalances[user][token];\n    }\n}' },
                    { type: 'heading', content: 'Contract Address', level: 2 },
                    { type: 'table', headers: ['Contract', 'Address', 'Network'], rows: [
                        ['RialoPrivacyPool', '0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45', 'Base Sepolia'],
                    ]},
                    { type: 'heading', content: 'Shield ABI', level: 2 },
                    { type: 'code', language: 'typescript', content: '// Shield ABI (for frontend integration)\nimport { parseAbi } from \'viem\';\n\nexport const SHIELD_ABI = parseAbi([\n    \'function shield(address token, uint256 amount) external\',\n    \'function unshield(address token, uint256 amount) external\',\n    \'function getEncryptedBalance(address user, address token) view returns (uint256)\',\n    \'event Shielded(address indexed user, address indexed token, uint256 amount)\',\n    \'event Unshielded(address indexed user, address indexed token, uint256 amount)\'\n]);' },
                ]
            },
            {
                id: 'smart-routing',
                title: 'Smart Routing',
                content: [
                    { type: 'heading', content: 'Hybrid AMM + RFQ Routing', level: 1 },
                    { type: 'paragraph', content: 'Obscura uses a hybrid routing system that combines two execution mechanisms — AMM (Automated Market Maker) and RFQ (Request for Quote) — to find the best price for every trade. The smart router automatically determines the optimal path based on trade size.' },
                    { type: 'heading', content: 'Route Selection Thresholds', level: 2 },
                    { type: 'paragraph', content: 'The determineRoute() function in the smart router uses USD value thresholds to select the routing mode:' },
                    { type: 'code', language: 'typescript', content: '// Route determination logic\nfunction determineRoute(usdValue: number): "AMM" | "RFQ" | "HYBRID" {\n    if (usdValue < 100_000) {\n        return "AMM";      // Small trades: AMM only\n    } else if (usdValue < 500_000) {\n        return "HYBRID";   // Medium trades: Show both AMM + RFQ\n    } else {\n        return "RFQ";      // Large trades: RFQ only\n    }\n}' },
                    { type: 'table', headers: ['Trade Size (USD)', 'Route', 'Why'], rows: [
                        ['< $100,000', 'AMM', 'Pool liquidity is sufficient, instant execution'],
                        ['$100,000 – $500,000', 'HYBRID', 'Compare AMM and RFQ to find best price'],
                        ['> $500,000', 'RFQ', 'Zero slippage essential for large trades'],
                    ]},
                    { type: 'heading', content: 'AMM Engine', level: 2 },
                    { type: 'paragraph', content: 'The SimpleAMM contract (0x944b6cB6d8621603B4a094955123dbD96e289bA2) uses the constant product formula x × y = k with a 0.3% fee (FEE_NUMERATOR = 3, FEE_DENOMINATOR = 1000).' },
                    { type: 'code', language: 'solidity', content: '// SimpleAMM.sol — getAmountOut function\n// Fee: 0.3% = 3/1000\nuint256 public constant FEE_NUMERATOR = 3;\nuint256 public constant FEE_DENOMINATOR = 1000;\n\nfunction getAmountOut(address tokenIn, address tokenOut, uint256 amountIn)\n    public view returns (uint256 amountOut)\n{\n    uint256 reserveIn = reserves[tokenIn];\n    uint256 reserveOut = reserves[tokenOut];\n\n    // Apply 0.3% fee (multiply by 997/1000)\n    uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);\n    uint256 numerator = reserveOut * amountInWithFee;\n    uint256 denominator = (reserveIn * FEE_DENOMINATOR) + amountInWithFee;\n\n    amountOut = numerator / denominator;\n}' },
                    { type: 'heading', content: 'RFQ System', level: 2 },
                    { type: 'paragraph', content: 'The RFQ system connects to professional market makers who compete for your order. Each quote includes a rate, fee percentage (0.01-0.05%), and time-limited expiry (15-30 seconds). Multiple quotes are generated and sorted by best output amount.' },
                    { type: 'paragraph', content: 'Participating market makers in the RFQ pool:' },
                    { type: 'table', headers: ['Market Maker', 'Type'], rows: [
                        ['Wintermute', 'Professional Market Maker'],
                        ['Jump Trading', 'Professional Market Maker'],
                        ['Citadel Securities', 'Professional Market Maker'],
                        ['Jane Street', 'Professional Market Maker'],
                        ['Flow Traders', 'Professional Market Maker'],
                    ]},
                    { type: 'steps', steps: [
                        { title: 'User requests quote', description: 'You specify the tokens and amount you want to swap. The system broadcasts a request to all connected market makers.' },
                        { title: 'Market makers respond', description: '2-3 market makers submit competing quotes within seconds. Each quote includes an amount, rate, fee (0.01-0.05%), and expiry countdown (15-30s).' },
                        { title: 'Best price selected', description: 'Quotes are sorted by output amount (descending). The smart router selects the best quote automatically.' },
                        { title: 'Atomic execution', description: 'The swap settles on-chain in a single transaction — no MEV, no frontrunning. RFQ offers 1-3% better pricing than AMM for large trades.' },
                    ]},
                    { type: 'heading', content: 'Feature Comparison', level: 2 },
                    { type: 'table', headers: ['Feature', 'AMM', 'RFQ'], rows: [
                        ['Contract', 'SimpleAMM (0x944b...)', 'Off-chain quotes → on-chain settle'],
                        ['Availability', 'Always available', 'Depends on market makers'],
                        ['Slippage', 'Variable (based on trade size)', 'Zero'],
                        ['Price Impact', 'Yes (Δx / x × 100%)', 'No'],
                        ['Fee', '0.3% (0.05% stablecoins)', '0.01-0.05%'],
                        ['MEV Risk', 'Possible', 'None (atomic execution)'],
                        ['Quote Expiry', 'N/A', '15-30 seconds'],
                        ['Best For', '< $100K trades', '> $100K trades'],
                    ]},
                ]
            },
            {
                id: 'ai-agent',
                title: 'AI Agent Trading',
                content: [
                    { type: 'heading', content: 'AI Agent Trading', level: 1 },
                    { type: 'paragraph', content: 'Obscura\'s AI Swap Agent lets you trade using natural language. Instead of manually selecting tokens and entering amounts, simply describe what you want — the AI parses your intent, shows a preview, and executes via your wallet.' },
                    { type: 'heading', content: 'Two-Stage Parsing', level: 2 },
                    { type: 'paragraph', content: 'The agent uses a two-stage parsing strategy: try local regex first (free, instant), then fallback to AI API (cheap, ~$0.001 per query). This ensures fast response for common patterns while handling complex natural language inputs.' },
                    { type: 'code', language: 'typescript', content: '// Main parser: regex first, then AI fallback\nasync function parseSwapIntent(message: string): Promise<ParseResult> {\n    // Step 1: Try regex (free, instant)\n    const regexResult = parseWithRegex(message);\n    if (regexResult.success) return regexResult;\n\n    // Step 2: Fallback to AI (cheap)\n    return parseWithAI(message);\n}\n\n// Regex patterns for swap detection:\n// Pattern 1: swap/tukar/buy/sell [amount] [token] to/ke [token]\n// Pattern 2: [amount] [token] to/ke/→/-> [token]' },
                    { type: 'heading', content: 'Supported Intents', level: 2 },
                    { type: 'table', headers: ['Intent Type', 'Example', 'Description'], rows: [
                        ['Swap', '"swap 10 USDO to GOLD"', 'Execute a token swap'],
                        ['Buy', '"buy 5 AAPL with USDO"', 'Purchase tokens'],
                        ['Sell', '"sell 100 GOLD for USDT"', 'Sell tokens'],
                        ['Shield', '"shield 50 USDO"', 'Encrypt token balance'],
                        ['Unshield', '"unshield 25 USDO"', 'Decrypt token balance'],
                        ['Portfolio', '"check my portfolio"', 'View current balances'],
                    ]},
                    { type: 'heading', content: 'Token Aliases', level: 2 },
                    { type: 'paragraph', content: 'The AI agent understands common aliases and casual names for tokens:' },
                    { type: 'table', headers: ['Alias / Casual Name', 'Resolves To'], rows: [
                        ['USDC, USD, DOLLAR', 'USDO'],
                        ['TETHER', 'USDT'],
                        ['APPLE', 'AAPL'],
                        ['MICROSTRATEGY', 'MSTR'],
                        ['EMAS (Indonesian for gold)', 'GOLD'],
                        ['ETHENA', 'USDe'],
                    ]},
                    { type: 'callout', variant: 'tip', title: 'Bilingual Support', content: 'The AI agent supports both English and Bahasa Indonesia commands. "tukar 10 USDO ke GOLD", "cek portfolio", "lindungi 50 USDO" all work perfectly.' },
                    { type: 'heading', content: 'AI Model Details', level: 2 },
                    { type: 'table', headers: ['Property', 'Value'], rows: [
                        ['API Provider', 'Jatevo AI (jatevo.id)'],
                        ['Model', 'GLM-4.7 (ZhipuAI)'],
                        ['Parsing Strategy', 'Regex-first, AI-fallback'],
                        ['Temperature', '0 (deterministic)'],
                        ['Max Tokens', '100 per query'],
                        ['Cost per AI query', '~$0.001'],
                        ['Confirmation', 'Always requires wallet confirmation'],
                        ['Safety', 'Preview shown before execution'],
                    ]},
                    { type: 'heading', content: 'Architecture Flow', level: 2 },
                    { type: 'code', language: 'text', content: 'User Input: "swap 5 USDO to GOLD"\n  ↓\nStep 1: parseWithRegex() — matches pattern: swap [amount] [token] to [token]\n  ↓\nParsed Intent: { type: "swap", from: "USDO", to: "GOLD", amount: 5, source: "regex" }\n  ↓\nSwap Preview (fetches live Pyth prices, calculates output)\n  ↓\nUser Confirms → approve() + swap() transactions → Done!\n\n--- If regex fails ---\n\nUser Input: "I want to convert some dollars to gold"\n  ↓\nStep 1: parseWithRegex() — FAIL\n  ↓\nStep 2: parseWithAI() — sends to GLM-4.7 model\n  ↓\nAI Response: { type: "swap", from: "USDO", to: "GOLD" }\n  ↓\nAgent asks: "How much USDO would you like to swap?"' },
                ]
            },
            {
                id: 'tokenized-assets',
                title: 'Tokenized Assets',
                content: [
                    { type: 'heading', content: 'Supported Assets', level: 1 },
                    { type: 'paragraph', content: 'Obscura supports a diverse range of tokenized assets spanning stablecoins, commodities, and equities. All tokens are ERC-20 contracts deployed on Base Sepolia with 18 decimal precision. Any token can be swapped to any other token directly.' },
                    { type: 'table', headers: ['Symbol', 'Name', 'Category', 'Contract Address', 'Decimals'], rows: [
                        ['USDO', 'USDO', 'Stablecoin', '0x191798C747807ae164f2a28fA5DFb5145AcE4b6B', '18'],
                        ['USDT', 'Tether USD', 'Stablecoin', '0xdf273C73aE8a405d200e87b869b1C53013e5f64b', '18'],
                        ['USDe', 'Ethena USDe', 'Stablecoin', '0xCAfb242bE67dc84419750da1C69d6792907d602f', '18'],
                        ['GOLD', 'Gold Token', 'Commodity', '0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a', '18'],
                        ['AAPL', 'Apple Stock Token', 'Equity', '0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A', '18'],
                        ['MSTR', 'MicroStrategy Stock Token', 'Equity', '0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719', '18'],
                    ]},
                    { type: 'heading', content: 'Price Oracle: Pyth Network', level: 2 },
                    { type: 'paragraph', content: 'All asset prices are sourced from Pyth Network via the Hermes API (hermes.pyth.network). Prices update in real-time using the v2/updates/price/latest endpoint and are used for both UI display and on-chain Pyth-integrated swaps.' },
                    { type: 'table', headers: ['Asset', 'Pyth Price Feed ID'], rows: [
                        ['USDO', '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a'],
                        ['USDT', '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b'],
                        ['USDe', '0x6ec879b1e9963de5ee97e9c8710b742d6228252a5e2ca12d4ae81d7fe5ee8c5d'],
                        ['GOLD (XAU/USD)', '0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2'],
                        ['AAPL', '0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688'],
                        ['MSTR', '0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09'],
                    ]},
                    { type: 'heading', content: 'Swap Pairs', level: 2 },
                    { type: 'paragraph', content: 'All pairs are allowed — any token can swap to any other token directly. The isPairAllowed() function simply checks that both tokens are valid and different.' },
                    { type: 'heading', content: 'Faucet', level: 2 },
                    { type: 'paragraph', content: 'All test tokens can be obtained for free via the Faucet button in the app header. Each faucet click calls the public mint function on the USDO contract to mint 100 USDO (100e18 wei) to your connected wallet.' },
                    { type: 'code', language: 'typescript', content: '// Faucet mint call\nawait writeContract({\n  address: "0x191798C747807ae164f2a28fA5DFb5145AcE4b6B",\n  abi: [{ name: "mint", inputs: [\n    { name: "to", type: "address" },\n    { name: "amount", type: "uint256" }\n  ], outputs: [], stateMutability: "nonpayable", type: "function" }],\n  functionName: "mint",\n  args: [userAddress, parseUnits("100", 18)],\n});' },
                    { type: 'callout', variant: 'info', title: 'Testnet Only', content: 'All tokens on Obscura are currently test tokens on Base Sepolia. They have no real monetary value and are for testing and demonstration purposes only. All token contracts have a public mint() function.' },
                ]
            },
        ]
    },

    // ───────────────────────── USER GUIDE ─────────────────────────
    {
        id: 'user-guide',
        title: 'User Guide',
        icon: '📖',
        pages: [
            {
                id: 'connecting-wallet',
                title: 'Connecting Wallet',
                content: [
                    { type: 'heading', content: 'Connecting Your Wallet', level: 1 },
                    { type: 'paragraph', content: 'Obscura uses RainbowKit for wallet connections, supporting a wide range of popular Web3 wallets.' },
                    { type: 'heading', content: 'Supported Wallets', level: 2 },
                    { type: 'list', items: [
                        '**MetaMask** — The most popular browser extension wallet',
                        '**WalletConnect** — Connect via mobile wallets like Trust, Rainbow, etc.',
                        '**Coinbase Wallet** — Coinbase\'s self-custody wallet',
                        '**And many more** via RainbowKit\'s wallet integration',
                    ]},
                    { type: 'heading', content: 'Network Configuration', level: 2 },
                    { type: 'paragraph', content: 'Obscura operates on the Base Sepolia testnet. When you connect, the app will automatically prompt you to switch networks if needed.' },
                    { type: 'table', headers: ['Property', 'Value'], rows: [
                        ['Network', 'Base Sepolia'],
                        ['Chain ID', '84532'],
                        ['Currency', 'ETH (Sepolia)'],
                        ['RPC', 'Base Sepolia public RPC'],
                    ]},
                    { type: 'callout', variant: 'tip', title: 'Need testnet ETH?', content: 'You\'ll need a small amount of Base Sepolia ETH for gas fees. Get free testnet ETH from faucets like base-sepolia.blockscout.com or faucets.chain.link.' },
                ]
            },
            {
                id: 'swapping-tokens',
                title: 'Swapping Tokens',
                content: [
                    { type: 'heading', content: 'Swapping Tokens', level: 1 },
                    { type: 'paragraph', content: 'The Swap tab lets you trade between any supported token pairs using Obscura\'s hybrid routing engine.' },
                    { type: 'steps', steps: [
                        { title: 'Select Input Token', description: 'Click the token selector on the "From" field and choose the token you want to sell.' },
                        { title: 'Select Output Token', description: 'Click the token selector on the "To" field and choose the token you want to receive.' },
                        { title: 'Enter Amount', description: 'Type the amount you want to swap. The output estimate will update in real-time showing the expected amount received.' },
                        { title: 'Review Quote', description: 'Check the quote panel showing exchange rate, price impact, minimum received, and routing path.' },
                        { title: 'Set Slippage (Optional)', description: 'Adjust slippage tolerance using the preset buttons (0.5%, 1%, 3%) or enter a custom value.' },
                        { title: 'Approve (First Time)', description: 'If this is your first swap with this token, click "Approve" to allow the router contract to access your tokens.' },
                        { title: 'Execute Swap', description: 'Click "Swap" and confirm the transaction in your wallet. The tokens will appear in your balance shortly.' },
                    ]},
                    { type: 'heading', content: 'Routing Modes', level: 2 },
                    { type: 'table', headers: ['Mode', 'Description', 'Best For'], rows: [
                        ['AMM', 'Automated Market Maker pools', 'Standard trades with instant execution'],
                        ['RFQ', 'Request for Quote from market makers', 'Large trades with zero slippage'],
                        ['Hybrid', 'Smart router selects the best path', 'Default — optimal price guarantee'],
                    ]},
                ]
            },
            {
                id: 'shield-unshield',
                title: 'Shield & Unshield',
                content: [
                    { type: 'heading', content: 'Shielding & Unshielding', level: 1 },
                    { type: 'paragraph', content: 'The Shield tab allows you to encrypt your token balances for on-chain privacy. Shielded tokens are prefixed with "c" (confidential).' },
                    { type: 'heading', content: 'Shielding Tokens', level: 2 },
                    { type: 'steps', steps: [
                        { title: 'Navigate to Shield Tab', description: 'Click the Shield tab in the app navigation bar.' },
                        { title: 'Enter Shield Amount', description: 'Type the amount of USDO you want to shield in the Shield input field.' },
                        { title: 'Approve Contract', description: 'First time only — approve the Privacy Pool contract to access your USDO tokens.' },
                        { title: 'Confirm Shield', description: 'Click "Shield" and confirm in your wallet. Your USDO will be converted to cUSDO (confidential).' },
                    ]},
                    { type: 'heading', content: 'Unshielding Tokens', level: 2 },
                    { type: 'steps', steps: [
                        { title: 'Navigate to Shield Tab', description: 'Click the Shield tab in the app navigation bar.' },
                        { title: 'Enter Unshield Amount', description: 'Type the amount of cUSDO you want to unshield in the Unshield input field.' },
                        { title: 'Confirm Unshield', description: 'Click "Unshield" and confirm in your wallet. Your cUSDO will be converted back to public USDO.' },
                    ]},
                    { type: 'callout', variant: 'info', title: 'Privacy Guarantee', content: 'Shielded balances are encrypted on-chain. Only the wallet owner can decrypt and view their shielded balance. External observers see only encrypted data.' },
                ]
            },
            {
                id: 'providing-liquidity',
                title: 'Providing Liquidity',
                content: [
                    { type: 'heading', content: 'Providing Liquidity', level: 1 },
                    { type: 'paragraph', content: 'Liquidity providers (LPs) deposit equal values of two tokens into a pool, enabling others to swap between those tokens. LPs earn trading fees proportional to their share of the pool.' },
                    { type: 'heading', content: 'Available Pools', level: 2 },
                    { type: 'table', headers: ['Pool', 'Token A', 'Token B', 'Fee Tier'], rows: [
                        ['USDO/GOLD', 'USDO', 'GOLD', '0.3%'],
                        ['USDO/AAPL', 'USDO', 'AAPL', '0.3%'],
                        ['USDO/MSTR', 'USDO', 'MSTR', '0.3%'],
                        ['USDO/USDT', 'USDO', 'USDT', '0.05%'],
                        ['USDO/USDe', 'USDO', 'USDe', '0.05%'],
                    ]},
                    { type: 'heading', content: 'Adding Liquidity', level: 2 },
                    { type: 'steps', steps: [
                        { title: 'Go to Liquidity Tab', description: 'Navigate to the Liquidity tab from the main app navigation.' },
                        { title: 'Select Pool', description: 'Choose the pool you want to provide liquidity to.' },
                        { title: 'Enter Amounts', description: 'Enter the amount for one token — the other will auto-calculate to maintain equal value.' },
                        { title: 'Approve Tokens', description: 'Approve both tokens if you haven\'t already.' },
                        { title: 'Add Liquidity', description: 'Confirm the transaction. You\'ll receive LP tokens representing your pool share.' },
                    ]},
                    { type: 'callout', variant: 'warning', title: 'Impermanent Loss', content: 'Providing liquidity carries the risk of impermanent loss. This occurs when the price ratio of your deposited tokens changes. The larger the change, the more IL you may experience.' },
                ]
            },
            {
                id: 'portfolio-management',
                title: 'Portfolio Management',
                content: [
                    { type: 'heading', content: 'Portfolio Dashboard', level: 1 },
                    { type: 'paragraph', content: 'The Portfolio tab gives you a comprehensive overview of all your assets, positions, and activity on Obscura.' },
                    { type: 'heading', content: 'Dashboard Sections', level: 2 },
                    { type: 'list', items: [
                        '**Total Balance** — Shows the aggregate value of all your public and shielded assets.',
                        '**Asset Table** — Detailed breakdown of each token: balance, price, 24h change, and total value.',
                        '**Shielded Assets** — Displays your confidential (encrypted) token balances separately.',
                        '**Quick Actions** — One-click shortcuts to Swap, Shield, Stake, and other features.',
                        '**Activity History** — Recent transactions including swaps, shields, faucet mints, and LP actions.',
                    ]},
                    { type: 'heading', content: 'Faucet', level: 2 },
                    { type: 'paragraph', content: 'The faucet is accessible from the app header. Each click mints 100 USDO tokens to your wallet for free on the Base Sepolia testnet.' },
                ]
            },
            {
                id: 'using-ai-agent',
                title: 'Using AI Agent',
                content: [
                    { type: 'heading', content: 'AI Swap Agent Guide', level: 1 },
                    { type: 'paragraph', content: 'The AI Swap Agent is a chat-based trading interface accessible from the floating button in the bottom-right corner of the app.' },
                    { type: 'heading', content: 'Opening the Agent', level: 2 },
                    { type: 'paragraph', content: 'Click the 🤖 robot icon in the bottom-right corner to open the AI Agent chat panel. The agent is always available while using the app.' },
                    { type: 'heading', content: 'Example Conversations', level: 2 },
                    { type: 'code', language: 'text', content: '--- Example 1: Simple Swap ---\nYou: swap 5 USDO to GOLD\nAgent: 📋 Swap Preview\n  • From: 5 USDO\n  • To: GOLD  \n  • Router: AMM\n  Ready to execute?\nYou: ✓ CONFIRM\nAgent: ✅ Swap complete!\n\n--- Example 2: Buy Stock ---\nYou: buy 10 AAPL with USDO\nAgent: 📋 Swap Preview\n  • From: USDO\n  • To: 10 AAPL\n  Ready to execute?\nYou: ✓ CONFIRM\nAgent: ✅ Swap complete!' },
                    { type: 'callout', variant: 'info', title: 'Safety First', content: 'The AI Agent always shows a preview of the trade before execution. You must explicitly confirm with your wallet — no trades execute without your approval.' },
                ]
            },
        ]
    },

    // ───────────────────────── TECHNICAL ─────────────────────────
    {
        id: 'technical',
        title: 'Technical Architecture',
        icon: '⚙️',
        pages: [
            {
                id: 'amm-engine',
                title: 'AMM Engine',
                content: [
                    { type: 'heading', content: 'AMM Engine', level: 1 },
                    { type: 'paragraph', content: 'The SimpleAMM contract is the primary trading mechanism in Obscura. It is deployed at 0x944b6cB6d8621603B4a094955123dbD96e289bA2 on Base Sepolia. It uses the constant product formula with ReentrancyGuard and Ownable from OpenZeppelin (@openzeppelin/contracts v5.0.0).' },
                    { type: 'heading', content: 'Constant Product Formula', level: 2 },
                    { type: 'code', language: 'text', content: 'x × y = k\n\nFee-adjusted formula (from SimpleAMM.sol):\n  amountInWithFee = amountIn × (1000 - 3)     // 0.3% fee\n  numerator       = reserveOut × amountInWithFee\n  denominator     = (reserveIn × 1000) + amountInWithFee\n  amountOut       = numerator / denominator\n\nExample:\n  reserves: USDO = 100,000 | GOLD = 50\n  Swap 200 USDO → GOLD:\n    amountInWithFee = 200 × 997 = 199,400\n    numerator = 50 × 199,400 = 9,970,000\n    denominator = (100,000 × 1000) + 199,400 = 100,199,400\n    amountOut = 9,970,000 / 100,199,400 ≈ 0.0995 GOLD\n  Price Impact ≈ 0.2%' },
                    { type: 'heading', content: 'Full Contract Source', level: 2 },
                    { type: 'paragraph', content: 'The SimpleAMM contract source (Solidity ^0.8.20, MIT licensed):' },
                    { type: 'code', language: 'solidity', content: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\nimport "@openzeppelin/contracts/token/ERC20/IERC20.sol";\nimport "@openzeppelin/contracts/access/Ownable.sol";\nimport "@openzeppelin/contracts/utils/ReentrancyGuard.sol";\n\ncontract SimpleAMM is Ownable, ReentrancyGuard {\n    uint256 public constant FEE_NUMERATOR = 3;\n    uint256 public constant FEE_DENOMINATOR = 1000;\n\n    mapping(address => uint256) public reserves;\n    mapping(address => mapping(address => uint256)) public liquidityShares;\n    mapping(address => uint256) public totalShares;\n\n    event LiquidityAdded(address indexed provider, address indexed token, uint256 amount, uint256 shares);\n    event LiquidityRemoved(address indexed provider, address indexed token, uint256 amount, uint256 shares);\n    event Swap(address indexed user, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);\n\n    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {\n        uint256 amountInWithFee = amountIn * (FEE_DENOMINATOR - FEE_NUMERATOR);\n        uint256 numerator = reserves[tokenOut] * amountInWithFee;\n        uint256 denominator = (reserves[tokenIn] * FEE_DENOMINATOR) + amountInWithFee;\n        return numerator / denominator;\n    }\n\n    function swap(address tokenIn, address tokenOut, uint256 amountIn, uint256 minAmountOut) external nonReentrant {\n        uint256 amountOut = getAmountOut(tokenIn, tokenOut, amountIn);\n        require(amountOut >= minAmountOut, "Slippage too high");\n        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);\n        reserves[tokenIn] += amountIn;\n        reserves[tokenOut] -= amountOut;\n        IERC20(tokenOut).transfer(msg.sender, amountOut);\n        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);\n    }\n\n    function addLiquidity(address token, uint256 amount) external nonReentrant { ... }\n    function removeLiquidity(address token, uint256 shares) external nonReentrant { ... }\n    function getPrice(address tokenIn, address tokenOut) external view returns (uint256) { ... }\n}' },
                    { type: 'heading', content: 'Pyth-Integrated Swap', level: 2 },
                    { type: 'paragraph', content: 'The AMM also supports a swapWithPyth function that accepts Pyth price update data as an additional parameter. This enables real-time oracle-based pricing instead of purely reserve-based pricing:' },
                    { type: 'code', language: 'solidity', content: '// Pyth-integrated swap (payable — requires update fee)\nfunction swapWithPyth(\n    address tokenIn,\n    address tokenOut,\n    uint256 amountIn,\n    uint256 minAmountOut,\n    bytes[] calldata priceUpdateData\n) external payable;\n\n// Update fee: ~0.001 ETH per price feed update\n// Fee is sent with the transaction as msg.value' },
                    { type: 'heading', content: 'Read Functions', level: 2 },
                    { type: 'table', headers: ['Function', 'Returns', 'Description'], rows: [
                        ['reserves(address token)', 'uint256', 'Get the current reserve amount for a token'],
                        ['getAmountOut(tokenIn, tokenOut, amountIn)', 'uint256', 'Preview swap output after fees'],
                        ['getPrice(tokenIn, tokenOut)', 'uint256', 'Get current price ratio (scaled by 1e18)'],
                        ['liquidityShares(provider, token)', 'uint256', 'Get LP shares for a specific provider'],
                        ['totalShares(token)', 'uint256', 'Get total LP shares for a token pool'],
                    ]},
                    { type: 'heading', content: 'Write Functions', level: 2 },
                    { type: 'table', headers: ['Function', 'Description'], rows: [
                        ['swap(tokenIn, tokenOut, amountIn, minAmountOut)', 'Execute a swap with slippage protection'],
                        ['swapWithPyth(tokenIn, tokenOut, amountIn, minAmountOut, priceUpdateData)', 'Swap with Pyth oracle price data'],
                        ['addLiquidity(token, amount)', 'Add liquidity to a token pool'],
                        ['removeLiquidity(token, shares)', 'Remove liquidity by burning shares'],
                    ]},
                    { type: 'heading', content: 'Events', level: 2 },
                    { type: 'table', headers: ['Event', 'Parameters'], rows: [
                        ['Swap', 'user (indexed), tokenIn (indexed), tokenOut (indexed), amountIn, amountOut'],
                        ['LiquidityAdded', 'provider (indexed), token (indexed), amount, shares'],
                        ['LiquidityRemoved', 'provider (indexed), token (indexed), amount, shares'],
                    ]},
                ]
            },
            {
                id: 'rfq-system',
                title: 'RFQ System',
                content: [
                    { type: 'heading', content: 'RFQ (Request for Quote) System', level: 1 },
                    { type: 'paragraph', content: 'The RFQ system enables professional market makers to provide liquidity by responding to user quote requests. This complements the AMM by offering zero-slippage execution for larger trades.' },
                    { type: 'heading', content: 'Architecture', level: 2 },
                    { type: 'code', language: 'text', content: '┌─────────────┐     Quote Request     ┌──────────────────────┐\n│    User      │ ──────────────────── │     RFQ Pool         │\n│  (Trader)    │                      │                      │\n│              │ ◄─────────────────── │  Wintermute:  $19.95 │\n│              │     2-3 Quotes       │  Jump Trading: $19.89│\n│              │     (15-30s expiry)  │  Jane Street: $19.92 │\n└──────┬───────┘                      └──────────────────────┘\n       │\n       │ Best Quote: Wintermute ($19.95)\n       │ Fee: 0.02%, Expiry: 22s\n       │\n       ▼\n┌──────────────┐\n│  Atomic Swap │ ← Single transaction, no MEV\n│  On-Chain    │\n└──────────────┘' },
                    { type: 'heading', content: 'Quote Structure', level: 2 },
                    { type: 'code', language: 'typescript', content: '// RFQ Quote interface\ninterface RFQQuote {\n    id: string;          // Unique quote identifier\n    maker: string;       // Market maker name\n    tokenIn: string;     // Input token symbol\n    tokenOut: string;    // Output token symbol\n    amountIn: number;    // Input amount\n    amountOut: number;   // Output amount (after fees)\n    rate: number;        // Exchange rate\n    feePercent: number;  // Fee: 0.01% - 0.05%\n    expiryTime: number;  // Unix timestamp\n    expirySeconds: number; // Countdown in seconds (15-30)\n}' },
                    { type: 'heading', content: 'RFQ vs AMM Pricing', level: 2 },
                    { type: 'paragraph', content: 'RFQ quotes are generated with a 1-3% price improvement over AMM pool prices. The improvement factor is calculated as: rfqRate = ammRate × (1.00 to 1.03). This means RFQ consistently offers better pricing, especially for larger trades where AMM price impact would be significant.' },
                    { type: 'heading', content: 'Benefits', level: 2 },
                    { type: 'list', items: [
                        '**Zero Slippage** — The quoted price is the execution price. No price impact regardless of trade size.',
                        '**Lower Fees** — RFQ fees range from 0.01-0.05%, compared to AMM\'s 0.3%.',
                        '**MEV Protection** — Atomic execution prevents frontrunning and sandwich attacks.',
                        '**Competitive Pricing** — 2-3 market makers compete for each order, ensuring fair pricing.',
                        '**Time-limited** — Quotes expire in 15-30 seconds, ensuring current market pricing.',
                    ]},
                ]
            },
            {
                id: 'price-oracles',
                title: 'Price Oracles',
                content: [
                    { type: 'heading', content: 'Price Oracle System', level: 1 },
                    { type: 'paragraph', content: 'Obscura uses Pyth Network as its primary price oracle for all assets. The system fetches real-time pricing from the Pyth Hermes API and falls back to mock prices if the API is unavailable.' },
                    { type: 'heading', content: 'Pyth Network Integration', level: 2 },
                    { type: 'paragraph', content: 'All prices are fetched from the Pyth Hermes endpoint at hermes.pyth.network using the v2/updates/price/latest API. Each asset has a unique 32-byte price feed ID.' },
                    { type: 'code', language: 'typescript', content: '// Price fetching from Pyth\nasync function fetchPythPrice(symbol: string): Promise<number> {\n    const priceId = PYTH_PRICE_IDS[symbol];\n    const hermesUrl = "https://hermes.pyth.network";\n\n    const response = await fetch(\n        `${hermesUrl}/v2/updates/price/latest?ids[]=${priceId}`\n    );\n    const data = await response.json();\n    const priceData = data.parsed[0].price;\n\n    // Convert from Pyth format: price × 10^expo\n    return Number(priceData.price) * Math.pow(10, priceData.expo);\n}' },
                    { type: 'heading', content: 'Price Feed IDs', level: 2 },
                    { type: 'table', headers: ['Asset', 'Feed ID (first 16 chars...)', 'Source'], rows: [
                        ['USDO', '0xeaa020c61cc47971...', 'USDC/USD feed (proxy)'],
                        ['USDT', '0x2b89b9dc8fdf9f34...', 'USDT/USD feed'],
                        ['USDe', '0x6ec879b1e9963de5...', 'USDe/USD feed'],
                        ['GOLD', '0x765d2ba906dbc32c...', 'XAU/USD feed'],
                        ['AAPL', '0x49f6b65cb1de6b10...', 'AAPL equity feed'],
                        ['MSTR', '0xe1e80251e5f5184f...', 'MSTR equity feed'],
                        ['BTC', '0xe62df6c8b4a85fe1...', 'BTC/USD (reference)'],
                        ['ETH', '0xff61491a931112dd...', 'ETH/USD (reference)'],
                    ]},
                    { type: 'heading', content: 'On-Chain Price Updates', level: 2 },
                    { type: 'paragraph', content: 'For Pyth-integrated on-chain swaps, the frontend fetches binary price update data and passes it to the swapWithPyth() function. Each price update requires a small fee (~0.001 ETH per update on Base Sepolia).' },
                    { type: 'code', language: 'typescript', content: '// Fetching Pyth price update data for on-chain use\nasync function getPythPriceUpdate(priceIds: string[]): Promise<string[]> {\n    const queryParams = priceIds.map(id => `ids[]=${id}`).join("&");\n    const url = `https://hermes.pyth.network/v2/updates/price/latest?${queryParams}`;\n    const response = await fetch(url);\n    const data = await response.json();\n    // Return hex-encoded binary update data\n    return data.binary.data.map(hexData => `0x${hexData}`);\n}\n\n// Fee calculation\nfunction getPythUpdateFee(updateCount: number): bigint {\n    const feePerUpdate = BigInt("1000000000000000"); // 0.001 ETH\n    return BigInt(updateCount) * feePerUpdate;\n}' },
                    { type: 'heading', content: 'Fallback Prices', level: 2 },
                    { type: 'paragraph', content: 'If the Pyth API is unavailable, the system falls back to hardcoded mock prices for UI display continuity:' },
                    { type: 'table', headers: ['Asset', 'Fallback Price (USD)'], rows: [
                        ['AAPL', '$278.12'],
                        ['MSTR', '$134.93'],
                        ['USDT', '$1.00'],
                        ['USDe', '$1.00'],
                        ['USDO', '$1.00'],
                        ['GOLD', '$5,077.00'],
                    ]},
                ]
            },
            {
                id: 'privacy-protocol',
                title: 'Privacy Protocol',
                content: [
                    { type: 'heading', content: 'Privacy Protocol', level: 1 },
                    { type: 'paragraph', content: 'Obscura\'s privacy protocol is powered by Rialo\'s REX (Rialo Encryption Extension) technology. The current testnet implementation uses a smart contract-based deposit-and-encrypt pattern. On Rialo mainnet, this will leverage native chain-level encryption.' },
                    { type: 'heading', content: 'Technical Design', level: 2 },
                    { type: 'code', language: 'text', content: 'Privacy Pool Architecture:\n\n┌──────────────┐    shield()     ┌──────────────────────────────┐\n│  Public USDO │ ────────────►   │  RialoPrivacyPool Contract   │\n│  (ERC-20)    │  transferFrom   │  0xA7e722Bb7b1FFe...         │\n└──────────────┘                 │                              │\n                                 │  _encryptedBalances          │\n┌──────────────┐    unshield()   │  [user][token] += amount     │\n│  Public USDO │ ◄────────────   │        │                     │\n│  (ERC-20)    │   transfer      │        ▼                     │\n└──────────────┘                 │  Only owner can call         │\n                                 │  getEncryptedBalance()       │\n                                 │       ↓                      │\n                                 │  Returns: private uint256    │\n                                 │  (In production: encrypted)  │\n                                 └──────────────────────────────┘' },
                    { type: 'heading', content: 'Security Model', level: 2 },
                    { type: 'list', items: [
                        '**User-controlled decryption** — Only the depositor\'s wallet can decrypt their shielded balance via getEncryptedBalance().',
                        '**On-chain encryption** — In production, the _encryptedBalances mapping uses Rialo\'s REX for chain-level encryption, invisible to block explorers.',
                        '**Non-custodial** — The Privacy Pool holds tokens in escrow but the user retains full control. Unshielding is permissionless.',
                        '**Composable** — Shielded tokens (cUSDO, cUSDT, cUSDe) will integrate with other DeFi protocols in the future.',
                        '**ReentrancyGuard** — Protection against reentrancy attacks during shield/unshield operations.',
                    ]},
                    { type: 'heading', content: 'Testnet vs Mainnet', level: 2 },
                    { type: 'table', headers: ['Feature', 'Testnet (Base Sepolia)', 'Mainnet (Rialo)'], rows: [
                        ['Encryption', 'Smart contract mapping (simulated)', 'Native REX chain-level encryption'],
                        ['Balance visibility', 'View key = connected wallet', 'Cryptographic view key required'],
                        ['Privacy guarantee', 'Logic-level privacy', 'Cryptographic privacy (ZK-based)'],
                        ['Composability', 'Basic shield/unshield', 'Private DeFi (swaps, LP, lending)'],
                        ['Contract', '0xA7e722Bb...', 'Native chain module'],
                    ]},
                    { type: 'callout', variant: 'info', title: 'Rialo Integration', content: 'On Rialo mainnet, shielded assets will be handled by a confidential RFC (Request for Computation) interacting with the REX layer. This provides real cryptographic privacy guarantees at the chain level, far stronger than the current smart contract simulation.' },
                ]
            },
            {
                id: 'smart-contracts',
                title: 'Smart Contracts',
                content: [
                    { type: 'heading', content: 'Deployed Smart Contracts', level: 1 },
                    { type: 'paragraph', content: 'All Obscura smart contracts are deployed on Base Sepolia testnet (Chain ID: 84532). Contracts are built with Solidity ^0.8.20 and OpenZeppelin Contracts v5.0.0.' },
                    { type: 'heading', content: 'Protocol Contracts', level: 2 },
                    { type: 'table', headers: ['Contract', 'Address', 'Description'], rows: [
                        ['SimpleAMM', '0x944b6cB6d8621603B4a094955123dbD96e289bA2', 'AMM with constant product formula, liquidity pools, and 0.3% swap fee'],
                        ['SimpleSwap', '0x79b575397552f71Bc37d978DF8F75650B05f635a', 'Legacy simple swap contract (1:1 ratio)'],
                        ['RialoPrivacyPool', '0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45', 'Shield/Unshield contract for balance encryption'],
                    ]},
                    { type: 'heading', content: 'Token Contracts (ERC-20)', level: 2 },
                    { type: 'table', headers: ['Token', 'Contract Address', 'Decimals'], rows: [
                        ['USDO', '0x191798C747807ae164f2a28fA5DFb5145AcE4b6B', '18'],
                        ['USDT', '0xdf273C73aE8a405d200e87b869b1C53013e5f64b', '18'],
                        ['USDe', '0xCAfb242bE67dc84419750da1C69d6792907d602f', '18'],
                        ['GOLD', '0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a', '18'],
                        ['AAPL', '0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A', '18'],
                        ['MSTR', '0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719', '18'],
                    ]},
                    { type: 'heading', content: 'SimpleAMM ABI', level: 2 },
                    { type: 'paragraph', content: 'Key functions in the deployed SimpleAMM contract:' },
                    { type: 'code', language: 'json', content: '[\n  {"name":"swap","type":"function","stateMutability":"nonpayable",\n   "inputs":[{"name":"tokenIn","type":"address"},{"name":"tokenOut","type":"address"},\n   {"name":"amountIn","type":"uint256"},{"name":"minAmountOut","type":"uint256"}]},\n  {"name":"swapWithPyth","type":"function","stateMutability":"payable",\n   "inputs":[{"name":"tokenIn","type":"address"},{"name":"tokenOut","type":"address"},\n   {"name":"amountIn","type":"uint256"},{"name":"minAmountOut","type":"uint256"},\n   {"name":"priceUpdateData","type":"bytes[]"}]},\n  {"name":"addLiquidity","type":"function","stateMutability":"nonpayable",\n   "inputs":[{"name":"token","type":"address"},{"name":"amount","type":"uint256"}]},\n  {"name":"removeLiquidity","type":"function","stateMutability":"nonpayable",\n   "inputs":[{"name":"token","type":"address"},{"name":"shares","type":"uint256"}]},\n  {"name":"getAmountOut","type":"function","stateMutability":"view",\n   "inputs":[{"name":"tokenIn","type":"address"},{"name":"tokenOut","type":"address"},\n   {"name":"amountIn","type":"uint256"}],"outputs":[{"type":"uint256"}]},\n  {"name":"reserves","type":"function","stateMutability":"view",\n   "inputs":[{"name":"token","type":"address"}],"outputs":[{"type":"uint256"}]},\n  {"name":"getPrice","type":"function","stateMutability":"view",\n   "inputs":[{"name":"tokenIn","type":"address"},{"name":"tokenOut","type":"address"}],\n   "outputs":[{"name":"price","type":"uint256"}]}\n]' },
                    { type: 'heading', content: 'ERC-20 ABI', level: 2 },
                    { type: 'paragraph', content: 'Standard ERC-20 functions used across the application:' },
                    { type: 'code', language: 'json', content: '[\n  {"name":"approve","inputs":[{"name":"spender","type":"address"},{"name":"amount","type":"uint256"}],\n   "outputs":[{"type":"bool"}],"stateMutability":"nonpayable","type":"function"},\n  {"name":"allowance","inputs":[{"name":"owner","type":"address"},{"name":"spender","type":"address"}],\n   "outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},\n  {"name":"balanceOf","inputs":[{"name":"account","type":"address"}],\n   "outputs":[{"type":"uint256"}],"stateMutability":"view","type":"function"},\n  {"name":"decimals","inputs":[],"outputs":[{"type":"uint8"}],\n   "stateMutability":"view","type":"function"},\n  {"name":"mint","inputs":[{"name":"to","type":"address"},{"name":"amount","type":"uint256"}],\n   "outputs":[],"stateMutability":"nonpayable","type":"function"}\n]' },
                    { type: 'callout', variant: 'info', title: 'Block Explorer', content: 'All contracts can be verified and interacted with on BaseScan Sepolia at https://sepolia.basescan.org/. Search by contract address to view source code, read/write functions, and transaction history.' },
                ],
            },
        ]
    },

    // ───────────────────────── DEVELOPERS ─────────────────────────
    {
        id: 'developers',
        title: 'Developers',
        icon: '👨‍💻',
        pages: [
            {
                id: 'contract-addresses',
                title: 'Contract Addresses',
                content: [
                    { type: 'heading', content: 'Contract Addresses', level: 1 },
                    { type: 'paragraph', content: 'Quick reference for all deployed contract addresses on Base Sepolia testnet (Chain ID: 84532).' },
                    { type: 'heading', content: 'Protocol Contracts', level: 2 },
                    { type: 'code', language: 'text', content: '# Protocol Contract Addresses (Base Sepolia)\n\nSimpleAMM:         0x944b6cB6d8621603B4a094955123dbD96e289bA2\nSimpleSwap:        0x79b575397552f71Bc37d978DF8F75650B05f635a\nRialoPrivacyPool:  0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45' },
                    { type: 'heading', content: 'Token Contracts', level: 2 },
                    { type: 'code', language: 'text', content: '# Token Contract Addresses (Base Sepolia, all 18 decimals)\n\nUSDO:   0x191798C747807ae164f2a28fA5DFb5145AcE4b6B\nUSDT:   0xdf273C73aE8a405d200e87b869b1C53013e5f64b\nUSDe:   0xCAfb242bE67dc84419750da1C69d6792907d602f\nGOLD:   0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a\nAAPL:   0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A\nMSTR:   0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719' },
                    { type: 'heading', content: 'Pyth Price Feed IDs', level: 2 },
                    { type: 'code', language: 'text', content: '# Pyth Network Price Feed IDs\n\nUSDO:   0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a\nUSDT:   0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b\nUSDe:   0x6ec879b1e9963de5ee97e9c8710b742d6228252a5e2ca12d4ae81d7fe5ee8c5d\nGOLD:   0x765d2ba906dbc32ca17cc11f5310a89e9ee1f6420508c63861f2f8ba4ee34bb2\nAAPL:   0x49f6b65cb1de6b10eaf75e7c03ca029c306d0357e91b5311b175084a5ad55688\nMSTR:   0xe1e80251e5f5184f2195008382538e847fafc36f751896889dd3d1b1f6111f09' },
                    { type: 'heading', content: 'Network Configuration', level: 2 },
                    { type: 'code', language: 'typescript', content: 'import { baseSepolia } from \'wagmi/chains\';\nimport { http } from \'wagmi\';\nimport { createConfig } from \'wagmi\';\nimport { connectorsForWallets } from \'@rainbow-me/rainbowkit\';\n\n// Obscura wagmi config\nconst config = createConfig({\n  appName: "Obscura",\n  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",\n  chains: [baseSepolia],\n  transports: {\n    [baseSepolia.id]: http(),\n  },\n});' },
                ]
            },
            {
                id: 'integration-guide',
                title: 'Integration Guide',
                content: [
                    { type: 'heading', content: 'Integration Guide', level: 1 },
                    { type: 'paragraph', content: 'This guide covers how to integrate with Obscura\'s smart contracts programmatically using wagmi/viem. All examples use real contract addresses and ABIs from the deployed protocol.' },
                    { type: 'heading', content: 'Setup', level: 2 },
                    { type: 'code', language: 'bash', content: '# Install dependencies\nnpm install viem wagmi @tanstack/react-query @rainbow-me/rainbowkit' },
                    { type: 'heading', content: 'Reading Token Balances', level: 2 },
                    { type: 'code', language: 'typescript', content: 'import { createPublicClient, http, formatUnits } from \'viem\';\nimport { baseSepolia } from \'viem/chains\';\n\nconst client = createPublicClient({\n  chain: baseSepolia,\n  transport: http(),\n});\n\n// Read USDO balance\nconst rawBalance = await client.readContract({\n  address: \'0x191798C747807ae164f2a28fA5DFb5145AcE4b6B\',\n  abi: [{\n    name: "balanceOf", inputs: [{ name: "account", type: "address" }],\n    outputs: [{ type: "uint256" }], stateMutability: "view", type: "function"\n  }],\n  functionName: \'balanceOf\',\n  args: [userAddress],\n});\nconst balance = formatUnits(rawBalance, 18); // e.g. "100.0"' },
                    { type: 'heading', content: 'Executing a Swap (AMM)', level: 2 },
                    { type: 'code', language: 'typescript', content: 'import { useWriteContract } from \'wagmi\';\nimport { parseUnits } from \'viem\';\n\nconst AMM_ADDRESS = "0x944b6cB6d8621603B4a094955123dbD96e289bA2";\nconst USDO_ADDRESS = "0x191798C747807ae164f2a28fA5DFb5145AcE4b6B";\nconst GOLD_ADDRESS = "0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a";\n\nconst { writeContract } = useWriteContract();\n\n// Step 1: Approve SimpleAMM to spend your USDO\nawait writeContract({\n  address: USDO_ADDRESS,\n  abi: [{ name: "approve", inputs: [{ name: "spender", type: "address" },\n         { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }],\n         stateMutability: "nonpayable", type: "function" }],\n  functionName: "approve",\n  args: [AMM_ADDRESS, parseUnits("100", 18)],\n});\n\n// Step 2: Execute swap\nawait writeContract({\n  address: AMM_ADDRESS,\n  abi: [{ name: "swap", inputs: [\n    { name: "tokenIn", type: "address" },\n    { name: "tokenOut", type: "address" },\n    { name: "amountIn", type: "uint256" },\n    { name: "minAmountOut", type: "uint256" }\n  ], outputs: [], stateMutability: "nonpayable", type: "function" }],\n  functionName: "swap",\n  args: [USDO_ADDRESS, GOLD_ADDRESS, parseUnits("10", 18), parseUnits("0.001", 18)],\n});' },
                    { type: 'heading', content: 'Shielding Tokens', level: 2 },
                    { type: 'code', language: 'typescript', content: 'const PRIVACY_POOL = "0xA7e722Bb7b1FFeb14fbcd64e747B714C10eC5a45";\n\n// Step 1: Approve Privacy Pool\nawait writeContract({\n  address: USDO_ADDRESS,\n  abi: [{ name: "approve", inputs: [\n    { name: "spender", type: "address" },\n    { name: "amount", type: "uint256" }\n  ], outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" }],\n  functionName: "approve",\n  args: [PRIVACY_POOL, parseUnits("50", 18)],\n});\n\n// Step 2: Shield\nawait writeContract({\n  address: PRIVACY_POOL,\n  abi: [{ name: "shield", inputs: [\n    { name: "token", type: "address" },\n    { name: "amount", type: "uint256" }\n  ], outputs: [], stateMutability: "nonpayable", type: "function" }],\n  functionName: "shield",\n  args: [USDO_ADDRESS, parseUnits("50", 18)],\n});\n\n// Read shielded balance\nconst encrypted = await client.readContract({\n  address: PRIVACY_POOL,\n  abi: [{ name: "getEncryptedBalance", inputs: [\n    { name: "user", type: "address" },\n    { name: "token", type: "address" }\n  ], outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" }],\n  functionName: "getEncryptedBalance",\n  args: [userAddress, USDO_ADDRESS],\n});' },
                    { type: 'heading', content: 'Adding Liquidity', level: 2 },
                    { type: 'code', language: 'typescript', content: '// Step 1: Approve token\nawait writeContract({\n  address: GOLD_ADDRESS,\n  abi: [{ name: "approve", ... }],\n  functionName: "approve",\n  args: [AMM_ADDRESS, parseUnits("10", 18)],\n});\n\n// Step 2: Add liquidity (single-sided)\nawait writeContract({\n  address: AMM_ADDRESS,\n  abi: [{ name: "addLiquidity", inputs: [\n    { name: "token", type: "address" },\n    { name: "amount", type: "uint256" }\n  ], outputs: [], stateMutability: "nonpayable", type: "function" }],\n  functionName: "addLiquidity",\n  args: [GOLD_ADDRESS, parseUnits("10", 18)],\n});\n\n// Note: SimpleAMM uses single-sided liquidity provision.\n// LP shares = (amount * totalShares) / currentReserve\n// First provider gets shares = amount.' },
                    { type: 'heading', content: 'Minting Test Tokens', level: 2 },
                    { type: 'code', language: 'typescript', content: '// All tokens have a public mint() function on testnet\nconst TOKEN_ADDRESSES = {\n  USDO: "0x191798C747807ae164f2a28fA5DFb5145AcE4b6B",\n  USDT: "0xdf273C73aE8a405d200e87b869b1C53013e5f64b",\n  USDe: "0xCAfb242bE67dc84419750da1C69d6792907d602f",\n  GOLD: "0xcC4c135f274AEEc398B0ED10EbE5a29a359eE88a",\n  AAPL: "0x8cc4eeda6cFCE3EB253DA45e843330dDDfdF738A",\n  MSTR: "0x8Ed9dE6A498d5889fFb9aB0920aBDB5Fbe9f7719",\n};\n\n// Mint 1000 of any token\nawait writeContract({\n  address: TOKEN_ADDRESSES.GOLD,\n  abi: [{ name: "mint", inputs: [\n    { name: "to", type: "address" },\n    { name: "amount", type: "uint256" }\n  ], outputs: [], stateMutability: "nonpayable", type: "function" }],\n  functionName: "mint",\n  args: [userAddress, parseUnits("1000", 18)],\n});' },
                ],
            },
        ]
    },

    // ───────────────────────── RESOURCES ─────────────────────────
    {
        id: 'resources',
        title: 'Resources',
        icon: '📚',
        pages: [
            {
                id: 'faq',
                title: 'FAQ',
                content: [
                    { type: 'heading', content: 'Frequently Asked Questions', level: 1 },
                    { type: 'heading', content: 'General', level: 2 },
                    { type: 'heading', content: 'What is Obscura?', level: 3 },
                    { type: 'paragraph', content: 'Obscura is a privacy-first DeFi protocol built on Rialo infrastructure. It provides shielded transactions, AI-powered trading, and hybrid AMM+RFQ routing on Base Sepolia testnet.' },
                    { type: 'heading', content: 'Is Obscura live on mainnet?', level: 3 },
                    { type: 'paragraph', content: 'Not yet. Obscura is currently deployed on Base Sepolia testnet for testing and demonstration. Mainnet deployment on Rialo is planned for the future.' },
                    { type: 'heading', content: 'Are the tokens real?', level: 3 },
                    { type: 'paragraph', content: 'No. All tokens (USDO, GOLD, AAPL, etc.) on Obscura testnet are synthetic test tokens with no real monetary value. They are free to mint via the faucet.' },
                    { type: 'divider' },
                    { type: 'heading', content: 'Trading', level: 2 },
                    { type: 'heading', content: 'What is the difference between AMM and RFQ?', level: 3 },
                    { type: 'paragraph', content: 'AMM uses a mathematical formula (x × y = k) to determine prices with variable slippage. RFQ asks professional market makers to compete for your order, offering zero slippage. The smart router picks the best option automatically.' },
                    { type: 'heading', content: 'How does the AI Agent work?', level: 3 },
                    { type: 'paragraph', content: 'The AI Agent parses natural language inputs (like "swap 5 USDO to GOLD") using regex and AI models. It generates a swap preview which you must confirm via your wallet before execution.' },
                    { type: 'heading', content: 'Is there a trading fee?', level: 3 },
                    { type: 'paragraph', content: 'AMM trades incur a 0.3% fee (0.05% for stablecoin pairs). RFQ fees are built into the quoted price. All AMM fees go to liquidity providers.' },
                    { type: 'divider' },
                    { type: 'heading', content: 'Privacy', level: 2 },
                    { type: 'heading', content: 'How does shielding work?', level: 3 },
                    { type: 'paragraph', content: 'Shielding deposits your tokens into a Privacy Pool contract which encrypts your balance. You receive confidential tokens (e.g. cUSDO) that only you can view and manage.' },
                    { type: 'heading', content: 'Can someone see my shielded balance?', level: 3 },
                    { type: 'paragraph', content: 'No. Shielded balances are encrypted on-chain. Only the connected wallet that performed the shielding can decrypt and view the balance.' },
                    { type: 'heading', content: 'Can I unshield at any time?', level: 3 },
                    { type: 'paragraph', content: 'Yes. You can unshield (decrypt) your tokens back to public tokens at any time by calling the unshield function through the Shield tab.' },
                ]
            },
            {
                id: 'security',
                title: 'Security & Audits',
                content: [
                    { type: 'heading', content: 'Security & Audits', level: 1 },
                    { type: 'paragraph', content: 'Security is a top priority for Obscura. Below is our security posture and audit status.' },
                    { type: 'heading', content: 'Current Status', level: 2 },
                    { type: 'callout', variant: 'warning', title: 'Testnet Phase', content: 'Obscura is currently in testnet phase. Smart contracts have not been formally audited. Do NOT use with real funds. Mainnet deployment will include comprehensive security audits.' },
                    { type: 'heading', content: 'Security Practices', level: 2 },
                    { type: 'list', items: [
                        '**Non-custodial** — Obscura never takes custody of user funds. All transactions are executed via your wallet.',
                        '**Open Source** — Smart contract code is available for review.',
                        '**Wallet-only auth** — No usernames or passwords. Authentication is wallet-based.',
                        '**Transaction previews** — All swaps and operations show previews before execution.',
                    ]},
                    { type: 'heading', content: 'Planned Audits', level: 2 },
                    { type: 'paragraph', content: 'Before mainnet launch on Rialo, Obscura will undergo:' },
                    { type: 'list', items: [
                        'Smart contract security audit by a reputable firm',
                        'Privacy protocol review by cryptography specialists',
                        'Frontend security audit',
                        'Bug bounty program launch',
                    ]},
                ]
            },
            {
                id: 'community',
                title: 'Community & Support',
                content: [
                    { type: 'heading', content: 'Community & Support', level: 1 },
                    { type: 'paragraph', content: 'Join the Obscura community and get support from the team and fellow users.' },
                    { type: 'heading', content: 'Official Channels', level: 2 },
                    { type: 'table', headers: ['Platform', 'Link', 'Description'], rows: [
                        ['Discord', 'discord.com/invite/RialoProtocol', 'Main community hub — chat, support, announcements'],
                        ['Twitter/X', 'x.com/RialoHQ', 'Latest news, updates, and alpha'],
                        ['Telegram', 't.me/rialoprotocol', 'Community discussions and support'],
                    ]},
                    { type: 'heading', content: 'Getting Help', level: 2 },
                    { type: 'list', items: [
                        '**Discord #support** — Best place for technical support and troubleshooting.',
                        '**FAQ** — Check the FAQ section for common questions.',
                        '**GitHub Issues** — Report bugs or request features on our GitHub repository.',
                    ]},
                    { type: 'heading', content: 'Contributing', level: 2 },
                    { type: 'paragraph', content: 'Obscura is built by the community. If you\'re interested in contributing, reach out on Discord or check our GitHub for open issues and contribution guidelines.' },
                    { type: 'heading', content: 'Team', level: 2 },
                    { type: 'table', headers: ['Name', 'Role', 'Links'], rows: [
                        ['Vika Joestar', 'Co-Creator', 'Twitter: @cryptocymol | GitHub: cilokcimol'],
                        ['Skypots', 'Co-Creator', 'Twitter: @0xskypots | GitHub: taufnashrul04'],
                    ]},
                    { type: 'paragraph', content: 'Backed by BantolDAO.' },
                ]
            },
            {
                id: 'brand-assets',
                title: 'Brand Assets',
                content: [
                    { type: 'heading', content: 'Brand Assets', level: 1 },
                    { type: 'paragraph', content: 'Official Obscura brand guidelines and downloadable assets.' },
                    { type: 'heading', content: 'Colors', level: 2 },
                    { type: 'table', headers: ['Color', 'Hex', 'Usage'], rows: [
                        ['Neon Cyan', '#00E5FF', 'Primary accent, CTAs, links'],
                        ['Neon Purple', '#9D4EDD', 'Secondary accent, privacy features'],
                        ['Neon Green', '#00FF66', 'Success states, positive values'],
                        ['Neon Red', '#FF3366', 'Error states, negative values'],
                        ['Void Black', '#05050A', 'Background'],
                        ['Surface', '#0A0A12', 'Card backgrounds'],
                    ]},
                    { type: 'heading', content: 'Typography', level: 2 },
                    { type: 'table', headers: ['Font', 'Usage'], rows: [
                        ['Inter', 'Body text, UI elements'],
                        ['Space Grotesk', 'Headings'],
                        ['JetBrains Mono', 'Code, values, monospace displays'],
                        ['Rajdhani', 'Display headings, buttons'],
                    ]},
                    { type: 'heading', content: 'Logo Usage', level: 2 },
                    { type: 'paragraph', content: 'The Obscura logo should always appear on a dark background with adequate spacing. Do not modify colors, proportions, or add effects to the logo.' },
                ]
            },
        ]
    },
];
