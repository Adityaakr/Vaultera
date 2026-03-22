import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { VAULT_ADDRESSES, STRATEGY_ADDRESSES } from '@/config/contracts';
import { VAULT_META } from '@/config/vaults';
import { AGENT_META } from '@/config/agents';
import { getContractLogs } from '@/lib/mirror';
import type { Activity, ActivityType } from '@/data/types';

const DEPOSITED_SIG = ethers.id('Deposited(address,uint256,uint256)');
const WITHDRAWN_SIG = ethers.id('Withdrawn(address,uint256,uint256)');
const AGENT_ACTION_SIG = ethers.id('AgentAction(address,string,string)');
const STRATEGY_ALLOC_SIG = ethers.id('StrategyAllocated(address,uint256)');
const STRATEGY_DEALLOC_SIG = ethers.id('StrategyDeallocated(address,uint256)');
const ARENA_ENTERED_SIG = ethers.id('ArenaEntered(address,uint256,uint256)');

const EVENT_TOPICS: Record<string, ActivityType> = {
  [DEPOSITED_SIG]: 'deposit',
  [WITHDRAWN_SIG]: 'withdraw',
  [AGENT_ACTION_SIG]: 'rebalance',
  [STRATEGY_ALLOC_SIG]: 'allocate',
  [STRATEGY_DEALLOC_SIG]: 'harvest',
  [ARENA_ENTERED_SIG]: 'rotate',
};

const strategyByAddress: Record<string, string> = {};
for (const [name, addr] of Object.entries(STRATEGY_ADDRESSES)) {
  strategyByAddress[addr.toLowerCase()] = name;
}

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

function decodeUint256(hex: string): number {
  try {
    return Number(ethers.formatEther(BigInt('0x' + hex.replace(/^0x/, ''))));
  } catch { return 0; }
}

function extractAddress(topic: string): string {
  try {
    return '0x' + topic.slice(-40);
  } catch { return ''; }
}

function decodeStrings(data: string): [string, string] {
  try {
    const [a, b] = abiCoder.decode(['string', 'string'], data);
    return [a, b];
  } catch { return ['', '']; }
}

async function fetchActivities(): Promise<Activity[]> {
  const allActivities: Activity[] = [];
  const entries = Object.entries(VAULT_ADDRESSES);

  for (const [vaultId, address] of entries) {
    try {
      const { logs } = await getContractLogs(address, 50);
      const meta = VAULT_META[vaultId];
      const agentMeta = meta ? AGENT_META[meta.managingAgentId] : null;

      for (const log of logs) {
        const sig = log.topics[0];
        const type = EVENT_TOPICS[sig] ?? 'allocate';
        const txHash = log.transaction_hash ?? '';
        let value = 0;
        let strategyName: string | undefined;
        let reason = '';
        let action = '';
        let outcome = '';

        if (sig === DEPOSITED_SIG) {
          const usdVal = log.data ? decodeUint256(log.data.slice(2, 66)) : 0;
          const shares = log.data ? decodeUint256(log.data.slice(66, 130)) : 0;
          value = usdVal;
          reason = 'User deposited capital into the vault';
          action = `Deposited ${fmtUSD(usdVal)} USDC`;
          outcome = `${fmtUSD(shares)} vault shares minted`;
        } else if (sig === WITHDRAWN_SIG) {
          const shares = log.data ? decodeUint256(log.data.slice(2, 66)) : 0;
          const usdVal = log.data ? decodeUint256(log.data.slice(66, 130)) : 0;
          value = usdVal;
          reason = 'User withdrew capital from the vault';
          action = `Withdrew ${fmtUSD(usdVal)} USDC`;
          outcome = `${fmtUSD(shares)} vault shares burned`;
        } else if (sig === STRATEGY_ALLOC_SIG) {
          const stratAddr = log.topics[1] ? extractAddress(log.topics[1]) : '';
          const amount = log.data ? decodeUint256(log.data.slice(2, 66)) : 0;
          strategyName = strategyByAddress[stratAddr.toLowerCase()] ?? stratAddr.slice(0, 10);
          value = amount;
          reason = `Moved idle USDC into ${strategyName} strategy for yield`;
          action = `Allocated ${fmtUSD(amount)} → ${strategyName}`;
          outcome = `Capital now earning yield in strategy contract`;
        } else if (sig === STRATEGY_DEALLOC_SIG) {
          const stratAddr = log.topics[1] ? extractAddress(log.topics[1]) : '';
          const amount = log.data ? decodeUint256(log.data.slice(2, 66)) : 0;
          strategyName = strategyByAddress[stratAddr.toLowerCase()] ?? stratAddr.slice(0, 10);
          value = amount;
          reason = `Recalled capital from ${strategyName} back to vault`;
          action = `Deallocated ${fmtUSD(amount)} ← ${strategyName}`;
          outcome = `USDC returned to vault for redeployment`;
        } else if (sig === ARENA_ENTERED_SIG) {
          const roundId = log.data ? decodeUint256(log.data.slice(2, 66)) : 0;
          const stake = log.data ? decodeUint256(log.data.slice(66, 130)) : 0;
          value = stake;
          reason = `Entered agent-vs-agent competition round #${Math.round(roundId)}`;
          action = `Arena stake ${fmtUSD(stake)} in Round #${Math.round(roundId)}`;
          outcome = `Competing for performance rewards`;
        } else if (sig === AGENT_ACTION_SIG) {
          const [actionStr, reasonStr] = decodeStrings(log.data);
          action = actionStr || 'Strategy cycle completed';
          reason = reasonStr || 'Agent executed strategy decision';
          outcome = 'Decision recorded on-chain';
        }

        allActivities.push({
          id: `${txHash}-${sig?.slice(-8)}`,
          type,
          agentId: meta?.managingAgentId ?? 'unknown',
          agentName: agentMeta?.name ?? 'Unknown',
          agentAvatar: agentMeta?.avatar ?? '?',
          vaultId,
          vaultName: meta?.name ?? 'Unknown Vault',
          reason,
          action,
          outcome,
          timestamp: new Date(Number(log.timestamp.split('.')[0]) * 1000).toISOString(),
          status: 'completed',
          value,
          strategyName,
          txHash,
        });
      }
    } catch (err) {
      console.warn(`Failed to fetch logs for ${vaultId}:`, err);
    }
  }

  allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return allActivities;
}

function fmtUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  if (v > 0) return `$${Math.round(v).toLocaleString()}`;
  return '$0';
}

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    staleTime: 5_000,
    refetchInterval: 8_000,
  });
}
