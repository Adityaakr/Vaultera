import { useQuery } from '@tanstack/react-query';
import { STRATEGY_ADDRESSES, VAULT_ADDRESSES } from '@/config/contracts';
import { readStrategyAllocation } from '@/lib/contracts';

export interface StrategyAllocation {
  name: string;
  address: string;
  amount: number;
}

async function fetchStrategyAllocations(vaultId: string): Promise<StrategyAllocation[]> {
  const entries = Object.entries(STRATEGY_ADDRESSES);
  const results = await Promise.all(
    entries.map(async ([name, addr]) => {
      const amount = await readStrategyAllocation(vaultId, addr);
      return { name, address: addr, amount };
    })
  );
  return results;
}

export function useStrategies(vaultId: string | undefined) {
  return useQuery({
    queryKey: ['strategies', vaultId],
    queryFn: () => fetchStrategyAllocations(vaultId!),
    enabled: !!vaultId && !!VAULT_ADDRESSES[vaultId],
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
