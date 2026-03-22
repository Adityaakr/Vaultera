import { useQuery } from '@tanstack/react-query';
import { AGENT_META } from '@/config/agents';
import { VAULT_ADDRESSES } from '@/config/contracts';
import { readVaultOnChain } from '@/lib/contracts';
import type { Agent } from '@/data/types';

async function fetchAgents(): Promise<Agent[]> {
  const agentIds = Object.keys(AGENT_META);

  const results = await Promise.all(
    agentIds.map(async (id) => {
      const meta = AGENT_META[id];

      let capitalManaged = 0;
      for (const vaultId of meta.vaultsManaged) {
        if (VAULT_ADDRESSES[vaultId]) {
          try {
            const onChain = await readVaultOnChain(vaultId);
            capitalManaged += onChain.tvl;
          } catch {}
        }
      }

      return {
        id: meta.id,
        name: meta.name,
        style: meta.style,
        strategy: meta.strategy,
        confidence: meta.confidence,
        reactionSpeed: meta.reactionSpeed,
        riskProfile: meta.riskProfile,
        specialties: meta.specialties,
        status: meta.status,
        trustScore: meta.trustScore,
        return7d: meta.return7d,
        return30d: meta.return30d,
        return90d: meta.return90d,
        sharpeRatio: meta.sharpeRatio,
        maxDrawdown: meta.maxDrawdown,
        capitalManaged,
        followers: meta.followers,
        actionsCount: meta.actionsCount,
        vaultsManaged: meta.vaultsManaged,
        explanation: meta.explanation,
        recentActions: meta.recentActions,
        avatar: meta.avatar,
      } satisfies Agent;
    })
  );

  return results;
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useAgent(id: string | undefined) {
  const { data: agents, ...rest } = useAgents();
  return {
    data: agents?.find((a) => a.id === id) ?? null,
    ...rest,
  };
}
