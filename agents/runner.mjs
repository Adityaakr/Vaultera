import { ethers } from 'ethers';
import { Client, TopicMessageSubmitTransaction, PrivateKey, AccountId, Hbar } from '@hashgraph/sdk';
import { config } from 'dotenv';
import { AGENT_PERSONAS } from './strategies.mjs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

// ─── Config ──────────────────────────────────────────────────────────

const VAULT_ADDRESSES = {
  'vault-1': '0x9a80F22B460c2CB12d3aAa3CDA67e54eEcA34715',
  'vault-2': '0x9E0fD2dF3f29ef9FadE393D12228A7Ab0e432029',
  'vault-3': '0x9A285a32bE626b60ae26E0fb070604457B2bF66E',
};

const STRATEGY_ADDRESSES = {
  'StableLending': '0xDd24ca681945b9CBBFF0cCA4DB8921C074aB4249',
  'MomentumPool': '0x0703507889DA42464719ca6769e47FA8A195a202',
  'YieldFarm': '0x888b9514f268AEE82dD47EF1Fde7909C511A40A5',
};

const USDC_ADDRESS = '0xFD5781032DBA8d0B5bcB3D748B7eeB7a04645c58';
const ARENA_ADDRESS = '0x0369CBc3AeCb15958B21F0D09d52687eC531af7C';

const HCS_TOPIC_IDS = {
  'agent-1': '0.0.8333665',
  'agent-2': '0.0.8333666',
  'agent-3': '0.0.8333667',
};

const RPC_URL = 'https://testnet.hashio.io/api';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const USE_OPENAI = !!OPENAI_KEY;
const LLM_URL = USE_OPENAI
  ? 'https://api.openai.com/v1/chat/completions'
  : 'https://openrouter.ai/api/v1/chat/completions';
const LLM_KEY = USE_OPENAI ? OPENAI_KEY : OPENROUTER_KEY;
const LLM_MODEL = USE_OPENAI ? 'gpt-4o-mini' : 'google/gemini-2.0-flash-001';
const PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY;
const HEDERA_ACCOUNT_ID = process.env.HEDERA_ACCOUNT_ID;

const MAX_CYCLES = process.argv.includes('--continuous') ? Infinity : 5;
const FAST_MODE = process.argv.includes('--fast');
const CYCLE_INTERVAL_MS = FAST_MODE ? 15_000 : 30_000;

const provider = new ethers.JsonRpcProvider(RPC_URL, 296);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// HCS client
const hcsAccountId = AccountId.fromString(HEDERA_ACCOUNT_ID);
const hcsPrivateKey = PrivateKey.fromStringECDSA(PRIVATE_KEY);
const hcsClient = Client.forTestnet().setOperator(hcsAccountId, hcsPrivateKey);
hcsClient.setDefaultMaxTransactionFee(new Hbar(2));

// Pending scheduled actions — queue for future execution
const pendingSchedules = [];

// ─── ABIs ────────────────────────────────────────────────────────────

const VAULT_ABI = [
  'function tvl() view returns (uint256)',
  'function idleBalance() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function totalInStrategies() view returns (uint256)',
  'function strategyDeposits(address) view returns (uint256)',
  'function usdc() view returns (address)',
  'function allocateToStrategy(address strategy, uint256 amount) external',
  'function deallocateFromStrategy(address strategy, uint256 amount) external',
  'function openArenaRound(address arena, uint256 stake, string position) external returns (uint256)',
  'function acceptArenaRound(address arena, uint256 roundId, uint256 stake, string position) external',
  'function executeAction(string action, string reason) external',
];

const ARENA_ABI = [
  'function roundCount() view returns (uint256)',
  'function rounds(uint256) view returns (address vaultA, address vaultB, uint256 stakeA, uint256 stakeB, string positionA, string positionB, uint8 status, address winner, uint256 payout)',
  'function resolveRound(uint256 roundId, address winner) external',
];

const STRATEGY_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function name() view returns (string)',
];

// ─── LLM ─────────────────────────────────────────────────────────────

async function callLLM(systemPrompt, userMessage) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${LLM_KEY}`,
  };
  if (!USE_OPENAI) {
    headers['HTTP-Referer'] = 'https://vaultera.app';
    headers['X-Title'] = 'Vaultera Agent';
  }

  const res = await fetch(LLM_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 500,
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices[0]?.message?.content ?? '';
}

// ─── HCS Publishing ──────────────────────────────────────────────────

async function publishToHCS(agentId, message) {
  const topicId = HCS_TOPIC_IDS[agentId];
  if (!topicId) return;

  try {
    const tx = new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(JSON.stringify(message));

    await tx.execute(hcsClient);
    console.log(`  HCS published to ${topicId}`);
  } catch (err) {
    console.warn(`  HCS publish failed: ${err.message}`);
  }
}

// ─── Vault State ─────────────────────────────────────────────────────

async function getVaultState(vaultId) {
  const addr = VAULT_ADDRESSES[vaultId];
  const vault = new ethers.Contract(addr, VAULT_ABI, provider);

  const [tvl, idle, supply, inStrategies] = await Promise.all([
    vault.tvl(),
    vault.idleBalance(),
    vault.totalSupply(),
    vault.totalInStrategies(),
  ]);

  const usdcContract = new ethers.Contract(USDC_ADDRESS, ['function balanceOf(address) view returns (uint256)'], provider);
  const availableUSDC = await usdcContract.balanceOf(addr);

  const stratAllocations = {};
  for (const [name, sAddr] of Object.entries(STRATEGY_ADDRESSES)) {
    const bal = await vault.strategyDeposits(sAddr);
    stratAllocations[name] = Number(ethers.formatEther(bal));
  }

  return {
    tvl: Number(ethers.formatEther(tvl)),
    idle: Number(ethers.formatEther(idle)),
    supply: Number(ethers.formatEther(supply)),
    inStrategies: Number(ethers.formatEther(inStrategies)),
    availableUSDC: Number(ethers.formatEther(availableUSDC)),
    stratAllocations,
  };
}

// ─── Arena State ─────────────────────────────────────────────────────

async function getArenaState() {
  const arena = new ethers.Contract(ARENA_ADDRESS, ARENA_ABI, provider);
  const count = Number(await arena.roundCount());

  const openRounds = [];
  const activeRounds = [];

  for (let i = Math.max(0, count - 5); i < count; i++) {
    const r = await arena.rounds(i);
    if (r.status === 0n) openRounds.push({ id: i, vaultA: r.vaultA, stakeA: Number(ethers.formatEther(r.stakeA)), positionA: r.positionA });
    if (r.status === 1n) activeRounds.push({ id: i, vaultA: r.vaultA, vaultB: r.vaultB, stakeA: Number(ethers.formatEther(r.stakeA)), stakeB: Number(ethers.formatEther(r.stakeB)), positionA: r.positionA, positionB: r.positionB });
  }

  return { count, openRounds, activeRounds };
}

// ─── Execute Actions ─────────────────────────────────────────────────

async function executeStrategyAction(vaultId, action, availableUSDC) {
  const vaultAddr = VAULT_ADDRESSES[vaultId];
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const stratAddr = STRATEGY_ADDRESSES[action.strategy];
  if (!stratAddr) { console.warn(`  Unknown strategy: ${action.strategy}`); return; }

  let amountNum = Math.floor(action.amount);
  if (action.type === 'allocate') {
    amountNum = Math.min(amountNum, Math.floor(availableUSDC));
    if (amountNum <= 0) { console.log(`  Skipping allocation — no USDC available`); return; }
  }
  const amount = ethers.parseEther(String(amountNum));

  if (action.type === 'allocate') {
    console.log(`  Allocating $${amountNum} to ${action.strategy}...`);
    const tx = await vault.allocateToStrategy(stratAddr, amount, { gasLimit: 1_000_000 });
    await tx.wait();
    console.log(`  -> confirmed: ${tx.hash}`);
  } else if (action.type === 'deallocate') {
    console.log(`  Deallocating $${amountNum} from ${action.strategy}...`);
    const tx = await vault.deallocateFromStrategy(stratAddr, amount, { gasLimit: 1_000_000 });
    await tx.wait();
    console.log(`  -> confirmed: ${tx.hash}`);
  }
}

async function executeArenaOpen(vaultId, arenaDecision) {
  const vaultAddr = VAULT_ADDRESSES[vaultId];
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const stake = ethers.parseEther(String(Math.floor(arenaDecision.stake)));

  console.log(`  Opening arena round with $${arenaDecision.stake} stake...`);
  const tx = await vault.openArenaRound(ARENA_ADDRESS, stake, arenaDecision.position, { gasLimit: 1_000_000 });
  await tx.wait();
  console.log(`  -> confirmed: ${tx.hash}`);
}

async function executeArenaAccept(vaultId, roundId, arenaDecision) {
  const vaultAddr = VAULT_ADDRESSES[vaultId];
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
  const stake = ethers.parseEther(String(Math.floor(arenaDecision.stake)));

  console.log(`  Accepting arena round ${roundId} with $${arenaDecision.stake} stake...`);
  const tx = await vault.acceptArenaRound(ARENA_ADDRESS, roundId, stake, arenaDecision.position, { gasLimit: 1_000_000 });
  await tx.wait();
  console.log(`  -> confirmed: ${tx.hash}`);
}

// ─── Scheduled Actions ───────────────────────────────────────────────

function scheduleAction(persona, action, delayMs, availableUSDC) {
  const executeAt = new Date(Date.now() + delayMs).toISOString();
  const entry = {
    agentId: persona.id,
    agentName: persona.name,
    vaultId: persona.vaultId,
    action,
    executeAt,
    availableUSDC,
    status: 'pending',
  };
  pendingSchedules.push(entry);
  console.log(`  Scheduled ${action.type} $${action.amount} → ${action.strategy} for ${executeAt}`);
  return entry;
}

async function executeDueSchedules() {
  const now = Date.now();
  const due = pendingSchedules.filter(s => s.status === 'pending' && new Date(s.executeAt).getTime() <= now);

  for (const sched of due) {
    console.log(`\n  Executing scheduled action for [${sched.agentName}]: ${sched.action.type} $${sched.action.amount} → ${sched.action.strategy}`);
    try {
      await executeStrategyAction(sched.vaultId, sched.action, sched.availableUSDC);
      sched.status = 'executed';

      // Log on-chain event
      const vaultAddr = VAULT_ADDRESSES[sched.vaultId];
      const vault = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
      try {
        await (await vault.executeAction(
          `Scheduled ${sched.action.type}`,
          `Auto-executed: ${sched.action.type} $${sched.action.amount} to ${sched.action.strategy}`,
          { gasLimit: 500_000 }
        )).wait();
      } catch {}

      // Publish execution confirmation to HCS
      await publishToHCS(sched.agentId, {
        type: 'schedule_executed',
        agent: sched.agentName,
        vault: sched.vaultId,
        action: sched.action,
        scheduledFor: sched.executeAt,
        executedAt: new Date().toISOString(),
        summary: `Scheduled ${sched.action.type} of $${sched.action.amount} to ${sched.action.strategy} auto-executed`,
      });

      console.log(`  -> Scheduled action executed successfully`);
    } catch (err) {
      sched.status = 'failed';
      console.error(`  Scheduled action failed: ${err.message.slice(0, 200)}`);
    }
  }
}

// ─── Resolve Arena Rounds ────────────────────────────────────────────

async function resolveActiveRounds(activeRounds) {
  if (activeRounds.length === 0) return;

  const arena = new ethers.Contract(ARENA_ADDRESS, ARENA_ABI, wallet);

  for (const round of activeRounds) {
    console.log(`\n  Judging arena round ${round.id}...`);

    const judgePrompt = `You are a neutral DeFi judge evaluating two competing vault manager positions.

Position A (stake: $${round.stakeA}): "${round.positionA}"
Position B (stake: $${round.stakeB}): "${round.positionB}"

Evaluate both positions on: risk management, market awareness, strategic clarity, and conviction.
Respond with ONLY a JSON: { "winner": "A" | "B", "reason": "1 sentence" }`;

    try {
      const response = await callLLM('You are a fair DeFi competition judge.', judgePrompt);
      const cleanedJudge = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const match = cleanedJudge.match(/\{[\s\S]*?\}/);
      const verdict = match ? JSON.parse(match[0]) : { winner: 'A', reason: 'Default' };

      const winnerAddr = verdict.winner === 'A' ? round.vaultA : round.vaultB;
      console.log(`  Winner: ${verdict.winner} — ${verdict.reason}`);

      const tx = await arena.resolveRound(round.id, winnerAddr, { gasLimit: 1_000_000 });
      await tx.wait();
      console.log(`  -> Round ${round.id} resolved: ${tx.hash}`);
    } catch (err) {
      console.error(`  Failed to resolve round ${round.id}: ${err.message}`);
    }
  }
}

// ─── Agent Cycle ─────────────────────────────────────────────────────

async function runAgentCycle(persona, arenaState, cycleNum) {
  const { id, name, vaultId, systemPrompt } = persona;
  const vaultAddr = VAULT_ADDRESSES[vaultId];
  console.log(`\n[${name}] Cycle ${cycleNum} — vault ${vaultId} (${vaultAddr})`);

  try {
    const state = await getVaultState(vaultId);
    console.log(`  TVL: $${state.tvl.toFixed(2)} | Idle: $${state.idle.toFixed(2)} | USDC avail: $${state.availableUSDC.toFixed(2)} | In strategies: $${state.inStrategies.toFixed(2)}`);
    console.log(`  Allocations: ${JSON.stringify(state.stratAllocations)}`);

    const acceptableRound = arenaState.openRounds.find(r => r.vaultA.toLowerCase() !== vaultAddr.toLowerCase());

    const pendingForVault = pendingSchedules.filter(s => s.vaultId === vaultId && s.status === 'pending');
    const scheduledInfo = pendingForVault.length > 0
      ? `\nYou have ${pendingForVault.length} pending scheduled action(s) — do not duplicate them.`
      : '';

    const userMessage = `Current state for your managed vault:
- TVL: $${state.tvl.toFixed(2)}
- Idle stablecoins: $${state.idle.toFixed(2)}
- Available USDC (for strategy allocation & arena): $${state.availableUSDC.toFixed(2)}
- In strategies: $${state.inStrategies.toFixed(2)}
- Strategy allocations: ${JSON.stringify(state.stratAllocations)}
- LP token supply: ${state.supply.toFixed(2)}
- Cycle: ${cycleNum}

IMPORTANT: You can only allocate up to $${state.availableUSDC.toFixed(0)} USDC to strategies. Do NOT exceed this amount.
${scheduledInfo}
${acceptableRound ? `\nThere is an OPEN arena round (#${acceptableRound.id}) from another vault with $${acceptableRound.stakeA} stake. Position: "${acceptableRound.positionA}". You can accept with a counter-position.` : ''}
${cycleNum <= 2 && state.availableUSDC > 100 ? '\nThis is an early cycle — deploy some idle USDC into a strategy.' : ''}

You may mark actions as "schedule": true to delay execution by ~60s (demonstrates autonomous scheduling).
On even cycles, prefer scheduling at least one action for future execution.

Decide your actions.`;

    const response = await callLLM(systemPrompt, userMessage);
    console.log(`  LLM: ${response.slice(0, 150)}...`);

    let decision;
    try {
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const match = cleaned.match(/\{[\s\S]*\}/);
      decision = match ? JSON.parse(match[0]) : { actions: [], arena: null, summary: 'Parse error' };
    } catch {
      decision = { actions: [], arena: null, summary: 'Parse error — holding' };
    }

    const immediateActions = [];
    const scheduledActions = [];

    for (const action of (decision.actions || [])) {
      if (action.schedule && cycleNum >= 2) {
        const delayMs = FAST_MODE ? 30_000 : 60_000;
        const entry = scheduleAction(persona, action, delayMs, state.availableUSDC);
        scheduledActions.push({ ...action, executeAt: entry.executeAt });
      } else {
        immediateActions.push(action);
      }
    }

    // Execute immediate strategy actions
    for (const action of immediateActions) {
      try {
        await executeStrategyAction(vaultId, action, state.availableUSDC);
      } catch (err) {
        console.error(`  Strategy action failed: ${err.message.slice(0, 200)}`);
      }
    }

    // Arena: accept open round or open a new one
    if (acceptableRound && decision.arena?.enter) {
      try {
        await executeArenaAccept(vaultId, acceptableRound.id, decision.arena);
      } catch (err) {
        console.error(`  Arena accept failed: ${err.message}`);
      }
    } else if (!acceptableRound && decision.arena?.enter && cycleNum >= 2) {
      try {
        await executeArenaOpen(vaultId, decision.arena);
      } catch (err) {
        console.error(`  Arena open failed: ${err.message}`);
      }
    }

    // Log an on-chain action event
    try {
      const vault = new ethers.Contract(vaultAddr, VAULT_ABI, wallet);
      await (await vault.executeAction(
        decision.summary || 'Cycle complete',
        `Cycle ${cycleNum}: ${(immediateActions).map(a => `${a.type} $${a.amount} ${a.strategy}`).join(', ') || 'hold'}${scheduledActions.length > 0 ? ` | ${scheduledActions.length} scheduled` : ''}`,
        { gasLimit: 500_000 }
      )).wait();
    } catch {}

    // Publish reasoning to HCS
    await publishToHCS(id, {
      agent: name,
      vault: vaultId,
      cycle: cycleNum,
      actions: immediateActions,
      scheduledActions,
      arena: decision.arena,
      summary: decision.summary,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    console.error(`  [${name}] Error: ${err.message}`);
  }
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Vaultera Agent Runner v3 ===');
  console.log(`Wallet: ${wallet.address}`);
  console.log(`LLM: ${LLM_MODEL} via ${USE_OPENAI ? 'OpenAI' : 'OpenRouter'}`);
  console.log(`Mode: ${MAX_CYCLES === Infinity ? 'continuous' : `${MAX_CYCLES} cycles`}${FAST_MODE ? ' (fast)' : ''}`);
  console.log(`Cycle interval: ${CYCLE_INTERVAL_MS / 1000}s`);
  console.log(`Agents: ${AGENT_PERSONAS.map(p => p.name).join(', ')}`);

  for (let cycle = 1; cycle <= MAX_CYCLES; cycle++) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`CYCLE ${cycle} — ${new Date().toISOString()}`);
    console.log('═'.repeat(60));

    // Execute any due scheduled actions first
    await executeDueSchedules();

    const arenaState = await getArenaState();
    console.log(`Arena: ${arenaState.count} total rounds, ${arenaState.openRounds.length} open, ${arenaState.activeRounds.length} active`);

    // Resolve any active arena rounds
    await resolveActiveRounds(arenaState.activeRounds);

    // Run each agent
    for (const persona of AGENT_PERSONAS) {
      await runAgentCycle(persona, arenaState, cycle);
    }

    const pendingCount = pendingSchedules.filter(s => s.status === 'pending').length;
    if (pendingCount > 0) {
      console.log(`\n  ${pendingCount} scheduled action(s) pending execution`);
    }

    if (cycle < MAX_CYCLES) {
      console.log(`\nWaiting ${CYCLE_INTERVAL_MS / 1000}s for next cycle...`);
      await new Promise(r => setTimeout(r, CYCLE_INTERVAL_MS));
    }
  }

  // Execute any remaining scheduled actions before exit
  console.log('\nExecuting remaining scheduled actions...');
  await new Promise(r => setTimeout(r, 5000));
  await executeDueSchedules();

  console.log('\n=== Agent runner complete ===');
  hcsClient.close();
}

main().catch(console.error);
