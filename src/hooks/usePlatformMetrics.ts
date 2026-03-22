import { useVaults } from './useVaults';
import { useAgents } from './useAgents';
import { useActivities } from './useActivities';

export function usePlatformMetrics() {
  const { data: vaults } = useVaults();
  const { data: agents } = useAgents();
  const { data: activities } = useActivities();

  const totalValueAllocated = vaults?.reduce((sum, v) => sum + v.tvl, 0) ?? 0;
  const averageNetYield = vaults && vaults.length > 0
    ? vaults.reduce((sum, v) => sum + v.apy30d, 0) / vaults.length
    : 0;
  const activeAllocators = vaults?.reduce((sum, v) => sum + v.subscribers, 0) ?? 0;

  return {
    totalValueAllocated,
    averageNetYield: Number(averageNetYield.toFixed(1)),
    activeAllocators,
    systemUptime: 99.97,
    activeVaults: vaults?.length ?? 0,
    totalAgents: agents?.length ?? 0,
    totalActivities: activities?.length ?? 0,
  };
}
