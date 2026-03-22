import { KPICard } from '@/components/KPICard';
import { VaultCard } from '@/components/VaultCard';
import { AgentCard } from '@/components/AgentCard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { ScheduledActionsPanel } from '@/components/ScheduledActionsPanel';
import { useVaults } from '@/hooks/useVaults';
import { useAgents } from '@/hooks/useAgents';
import { useActivities } from '@/hooks/useActivities';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import { motion } from 'framer-motion';

function formatUSD(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return '$0';
}

export default function AppOverview() {
  const { data: vaults, isLoading: vLoading } = useVaults();
  const { data: agents, isLoading: aLoading } = useAgents();
  const { data: activities } = useActivities();
  const metrics = usePlatformMetrics();

  const topVaults = (vaults ?? []).slice(0, 4);
  const topAgents = [...(agents ?? [])].sort((a, b) => b.return30d - a.return30d).slice(0, 4);
  const recentActivity = (activities ?? []).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform performance and system status — live from Hedera Testnet</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Value Allocated" value={formatUSD(metrics.totalValueAllocated)} change="Live on-chain (USD)" changeType="positive" />
        <KPICard label="Avg Net Yield" value={`${metrics.averageNetYield}%`} change="30d avg" changeType="positive" />
        <KPICard label="Active Vaults" value={metrics.activeVaults.toString()} change="On Hedera Testnet" changeType="positive" />
        <KPICard label="System Uptime" value={`${metrics.systemUptime}%`} change="All systems operational" changeType="positive" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Top Vaults</h2>
            <a href="/app/vaults" className="text-sm font-medium text-primary hover:underline">View all →</a>
          </div>
          {vLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {[1,2,3,4].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />)}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {topVaults.map(v => <VaultCard key={v.id} vault={v} />)}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/50 bg-card overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/30">
            <h2 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              Live Activity
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
              </span>
            </h2>
            <a href="/app/activity" className="text-[11px] font-medium text-primary hover:underline">View all →</a>
          </div>
          {/* Feed */}
          <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[520px]">
            {recentActivity.length > 0
              ? recentActivity.map(a => <ActivityFeedItem key={a.id} activity={a} compact />)
              : (
                <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                  No on-chain activity yet.
                </div>
              )
            }
          </div>
          {/* Footer summary */}
          {(activities ?? []).length > 0 && (
            <div className="px-4 py-2 border-t border-border/40 bg-secondary/20">
              <p className="text-[10px] text-muted-foreground text-center tabular-nums">
                {(activities ?? []).length} total on-chain events · Auto-refreshes every 8s
              </p>
            </div>
          )}
        </div>
      </div>

      <ScheduledActionsPanel />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Top Agents · 30d Performance</h2>
          <a href="/app/agents" className="text-sm font-medium text-primary hover:underline">View all →</a>
        </div>
        {aLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topAgents.map((a, i) => <AgentCard key={a.id} agent={a} rank={i + 1} />)}
          </div>
        )}
      </div>
    </div>
  );
}
