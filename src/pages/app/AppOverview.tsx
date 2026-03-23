import { KPICard } from '@/components/KPICard';
import { VaultCard } from '@/components/VaultCard';
import { AgentCard } from '@/components/AgentCard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { ScheduledActionsPanel } from '@/components/ScheduledActionsPanel';
import { useVaults } from '@/hooks/useVaults';
import { useAgents } from '@/hooks/useAgents';
import { useActivities } from '@/hooks/useActivities';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import { MarketTicker } from '@/components/MarketTicker';
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

  const topVaults = (vaults ?? []).slice(0, 3);
  const topAgents = [...(agents ?? [])].sort((a, b) => b.return30d - a.return30d).slice(0, 4);
  const recentActivity = (activities ?? []).slice(0, 10);
  const avgTrust = topVaults.length > 0
    ? Math.round(topVaults.reduce((s, v) => s + v.trustScore, 0) / topVaults.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform performance and system status — live from Hedera Testnet</p>
      </div>

      <MarketTicker />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Value Allocated" value={formatUSD(metrics.totalValueAllocated)} change="Live on-chain (USD)" changeType="positive" />
        <KPICard label="Avg Net Yield" value={`${metrics.averageNetYield}%`} change="30d avg" changeType="positive" />
        <KPICard label="Active Vaults" value={metrics.activeVaults.toString()} change="On Hedera Testnet" changeType="positive" />
        <KPICard label="System Uptime" value={`${metrics.systemUptime}%`} change="All systems operational" changeType="positive" />
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3 items-start">
        {/* Left — vaults + protocol card */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Top Vaults</h2>
            <a href="/app/vaults" className="text-sm font-medium text-primary hover:underline">View all →</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 items-start">
            {vLoading
              ? [1,2,3,4].map(i => <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />)
              : (
                <>
                  {topVaults.map(v => <VaultCard key={v.id} vault={v} />)}
                  <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-base font-semibold text-foreground">Hedera-Native Protocol</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">Tokenized Vault Standard</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">ERC-4626</span>
                        <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary">ERC-8004</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">Agent-managed vault shares on HTS with immutable decision logs on HCS.</p>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Vaults</p>
                        <p className="text-sm font-semibold text-foreground tabular-nums">{(vaults ?? []).length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust</p>
                        <p className="text-sm font-semibold text-primary tabular-nums">{avgTrust}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Finality</p>
                        <p className="text-sm font-semibold text-foreground">~3s</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">HTS</span>
                        <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">HCS</span>
                        <span className="rounded-md bg-foreground/5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">HSCS</span>
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground/60">HCS-10 coming soon</span>
                    </div>
                  </div>
                </>
              )
            }
          </div>
        </div>

        {/* Right — Live Activity */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
              Live Activity
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
              </span>
            </h2>
            <a href="/app/activity" className="text-[11px] font-medium text-primary hover:underline">View all →</a>
          </div>
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="p-2 space-y-1.5 overflow-y-auto max-h-[400px]">
              {recentActivity.length > 0
                ? recentActivity.map(a => <ActivityFeedItem key={a.id} activity={a} compact />)
                : (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    No on-chain activity yet.
                  </div>
                )
              }
            </div>
            {(activities ?? []).length > 0 && (
              <div className="px-4 py-1.5 border-t border-border/40 bg-secondary/20">
                <p className="text-[10px] text-muted-foreground text-center tabular-nums">
                  {(activities ?? []).length} total on-chain events · Auto-refreshes every 8s
                </p>
              </div>
            )}
          </div>
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
