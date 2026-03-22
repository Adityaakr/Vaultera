import { useQuery } from '@tanstack/react-query';
import { VAULT_ADDRESSES } from '@/config/contracts';
import { VAULT_META } from '@/config/vaults';
import { AGENT_META } from '@/config/agents';
import { readVaultOnChain } from '@/lib/contracts';
import type { Vault } from '@/data/types';

async function fetchVaults(): Promise<Vault[]> {
  const vaultIds = Object.keys(VAULT_ADDRESSES);

  const results = await Promise.all(
    vaultIds.map(async (id) => {
      const meta = VAULT_META[id];
      if (!meta) return null;

      try {
        const onChain = await readVaultOnChain(id);
        const agent = AGENT_META[meta.managingAgentId];
        return {
          id: meta.id,
          name: meta.name,
          symbol: meta.symbol,
          strategy: meta.strategy,
          tvl: onChain.tvl,
          apy: agent?.return30d ?? 0,
          apy7d: agent?.return7d ?? 0,
          apy30d: agent?.return30d ?? 0,
          apy90d: agent?.return90d ?? 0,
          utilization: onChain.supply > 0 ? 87 : 0,
          riskLevel: meta.riskLevel,
          riskScore: meta.riskScore,
          trustScore: agent?.trustScore ?? 90,
          managingAgentId: meta.managingAgentId,
          status: meta.status,
          category: meta.category,
          allocation: meta.allocation,
          subscribers: agent?.followers ?? 0,
          createdAt: meta.createdAt,
        } satisfies Vault;
      } catch (err) {
        console.warn(`Failed to read vault ${id}:`, err);
        return null;
      }
    })
  );

  return results.filter(Boolean) as Vault[];
}

export function useVaults() {
  return useQuery({
    queryKey: ['vaults'],
    queryFn: fetchVaults,
    staleTime: 8_000,
    refetchInterval: 15_000,
  });
}

export function useVault(id: string | undefined) {
  const { data: vaults, ...rest } = useVaults();
  return {
    data: vaults?.find((v) => v.id === id) ?? null,
    ...rest,
  };
}
