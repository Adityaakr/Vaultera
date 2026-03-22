<p align="center">
  <h1 align="center">Vaultera</h1>
  <p align="center"><strong>AI-Managed Vaults on Hedera — Transparent, Autonomous, On-Chain</strong></p>
</p>

<p align="center">
  <a href="#architecture">Architecture</a> •
  <a href="#product-overview">Product</a> •
  <a href="#smart-contracts">Contracts</a> •
  <a href="#ai-agents">Agents</a> •
  <a href="#frontend">Frontend</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## Product Overview

**Vaultera** is a DeFi asset management platform where AI agents autonomously manage on-chain vaults. Users deposit capital (USDC, vaUSD, or HBAR) into vaults, and each vault is managed by an AI agent that makes real-time strategy allocation decisions — every decision recorded immutably on Hedera.

### The Problem

DeFi yield management is complex, time-consuming, and opaque. Users either manage positions manually (high effort, suboptimal) or trust centralized fund managers (black box, custody risk). There's no middle ground that offers autonomous management with full transparency.

### The Solution

Vaultera introduces **AI-managed vaults with radical transparency**:

- **Autonomous Agents** — AI agents (powered by LLMs) continuously analyze market conditions and execute strategy allocations on-chain. No human in the loop.
- **Full Transparency** — Every agent decision, including the reasoning behind it, is recorded on-chain via Hedera smart contracts and the Hedera Consensus Service (HCS). Users can audit every thought the agent had.
- **Competitive Arena** — Vaults can stake capital against each other in adversarial rounds. An LLM judge evaluates the positions and awards the winner 90% of the combined pot — a novel mechanism for agent-vs-agent competition.
- **Real-time Performance** — Live TVL tracking, yield accrual simulation, sparkline charts, and animated counters provide a real-time view of vault performance down to the second.

### Key Differentiators

| Feature | Traditional DeFi | Vaultera |
|---------|-----------------|----------|
| Management | Manual or opaque fund manager | Autonomous AI with public reasoning |
| Transparency | Transaction history only | Full decision logs + LLM reasoning on HCS |
| Competition | None | Agent-vs-agent Arena with staked capital |
| Execution | User-triggered | Autonomous with scheduled actions |
| Chain | Various | Hedera (fast finality, low cost, HCS) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │  Vaults  │ │  Agents  │ │  Arena   │ │ Activity / Perf   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬──────────┘   │
│       │             │            │                 │              │
│  ┌────▼─────────────▼────────────▼─────────────────▼──────────┐  │
│  │              ethers.js v6 + React Query                    │  │
│  │    ┌──────────────┐     ┌─────────────────────┐            │  │
│  │    │ JSON-RPC      │     │ Mirror Node REST    │            │  │
│  │    │ (read/write)  │     │ (logs, txs, HCS)    │            │  │
│  │    └──────┬───────┘     └──────────┬──────────┘            │  │
│  └───────────┼────────────────────────┼───────────────────────┘  │
└──────────────┼────────────────────────┼──────────────────────────┘
               │                        │
    ┌──────────▼────────────────────────▼──────────┐
    │              HEDERA TESTNET                   │
    │                                               │
    │  ┌─────────────────────────────────────────┐  │
    │  │         Smart Contracts (EVM)           │  │
    │  │                                         │  │
    │  │  VaultArenaV2 ×3   Strategy ×3          │  │
    │  │  ┌─────────────┐   ┌──────────────┐     │  │
    │  │  │ deposit()   │──▶│ StableLending │     │  │
    │  │  │ withdraw()  │   │ MomentumPool │     │  │
    │  │  │ allocate()  │   │ YieldFarm    │     │  │
    │  │  │ arena()     │   └──────────────┘     │  │
    │  │  │ execute()   │                        │  │
    │  │  └──────┬──────┘   ┌──────────────┐     │  │
    │  │         │          │    Arena      │     │  │
    │  │         └─────────▶│ openRound()  │     │  │
    │  │                    │ resolve()    │     │  │
    │  │                    └──────────────┘     │  │
    │  │                                         │  │
    │  │  MockUSDC          VaultArenaUSD (vaUSD) │  │
    │  └─────────────────────────────────────────┘  │
    │                                               │
    │  ┌─────────────────────────────────────────┐  │
    │  │     Hedera Consensus Service (HCS)      │  │
    │  │     Topic per agent (immutable logs)     │  │
    │  └─────────────────────────────────────────┘  │
    └───────────────────────────────────────────────┘
               ▲
               │  ethers + @hashgraph/sdk
    ┌──────────┴───────────────────────────────────┐
    │              AI AGENT RUNNER (Node.js)        │
    │                                               │
    │  ┌────────────┐  ┌─────────────────────────┐  │
    │  │ Atlas      │  │  Decision Loop:         │  │
    │  │ Meridian   │  │  1. Read vault state    │  │
    │  │ Echo       │  │  2. Query LLM           │  │
    │  │ (personas) │  │  3. Parse JSON actions  │  │
    │  └────────────┘  │  4. Execute on-chain    │  │
    │                  │  5. Publish to HCS      │  │
    │  ┌────────────┐  │  6. Resolve arena       │  │
    │  │ OpenRouter │  └─────────────────────────┘  │
    │  │ (Gemini)   │                               │
    │  └────────────┘                               │
    └───────────────────────────────────────────────┘
```

### Data Flow

```
User deposits USDC/vaUSD/HBAR into VaultArenaV2
        │
        ▼
Agent runner wakes up (every 15–30s)
        │
        ├── Reads on-chain state: TVL, idle balance, strategy allocations
        │
        ├── Constructs prompt with vault state + agent persona
        │
        ├── Calls LLM (OpenRouter → Gemini 2.0 Flash)
        │         │
        │         ▼
        │   LLM returns JSON: { actions: [...], reasoning: "..." }
        │
        ├── Executes actions on-chain:
        │     • allocateToStrategy(strategy, amount)
        │     • deallocateFromStrategy(strategy, amount)
        │     • openArenaRound(arena, stake, position)
        │     • acceptArenaRound(arena, roundId, stake, position)
        │
        ├── Calls vault.executeAction(reasoning, cycleLabel)
        │     → emits AgentAction event (permanent on-chain record)
        │
        └── Publishes full decision JSON to HCS topic
              → immutable, timestamped, publicly queryable

Frontend reads all of this:
  • Contract state via JSON-RPC (TVL, balances, share price)
  • Event logs via Mirror Node (deposits, withdrawals, allocations)
  • HCS messages via Mirror Node (agent reasoning, decisions)
  • Renders real-time performance with 1s client-side yield simulation
```

---

## Smart Contracts

All contracts are deployed on **Hedera Testnet** (Chain ID 296) using Solidity 0.8.20 and OpenZeppelin.

### VaultArenaV2.sol — Multi-Asset Vault

The core vault contract. Accepts USDC, vaUSD, and native HBAR deposits. Mints ERC20 share tokens proportional to USD value deposited.

| Function | Access | Description |
|----------|--------|-------------|
| `deposit(usdcAmt, vausdAmt)` | Public (payable) | Multi-asset deposit — USDC, vaUSD, and/or HBAR in a single tx |
| `withdraw(shares, tokenChoice)` | Public | Burns shares, returns capital as USDC (0), vaUSD (1), or HBAR (2) |
| `allocateToStrategy(strategy, amount)` | Agent only | Moves idle USDC into a yield strategy |
| `deallocateFromStrategy(strategy, amount)` | Agent only | Pulls USDC back from a strategy |
| `openArenaRound(arena, stake, position)` | Agent only | Stakes vault capital in an Arena round |
| `acceptArenaRound(arena, roundId, stake, position)` | Agent only | Accepts an existing Arena challenge |
| `executeAction(action, reason)` | Agent only | Emits `AgentAction` event with LLM reasoning |
| `tvl()` | View | Total value locked in USD (HBAR + USDC + vaUSD + strategies) |

### Strategy.sol — Yield Strategy

Simple per-vault bookkeeping for USDC parked in a named strategy. Each strategy is a separate deployment (StableLending, MomentumPool, YieldFarm).

### Arena.sol — Agent-vs-Agent Competition

A staking arena where vaults compete head-to-head:

1. **Vault A** opens a round with a USDC stake and a text position (strategy thesis)
2. **Vault B** accepts with a counter-stake and counter-position
3. **Owner** (agent runner) resolves: winner receives 90% of the pot, 10% protocol fee

### MockUSDC.sol & VaultArenaUSD.sol

- **MockUSDC**: Mintable test USDC with a supply cap
- **VaultArenaUSD (vaUSD)**: Wrapped stablecoin layer — 1:1 USDC deposit/redeem, with authorized minters (vaults) for share-based minting

### Deployed Addresses (Testnet)

| Contract | Address |
|----------|---------|
| MockUSDC | `0xFD5781032DBA8d0B5bcB3D748B7eeB7a04645c58` |
| VaultArenaUSD | `0x18F1C2774e9258B7f2A1cFdd4C12153Ce1eE4000` |
| Arena | `0x0369CBc3AeCb15958B21F0D09d52687eC531af7C` |
| Vault 1 (HBAR Treasury Core) | `0x9a80F22B460c2CB12d3aAa3CDA67e54eEcA34715` |
| Vault 2 (StableFlow Income) | `0x9E0fD2dF3f29ef9FadE393D12228A7Ab0e432029` |
| Vault 3 (Momentum Alpha) | `0x9A285a32bE626b60ae26E0fb070604457B2bF66E` |
| StableLending | `0xDd24ca681945b9CBBFF0cCA4DB8921C074aB4249` |
| MomentumPool | `0x0703507889DA42464719ca6769e47FA8A195a202` |
| YieldFarm | `0x888b9514f268AEE82dD47EF1Fde7909C511A40A5` |

---

## AI Agents

Three autonomous agents manage the vaults, each with a distinct personality and risk profile:

| Agent | Style | Risk | Manages | HCS Topic |
|-------|-------|------|---------|-----------|
| **Atlas** | Conservative Macro | Low | HBAR Treasury Core | `0.0.8333665` |
| **Meridian** | Dynamic Momentum | Moderate | Momentum Alpha | `0.0.8333666` |
| **Echo** | Adaptive Yield | Low | StableFlow Income | `0.0.8333667` |

### Agent Decision Loop

```
┌─────────────────────────────────────────────┐
│                 AGENT CYCLE                  │
│                                              │
│  1. Execute any due scheduled actions        │
│         │                                    │
│  2. Check Arena state                        │
│         │                                    │
│  3. Resolve completed Arena rounds (LLM      │
│     acts as judge, picks winner)             │
│         │                                    │
│  4. For each agent persona:                  │
│     ┌───────────────────────────────────┐    │
│     │ a. Fetch vault on-chain state     │    │
│     │    (TVL, idle, deployed, allocs)  │    │
│     │                                   │    │
│     │ b. Build system prompt with       │    │
│     │    persona + vault context        │    │
│     │                                   │    │
│     │ c. Call LLM → JSON response:      │    │
│     │    {                              │    │
│     │      "actions": [                 │    │
│     │        { "type": "allocate",      │    │
│     │          "strategy": "...",       │    │
│     │          "amount": 1000 }         │    │
│     │      ],                           │    │
│     │      "reasoning": "Given the..."  │    │
│     │    }                              │    │
│     │                                   │    │
│     │ d. Execute actions on-chain       │    │
│     │    (immediate or scheduled)       │    │
│     │                                   │    │
│     │ e. Call vault.executeAction()     │    │
│     │    → AgentAction event emitted    │    │
│     │                                   │    │
│     │ f. Publish reasoning to HCS topic │    │
│     └───────────────────────────────────┘    │
│                                              │
│  5. Sleep → next cycle                       │
└─────────────────────────────────────────────┘
```

### LLM Integration

The agent runner supports two LLM backends:
- **OpenRouter** (default): Uses `google/gemini-2.0-flash-001` via the OpenAI-compatible API
- **OpenAI** (optional): Uses `gpt-4o-mini` when `OPENAI_API_KEY` is set

The LLM receives a structured system prompt defining the agent's personality, available actions (allocate, deallocate, arena_open, arena_accept), current vault state, and strategy options. It returns a JSON response with actions and reasoning.

### Scheduling

Agents can defer actions by setting `"schedule": true` in the LLM response. Scheduled actions are stored in memory and executed after a configurable delay (30s in `--fast` mode, 60s normally). The frontend displays pending scheduled actions with countdown timers.

---

## Frontend

A React single-page application providing real-time visibility into every aspect of the platform.

### Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Marketing page with hero, features, trust indicators |
| `/app` | Overview | Platform dashboard with live activity, vault summary, KPIs |
| `/app/vaults` | Vaults | All vaults with on-chain TVL, APY, risk levels |
| `/app/vaults/:id` | Vault Detail | Deep dive: deposit/withdraw, live performance, agent activity, scheduled actions |
| `/app/agents` | Agents | All AI agents with trust scores, returns, strategies |
| `/app/agents/:id` | Agent Detail | Agent profile, HCS decision logs, managed vaults |
| `/app/arena` | Arena | Active and resolved agent-vs-agent rounds |
| `/app/leaderboard` | Leaderboard | Agent rankings by performance metrics |
| `/app/activity` | Activity | Full platform activity log with filters and on-chain event decoding |
| `/app/portfolio` | Portfolio | User's positions across vaults |
| `/app/settings` | Settings | Wallet, testnet faucet, preferences |

### Real-time Performance Engine

The vault detail page features a custom real-time performance engine (`usePerformanceHistory` hook):

- **On-chain polling** (every 15s): Fetches actual TVL, idle balance, deployed capital, and strategy allocations from the contract
- **Client-side yield simulation** (every 1s): Interpolates TVL growth between polls using strategy APY rates, creating a smooth ticking effect
- **Animated counters**: `TickingCounter` component uses `requestAnimationFrame` for smooth number transitions
- **SVG sparkline**: Renders TVL history with gradient fill and pulsing current-value dot
- **Live returns**: 10-minute and session returns with both dollar and percentage display, ticking in real-time

### Activity Log

The activity log decodes on-chain events from the Hedera Mirror Node:

- **Event decoding**: ABI-decodes `Deposited`, `Withdrawn`, `StrategyAllocated`, `StrategyDeallocated`, `ArenaEntered`, and `AgentAction` events
- **Agent decisions**: Displays the full LLM reasoning as quoted text, with cycle labels, execution badges, and HashScan links
- **Filtering**: Filter by event type with live counts per category
- **Rich display**: Dollar amounts, strategy names, transaction hashes, agent avatars

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **bun**
- A **Hedera Testnet** account ([portal.hedera.com](https://portal.hedera.com))
- An **OpenRouter** API key ([openrouter.ai](https://openrouter.ai)) or **OpenAI** API key

### 1. Clone and Install

```bash
git clone https://github.com/your-org/vaultera.git
cd vaultera
npm install
cd agents && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Frontend (public)
VITE_HEDERA_NETWORK=testnet
VITE_HEDERA_CHAIN_ID=296
VITE_HEDERA_RPC_URL=https://testnet.hashio.io/api
VITE_HEDERA_MIRROR_URL=https://testnet.mirrornode.hedera.com

# Server-side (Hardhat deploy + agent runner)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=0x...
HEDERA_EVM_ADDRESS=0x...

# LLM (at least one required for agents)
OPENROUTER_API_KEY=sk-or-v1-...
# OPENAI_API_KEY=sk-...          # optional alternative
```

### 3. Deploy Contracts (if starting fresh)

```bash
# Deploy the full V2 stack: USDC, vaUSD, vaults, strategies, arena
node scripts/deploy-v2.mjs

# Create HCS topics for agent logs
node scripts/setup-hcs.mjs
```

Update `src/config/contracts.ts` with the printed addresses and `HCS_TOPIC_IDS`.

### 4. Start the Frontend

```bash
npm run dev
```

The app will be available at `http://localhost:8080`.

### 5. Start the Agent Runner

```bash
cd agents
node runner.mjs --continuous --fast
```

Flags:
- `--continuous` — Run indefinitely (default: 5 cycles)
- `--fast` — 15s cycle interval, 30s schedule delay (default: 30s / 60s)

---

## Deployment

### Contract Deployment Order

```
1. MockUSDC
2. VaultArenaUSD (needs USDC address)
3. VaultArenaV2 ×3 (needs USDC, vaUSD, agent address)
4. Authorize vaults as vaUSD minters
5. Strategy ×3 (needs USDC address)
6. Arena (needs USDC address)
7. Seed: mint USDC, deposit into vaults
```

The `scripts/deploy-v2.mjs` script handles this entire sequence.

### Frontend Build

```bash
npm run build    # production
npm run preview  # preview production build
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Hedera Testnet (EVM-compatible, Chain ID 296) |
| **RPC** | Hashio (`testnet.hashio.io/api`) |
| **Consensus** | Hedera Consensus Service (HCS) — immutable agent logs |
| **Mirror Node** | `testnet.mirrornode.hedera.com` — event logs, transactions, HCS messages |
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin, Hardhat |
| **Agent Runtime** | Node.js (ESM), ethers v6, @hashgraph/sdk |
| **LLM** | OpenRouter (Gemini 2.0 Flash) / OpenAI (GPT-4o-mini) |
| **Frontend** | React 18, TypeScript, Vite 5 (SWC) |
| **Styling** | Tailwind CSS, shadcn/ui (Radix primitives) |
| **State** | TanStack React Query |
| **Animation** | Framer Motion, requestAnimationFrame |
| **Charts** | Recharts, custom SVG sparklines |
| **Wallet** | MetaMask (EIP-1193), ethers BrowserProvider |
| **Testing** | Vitest, Playwright |

---

## Project Structure

```
vaultera/
├── contracts/              # Solidity smart contracts
│   ├── VaultArenaV2.sol    # Multi-asset vault (main)
│   ├── Strategy.sol        # Yield strategy bookkeeping
│   ├── Arena.sol           # Agent-vs-agent staking arena
│   ├── MockUSDC.sol        # Test USDC token
│   ├── VaultArenaUSD.sol   # vaUSD wrapped stablecoin
│   └── VaultArena.sol      # V1 HBAR-only vault (legacy)
├── agents/                 # AI agent runner
│   ├── runner.mjs          # Main decision loop + on-chain execution
│   └── strategies.mjs      # Agent personas + system prompts
├── scripts/                # Deployment and setup
│   ├── deploy-v2.mjs       # Full V2 stack deployment
│   ├── setup-hcs.mjs       # HCS topic creation
│   └── seed-deposits.mjs   # Testnet seeding
├── src/                    # React frontend
│   ├── config/             # Contract addresses, agent/vault metadata
│   ├── hooks/              # Data fetching (activities, vaults, performance, HCS)
│   ├── components/         # UI components (ActivityFeedItem, PerformancePanel, ...)
│   ├── pages/              # Route pages (Overview, Vaults, Agents, Arena, ...)
│   ├── lib/                # Contract helpers, mirror node client, wallet
│   └── contexts/           # Wallet context provider
├── hardhat.config.cjs      # Hardhat config for Hedera
├── vite.config.ts          # Vite dev server config
├── .env.example            # Environment template
└── package.json
```

---

## License

MIT
