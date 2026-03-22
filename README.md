<p align="center">
  <img src="./public/logo-256.png" alt="Vaultera" width="120" height="120" />
</p>
<h1 align="center">Vaultera</h1>
<p align="center"><strong>Autonomous AI-Managed Vaults on Hedera</strong></p>
<p align="center">Transparent. Autonomous. On-Chain.</p>

<p align="center">
  <a href="#architecture">Architecture</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#smart-contracts">Contracts</a> •
  <a href="#ai-agents">Agents</a> •
  <a href="#frontend">Frontend</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## What is Vaultera?

Vaultera is a decentralized asset management protocol where **autonomous AI agents** manage on-chain vaults in real time. Users deposit capital into vaults, and each vault is operated by an AI agent that continuously analyzes market conditions, allocates to yield strategies, and competes in adversarial staking arenas — with every single decision immutably recorded on Hedera.

No human in the loop. No black boxes. Full radical transparency.

### The Problem

DeFi yield management today forces users into a binary choice: manage positions manually (complex, time-consuming, suboptimal) or delegate to opaque fund managers (custody risk, zero visibility). There is no option that combines autonomous execution with complete decision transparency.

### The Vaultera Solution

- **Autonomous Execution** — AI agents continuously monitor vault state and execute strategy allocations without manual intervention. Each agent operates under a distinct risk profile and investment thesis.
- **Radical Transparency** — Every agent decision — including the full reasoning behind it — is recorded on-chain via smart contract events and the Hedera Consensus Service (HCS). Users can audit every thought the agent had, in perpetuity.
- **Competitive Arena** — Vaults stake capital against each other in adversarial rounds. An independent AI judge evaluates positions and awards the winner 90% of the combined pot. This creates a Darwinian selection pressure on agent strategies.
- **Real-Time Performance** — Live TVL tracking with sub-second yield accrual simulation, animated sparkline charts, and ticking performance counters.

### Key Differentiators

| | Traditional DeFi | Vaultera |
|---|---|---|
| **Management** | Manual or opaque fund manager | Autonomous AI with public reasoning |
| **Transparency** | Transaction history only | Full decision logs + reasoning on HCS |
| **Competition** | None | Agent-vs-agent Arena with staked capital |
| **Execution** | User-triggered | Continuous autonomous cycles |
| **Infrastructure** | Various L1/L2 | Hedera (fast finality, low cost, native consensus service) |

---

## Architecture

<p align="center">
  <img src="./docs/diagrams/architecture.svg" alt="Vaultera System Architecture" width="100%"/>
</p>

The system is composed of three layers:

**Frontend** — A React dashboard that reads vault state via JSON-RPC and event history via the Hedera Mirror Node. Provides real-time performance visualization, activity feeds, agent decision logs, and portfolio management.

**Hedera Network** — Smart contracts handle custody, share accounting, strategy allocation, and arena mechanics. HCS provides an immutable append-only log for agent reasoning. All contract interactions emit events queryable through the Mirror Node.

**Agent Runtime** — An off-chain Node.js process that runs continuous decision cycles. Each cycle reads on-chain state, queries a high-performance agentic language model, parses the structured response, executes transactions, and publishes the full reasoning to HCS.

---

## How It Works

<p align="center">
  <img src="./docs/diagrams/data-flow.svg" alt="Vaultera Data Flow" width="85%"/>
</p>

1. **Users deposit** USDC, vaUSD, or native HBAR into a vault. The vault mints tokenized share tokens (e.g. `vaHBAR`, `vaSFI`, `vaMALPHA`) proportional to the USD value deposited. These shares are standard ERC20 tokens — transferable, composable, and queryable on-chain.
2. **The AI agent wakes up** on a continuous cycle (configurable interval). It reads the vault's on-chain state: TVL, idle balance, deployed capital, strategy allocations, and open arena rounds.
3. **The agent queries its LLM backend** with a structured prompt containing its persona, risk constraints, and the current vault context. The model returns a JSON response with actions and reasoning.
4. **Actions are executed on-chain** — strategy allocations, deallocations, arena stakes — and the agent calls `executeAction()` which emits an immutable `AgentAction` event.
5. **The full decision payload is published to HCS**, creating a permanent, timestamped, publicly queryable record of the agent's reasoning.
6. **The frontend renders everything** by reading contract state via RPC, event logs via the Mirror Node, and HCS messages — providing users with complete visibility.

---

## Smart Contracts

<p align="center">
  <img src="./docs/diagrams/contract-topology.svg" alt="Vaultera Contract Topology" width="90%"/>
</p>

All contracts are deployed on **Hedera** using Solidity 0.8.20 and OpenZeppelin.

### Vault (VaultArenaV2.sol)

The core vault contract. Accepts multi-asset deposits and mints proportional ERC20 share tokens.

| Function | Access | Description |
|---|---|---|
| `deposit(usdcAmt, vausdAmt)` | Public (payable) | Multi-asset deposit — USDC, vaUSD, and/or HBAR in a single transaction |
| `withdraw(shares, tokenChoice)` | Public | Burns shares and returns capital as USDC, vaUSD, or HBAR |
| `allocateToStrategy(strategy, amount)` | Agent | Moves idle USDC into a yield strategy |
| `deallocateFromStrategy(strategy, amount)` | Agent | Pulls USDC back from a strategy |
| `openArenaRound(arena, stake, position)` | Agent | Stakes vault capital in an Arena round |
| `acceptArenaRound(arena, roundId, stake, position)` | Agent | Accepts an existing Arena challenge |
| `executeAction(action, reason)` | Agent | Emits `AgentAction` event with full reasoning |
| `tvl()` | View | Total value locked across all asset types and strategies |

### Strategy (Strategy.sol)

Per-vault USDC bookkeeping for named yield strategies. Each strategy (StableLending, MomentumPool, YieldFarm) is deployed as a separate contract with isolated accounting.

### Arena (Arena.sol)

An adversarial staking mechanism where vaults compete head-to-head:

1. **Vault A** opens a round with a USDC stake and a strategy thesis
2. **Vault B** accepts with a counter-stake and counter-thesis
3. Resolution awards the winner **90%** of the combined pot; **10%** is retained as a protocol fee

### Supporting Contracts

- **USDC** — Mintable test stablecoin with capped supply
- **vaUSD (VaultArenaUSD)** — Wrapped stablecoin layer with 1:1 USDC parity and authorized vault minting

### Tokenized Vault Shares

Each vault mints an ERC20 share token that represents a user's proportional claim on the vault's assets. These tokens are fully transferable and composable with other DeFi protocols.

| Vault | Share Token | Ticker | Address |
|---|---|---|---|
| HBAR Treasury Core | Vaultera HBAR | `vaHBAR` | `0x9a80F22B460c2CB12d3aAa3CDA67e54eEcA34715` |
| StableFlow Income | Vaultera SFI | `vaSFI` | `0x9E0fD2dF3f29ef9FadE393D12228A7Ab0e432029` |
| Momentum Alpha | Vaultera MALPHA | `vaMALPHA` | `0x9A285a32bE626b60ae26E0fb070604457B2bF66E` |

### All Deployed Contracts

| Contract | Address |
|---|---|
| USDC | `0xFD5781032DBA8d0B5bcB3D748B7eeB7a04645c58` |
| vaUSD | `0x18F1C2774e9258B7f2A1cFdd4C12153Ce1eE4000` |
| Arena | `0x0369CBc3AeCb15958B21F0D09d52687eC531af7C` |
| StableLending Strategy | `0xDd24ca681945b9CBBFF0cCA4DB8921C074aB4249` |
| MomentumPool Strategy | `0x0703507889DA42464719ca6769e47FA8A195a202` |
| YieldFarm Strategy | `0x888b9514f268AEE82dD47EF1Fde7909C511A40A5` |

---

## AI Agents

Three autonomous agents manage the protocol's vaults, each with a distinct investment personality:

| Agent | Strategy Style | Risk Profile | Vault | Token |
|---|---|---|---|---|
| **Atlas** | Conservative Macro | Low | HBAR Treasury Core | `vaHBAR` |
| **Meridian** | Dynamic Momentum | Moderate | Momentum Alpha | `vaMALPHA` |
| **Echo** | Adaptive Yield | Low | StableFlow Income | `vaSFI` |

### Decision Loop

<p align="center">
  <img src="./docs/diagrams/agent-loop.svg" alt="Vaultera Agent Decision Loop" width="85%"/>
</p>

Each agent cycle:

1. **Execute scheduled actions** — Deferred allocations from previous cycles are executed when their timers expire.
2. **Arena management** — Check for open rounds, resolve completed rounds using an independent AI judge.
3. **Read on-chain state** — TVL, idle balance, strategy allocations, arena positions.
4. **Query the LLM** — A structured prompt containing the agent's persona and vault context is sent to a high-performance agentic model. The response is a JSON object with actions and reasoning.
5. **Execute on-chain** — Strategy allocations, deallocations, or arena entries are submitted as transactions. `executeAction()` emits an immutable event.
6. **Publish to HCS** — The full decision payload is written to the agent's Hedera Consensus Service topic.

### Model-Agnostic Runtime

The agent runtime is designed to be **model-agnostic**. It communicates with any LLM backend through an OpenAI-compatible API interface. The system supports pluggable model providers and can be configured to use different models for different agent personas. In production, Vaultera runs high-quality agentic models optimized for structured reasoning and financial decision-making.

### Scheduling

Agents can defer actions by flagging them for scheduled execution. Scheduled actions are stored with a configurable delay and executed automatically when their timer expires. The frontend displays pending scheduled actions with live countdown timers.

---

## Frontend

A React single-page application providing complete real-time visibility into the protocol.

### Pages

| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/app` | Platform overview — live activity, vault summary, KPIs |
| `/app/vaults` | All vaults with on-chain TVL, APY, risk levels |
| `/app/vaults/:id` | Vault deep dive — deposit/withdraw, live performance, agent activity, scheduled actions |
| `/app/agents` | Agent profiles with trust scores, returns, strategies |
| `/app/agents/:id` | Agent detail — HCS decision logs, managed vaults |
| `/app/arena` | Active and resolved agent-vs-agent rounds |
| `/app/leaderboard` | Agent rankings by performance metrics |
| `/app/activity` | Full activity log with event decoding and filters |
| `/app/portfolio` | User positions and returns across vaults |
| `/app/settings` | Wallet management and testnet configuration |

### Real-Time Performance Engine

The vault detail page runs a custom real-time performance engine:

- **On-chain polling** (15s interval) — Fetches TVL, idle balance, deployed capital, and strategy allocations directly from contracts
- **Client-side yield simulation** (1s tick) — Interpolates TVL growth between polls using strategy APY rates for smooth real-time visualization
- **Animated counters** — `requestAnimationFrame`-powered number transitions for live dollar and percentage values
- **SVG sparkline** — Renders TVL history with gradient fill and a pulsing current-value indicator
- **Live returns** — 10-minute and session returns with both dollar and percentage display, ticking every second

### Activity Feed

The activity feed decodes on-chain events in real time:

- ABI-decodes all contract events (deposits, withdrawals, allocations, agent actions)
- Displays agent reasoning as quoted decision cards with execution status badges
- Filterable by event type with live counts per category
- Direct links to transaction details on HashScan

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- A **Hedera** account ([portal.hedera.com](https://portal.hedera.com))
- An LLM API key (any OpenAI-compatible provider)

### 1. Clone and Install

```bash
git clone https://github.com/Adityaakr/Vaultera.git
cd Vaultera
npm install
cd agents && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Frontend (public)
VITE_HEDERA_NETWORK=testnet
VITE_HEDERA_CHAIN_ID=296
VITE_HEDERA_RPC_URL=https://testnet.hashio.io/api
VITE_HEDERA_MIRROR_URL=https://testnet.mirrornode.hedera.com

# Server-side (deploy scripts + agent runner)
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=0x...
HEDERA_EVM_ADDRESS=0x...

# LLM (any OpenAI-compatible provider)
OPENROUTER_API_KEY=sk-or-v1-...
# OPENAI_API_KEY=sk-...
```

### 3. Deploy Contracts

```bash
node scripts/deploy-v2.mjs       # Full contract stack
node scripts/setup-hcs.mjs       # HCS topics for agent logs
```

Update `src/config/contracts.ts` with the printed addresses.

### 4. Start the Frontend

```bash
npm run dev
```

### 5. Start the Agent Runner

```bash
cd agents
node runner.mjs --continuous --fast
```

| Flag | Description |
|---|---|
| `--continuous` | Run indefinitely (default: 5 cycles) |
| `--fast` | 15s cycle interval, 30s schedule delay |

---

## Deployment

### Contract Deployment Order

The `deploy-v2.mjs` script handles the full sequence:

1. Deploy USDC token
2. Deploy vaUSD (requires USDC address)
3. Deploy 3 Vault contracts (requires USDC, vaUSD, agent address)
4. Authorize vaults as vaUSD minters
5. Deploy 3 Strategy contracts (requires USDC address)
6. Deploy Arena (requires USDC address)
7. Seed initial capital into vaults

### Production Build

```bash
npm run build
npm run preview
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Hedera (EVM-compatible, Chain ID 296) |
| **Consensus** | Hedera Consensus Service — immutable agent decision logs |
| **Mirror Node** | Hedera Mirror Node REST API — event logs, transactions, HCS messages |
| **Smart Contracts** | Solidity 0.8.20 · OpenZeppelin · Hardhat |
| **Agent Runtime** | Node.js · ethers v6 · @hashgraph/sdk |
| **AI / LLM** | Model-agnostic — any OpenAI-compatible provider |
| **Frontend** | React 18 · TypeScript · Vite |
| **Styling** | Tailwind CSS · shadcn/ui |
| **State Management** | TanStack React Query |
| **Animation** | Framer Motion · requestAnimationFrame |
| **Charts** | Recharts · Custom SVG sparklines |
| **Wallet** | MetaMask via EIP-1193 |
| **Testing** | Vitest · Playwright |

---

## Project Structure

```
vaultera/
├── contracts/              # Solidity smart contracts
│   ├── VaultArenaV2.sol    # Multi-asset vault (primary)
│   ├── Strategy.sol        # Yield strategy bookkeeping
│   ├── Arena.sol           # Agent-vs-agent staking arena
│   ├── MockUSDC.sol        # USDC token
│   ├── VaultArenaUSD.sol   # vaUSD wrapped stablecoin
│   └── VaultArena.sol      # V1 HBAR-only vault
├── agents/                 # AI agent runtime
│   ├── runner.mjs          # Decision loop + on-chain execution
│   └── strategies.mjs      # Agent personas + system prompts
├── scripts/                # Deployment and setup
│   ├── deploy-v2.mjs       # Full contract stack deployment
│   ├── setup-hcs.mjs       # HCS topic creation
│   └── seed-deposits.mjs   # Initial capital seeding
├── src/                    # React frontend
│   ├── config/             # Contract addresses, agent/vault metadata
│   ├── hooks/              # Data fetching and state management
│   ├── components/         # UI components
│   ├── pages/              # Route pages
│   ├── lib/                # Contract helpers, mirror node client, wallet
│   └── contexts/           # React context providers
├── docs/diagrams/          # Architecture diagrams
├── hardhat.config.cjs      # Hardhat configuration
├── .env.example            # Environment template
└── package.json
```

---

## License

MIT
