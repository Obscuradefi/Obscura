# Obscura — System Architecture

> **Track**: Best Agentic Economy Experience on Arc
> **Tagline**: An autonomous stablecoin agent that researches, negotiates, and settles trades on Arc using oracle-bounded RFQ, USDC nanopayments, and programmable session keys.

This document is the architecture deliverable for the Stablecoin Commerce Stack Challenge. Read top-to-bottom for the full picture, or jump to a specific layer:

- [System diagram](#system-diagram)
- [Component contracts](#component-contracts)
- [Data flow: Agent-driven swap](#data-flow-agent-driven-swap)
- [Data flow: Nanopayment lifecycle](#data-flow-nanopayment-lifecycle)
- [Circle integration map](#circle-integration-map)
- [Security model](#security-model)

---

## System diagram

```mermaid
flowchart TD
  subgraph User["User wallet (RainbowKit / Circle Modular Wallets)"]
    UA[Account]
    UK[Session key]
  end

  subgraph Frontend["Obscura web app (React + Vite)"]
    UI[Swap / Shield / Markets UI]
    Agent[Intent agent\nNL parsing + watchers]
    SmartRoute[Smart Router]
    NanoLib[Nanopay client]
    RFQLib[RFQ maker pool]
  end

  subgraph Off["Off-chain services"]
    Hermes[Pyth Hermes API]
    Jatevo[Jatevo LLM\nintent parser]
    Makers[3 synthetic RFQ makers\nWintermute / Jump / Citadel]
  end

  subgraph Onchain["Arc Testnet (chainId 5042002)"]
    USDC[(USDC native\n0x3600...)]
    EURC[(EURC native\n0x89B5...)]
    Pyth[(Pyth contract\n0x2880aB...)]
    AMM[ObscuraAMM\nPyth-priced]
    RFQ[ObscuraRFQ\nEIP-712 + Pyth ceiling]
    Shield[ObscuraShield\nProgrammable privacy]
    Nano[ObscuraNanopay\nUSDC channels]
    Mocks[(MockToken\nJPYC GOLD AAPL MSTR)]
    FxEscrow[(StableFX FxEscrow\n0x867650...)]
  end

  UA --> UI
  UK -.-> Agent
  UI --> Agent
  Agent --> SmartRoute
  SmartRoute --> RFQLib
  SmartRoute --> AMM
  SmartRoute --> Hermes
  Agent --> Jatevo
  Agent --> NanoLib

  RFQLib --> Makers
  Makers -. signed quote .-> RFQLib
  RFQLib --> RFQ
  RFQ --> Pyth
  AMM --> Pyth
  AMM --> Mocks
  AMM --> EURC
  AMM --> USDC

  NanoLib -. payer-signed claim .-> Nano
  Nano --> USDC
  Shield --> USDC
  Shield --> EURC
  Shield --> Mocks

  RFQ -. compatible with .-> FxEscrow
```

---

## Component contracts

| Contract | Purpose | Key feature for Track 4 |
|---|---|---|
| **ObscuraAMM** | USDC-quoted constant-fee AMM, prices from Pyth | Lets the agent fall back to deterministic pricing when no maker is online |
| **ObscuraRFQ** | EIP-712 maker quotes with on-chain Pyth ceiling | Agent autonomously settles signed quotes; deviation cap means a compromised maker can't rug the agent |
| **ObscuraShield** | Privacy pool with Low/Medium/High lock windows | Agent can park strategy USDC out of front-running view |
| **ObscuraNanopay** | USDC payment channels for sub-cent billing | Agent pays per-quote, per-LLM-call, per-Pyth-push without on-chain cost per micro-event |
| **MockToken** | Faucet-enabled ERC-20 for synthetic markets | Demo-friendly without burning real testnet supply |

All contracts are deployed to Arc Testnet — see `deployments/arc-testnet.json` for the addresses.

---

## Data flow: Agent-driven swap

This is the canonical Track 4 demo: a user types a natural-language intent, and the agent autonomously researches multiple makers, picks the best, charges itself for the discovery work, and settles on-chain — all in a single user click.

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant A as Intent Agent
  participant J as Jatevo LLM
  participant N as Nanopay Channel
  participant SR as Smart Router
  participant H as Pyth Hermes
  participant M as Maker pool (×3)
  participant RFQ as ObscuraRFQ
  participant AMM as ObscuraAMM
  participant Pyth as Pyth on Arc

  U->>A: "swap 5 USDC to GOLD"
  A->>J: parse intent
  J-->>A: {type:swap, from:USDC, to:GOLD, amount:5}
  A->>N: charge $0.0005 (LLM parse)

  A->>SR: route(USDC, GOLD, 5)
  SR->>RFQ: fairAmountOut()
  RFQ->>Pyth: getPriceUnsafe(GOLD)
  Pyth-->>RFQ: $4500
  RFQ-->>SR: 0.001108 GOLD

  par fan-out to all makers
    SR->>M: requestQuote (Wintermute)
    SR->>M: requestQuote (Jump)
    SR->>M: requestQuote (Citadel)
  end
  M-->>SR: 3 EIP-712 signed quotes
  SR->>N: charge $0.001 × 3 (per-quote)
  SR-->>A: best = Wintermute @ 0.001119 GOLD (12bps better than fair)

  A->>U: preview ("Confirm?")
  U->>A: confirm
  A->>RFQ: settle(quote, signature)
  RFQ->>Pyth: getPriceUnsafe(GOLD) [ceiling check]
  RFQ->>RFQ: verify signature, check filled[id]
  RFQ-->>U: 0.001119 GOLD transferred
  RFQ-->>U: Settled event
```

What's "agentic" here:
1. The LLM call, the maker fan-out, the Pyth check, and the on-chain settlement are all coordinated by Obscura's agent without per-step user clicks.
2. The agent pays for its own work (LLM call + 3 quote requests = ~$0.0035) via Nanopay, demonstrating **pay-per-inference economics at sub-cent granularity**.
3. The user only signs once (the final settlement). Prior to that, every micro-event is signed by the agent's session key.

---

## Data flow: Nanopayment lifecycle

```mermaid
sequenceDiagram
  participant Payer as Payer (agent / user)
  participant Channel as ObscuraNanopay
  participant Payee as Payee (maker / LLM)

  Payer->>Channel: openChannel(payee, 0.10 USDC, salt)
  Channel-->>Payer: ChannelOpened(channelId)

  loop Off-chain micro-events
    Payee->>Payer: serve quote / parse / push
    Payer-->>Payee: signTypedData({totalSpent: t, nonce: n})
    Note over Payer: increments t and n in localStorage
  end

  Payee->>Channel: claim(channelId, t, n, signature)
  Channel->>Payer: verify EIP-712 + monotonic nonce
  Channel-->>Payee: pay (t - claimed) USDC

  Payer->>Channel: closeChannel(channelId)
  Note over Payer: cooldown begins (1h default)
  Payer->>Channel: sweep(channelId)
  Channel-->>Payer: refund unspent USDC
```

Why this matters for Track 4:
- **Sub-cent rates**: 0.001 USDC / quote is **literally 1 / 1000th of a cent on Arc** (gas-free off-chain signing + batched on-chain settlement).
- **No funds at risk**: the channel is escrowed in `ObscuraNanopay`, not held by the maker.
- **Monotonic nonce**: replay protection without timestamps.

---

## Circle integration map

| Circle product | How Obscura uses it | Status |
|---|---|---|
| **USDC** | Native gas + AMM quote token + Shield deposit asset + Nanopay channel currency | ✅ Deep integration |
| **EURC** | Real Arc-native EUR stablecoin, paired in AMM and RFQ | ✅ Deep integration |
| **Modular Wallets** | Passkey-secured smart accounts on Arc Testnet. Users create a wallet via WebAuthn, and `paymaster: true` sponsors gas through Circle Gas Station so swaps + RFQ settles cost the user **0 native USDC**. Adapter at `src/lib/circleWallet.ts`. | ✅ Built — connect button at top-right alongside RainbowKit |
| **Nanopayments** | Custom-built `ObscuraNanopay.sol` channel contract — agent pays per quote / per LLM parse / per Pyth push at sub-cent rates | ✅ Built + tested |
| **CCTP / Bridge Kit** | Future: agent claims USDC from Base/Ethereum, bridges to Arc, then trades | 🔵 Architecture-level |
| **StableFX FxEscrow** | Stablecoin pairs (USDC/EURC/JPYC) eligible for FxEscrow institutional settlement; Obscura's RFQ uses the same pattern | 🟡 Conceptual + UI badge |
| **USYC** | Future: idle Shield balance auto-allocates to USYC for yield | 🔵 Architecture-level |
| **Gateway** | Future: agent treasury routing | 🔵 Architecture-level |

Stack 1 (USDC + EURC + Nanopay) is fully built and tested. The rest are architecture-level integrations described in this document, in line with the rules: *"teams will not be penalized for building conceptual or architecture-level integrations if access is not granted."*

---

## Security model

### Threats and mitigations

| Threat | Mitigation |
|---|---|
| Compromised RFQ maker key signs absurd quote | `ObscuraRFQ.maxDeviationBps` rejects quotes more than ±2% from Pyth |
| Maker replays quoteId | `filled[quoteId]` mapping; one-shot per quote |
| Stale quote | EIP-712 message includes `expiry`; contract enforces `block.timestamp <= expiry` |
| Pyth feed staleness | `swapWithPriceUpdate` lets the user push fresh Hermes data + pay the tiny fee |
| Reentrancy in AMM/Shield/Nanopay/RFQ | Inline `nonReentrant` modifier on all entry points |
| Inverted feed precision loss (USD/JPY → JPY/USD) | High-precision invert keeps 18-digit precision regardless of source expo |
| Nanopay nonce regression | `lastNonce` strictly increasing per channel |
| Nanopay payee griefing payer | `closeChannel` + cooldown + `sweep` reclaims unspent funds |

### Key custody

- **EOA wallet (RainbowKit)**: standard MetaMask / WalletConnect / Coinbase. Default for users that already have a Web3 wallet.
- **Smart Contract Account (Circle Modular Wallets)**: passkey-secured. Created via `register` button in the header; first-time users get a WebAuthn-backed wallet without seed phrases. Gas is sponsored by Circle Gas Station via `paymaster: true`, so the user can swap and shield with **zero native USDC** — the smart account itself doesn't even need to be pre-funded for gas. Account is lazily deployed on the first user operation.
- **Agent session key**: derived from `VITE_RFQ_MAKER_PRIVATE_KEY` (demo only). Used to sign EIP-712 RFQ quotes and Nanopay claim messages. In production, this would be issued by Circle Modular Wallets with passkey-protected enrollment and a per-day spending cap. The current scope keeps it as an EOA because `ObscuraRFQ` and `ObscuraNanopay` use `ecrecover`; switching to ERC-1271 (`isValidSignature`) is a documented future-work item.
- **Maker keys**: 3 synthetic makers derived from the same seed (demo only). Production = each maker runs their own HSM.

### Access control

- `ObscuraAMM.listAsset`, `setMaker`, `setLevelLock`: owner-only (deployer)
- `ObscuraRFQ.setMaker`, `setMaxDeviationBps`: owner-only
- `ObscuraNanopay.setCooldown`: owner-only
- All state-mutating user functions: open

---

## File map (for the judging panel)

| Layer | Files |
|---|---|
| Solidity | `contracts/ObscuraAMM.sol`, `ObscuraRFQ.sol`, `ObscuraShield.sol`, `ObscuraNanopay.sol`, `MockToken.sol`, `MockPyth.sol`, `interfaces/*` |
| Deploy | `scripts/deploy.cjs`, `scripts/seedLiquidity.cjs`, `scripts/verify.cjs` |
| Tests | `test/Obscura.test.cjs` (23 cases) |
| Frontend (config) | `src/config/arc.ts`, `dexConfig.ts`, `rfqConfig.ts`, `nanopayConfig.ts`, `shieldConfig.ts`, `priceFeeds.ts` |
| Frontend (hooks) | `src/hooks/useAMMQuote.ts`, `useSmartRoute.ts`, `usePythSwap.ts`, `useTokenApproval.ts`, `useCircleWallet.tsx` |
| Frontend (lib) | `src/lib/rfqMaker.ts`, `nanopayClient.ts`, `priceOracle.ts`, `pythClient.ts`, `parseSwapIntent.ts`, `circleWallet.ts` |
| Frontend (UI) | `src/features/swap/SwapTab.tsx`, `SwapAgent.tsx`, `NanopayBadge.tsx`, `shield/ShieldTab.tsx`, `components/CircleWalletButton.tsx` |
