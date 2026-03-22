import { KPICard } from '@/components/KPICard';
import { VaultCard } from '@/components/VaultCard';
import { AgentCard } from '@/components/AgentCard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { vaults, agents, activities, platformMetrics } from '@/data/seed';
import { motion } from 'framer-motion';

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function AppOverview() {
  const topVaults = vaults.slice(0, 4);
  const topAgents = [...agents].sort((a, b) => b.return30d - a.return30d).slice(0, 4);
  const recentActivity = activities.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform performance and system status</p>
      </div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Value Allocated" value={formatNum(platformMetrics.totalValueAllocated)} change="+12.4% MoM" changeType="positive" />
        <KPICard label="Avg Net Yield" value={`${platformMetrics.averageNetYield}%`} change="+0.8% vs last month" changeType="positive" />
        <KPICard label="Active Allocators" value={formatNum(platformMetrics.activeAllocators)} change="+2,400 this week" changeType="positive" />
        <KPICard label="System Uptime" value={`${platformMetrics.systemUptime}%`} change="All systems operational" changeType="positive" />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Vaults */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Top Vaults</h2>
            <a href="/app/vaults" className="text-sm font-medium text-primary hover:underline">View all →</a>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {topVaults.map(v => <VaultCard key={v.id} vault={v} />)}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-foreground">Live Activity</h2>
            <a href="/app/activity" className="text-sm font-medium text-primary hover:underline">View all →</a>
          </div>
          <div className="space-y-3">
            {recentActivity.map(a => <ActivityFeedItem key={a.id} activity={a} />)}
          </div>
        </div>
      </div>

      {/* Top Agents */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">Top Agents · 30d Performance</h2>
          <a href="/app/agents" className="text-sm font-medium text-primary hover:underline">View all →</a>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {topAgents.map((a, i) => <AgentCard key={a.id} agent={a} rank={i + 1} />)}
        </div>
      </div>
    </div>
  );
}
