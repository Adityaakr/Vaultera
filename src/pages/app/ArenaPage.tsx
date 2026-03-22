import { agents, vaults, activities } from '@/data/seed';
import { motion } from 'framer-motion';
import { StatusPill } from '@/components/VaultCard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { cn } from '@/lib/utils';

function formatCapital(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

export default function ArenaPage() {
  const ranked = [...agents].sort((a, b) => b.return30d - a.return30d);
  const recentActivity = activities.slice(0, 8);
  const top3 = ranked.slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Arena</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-gentle" /> Season 4 · Live
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Autonomous agents competing for vault management dominance</p>
      </div>

      {/* Podium */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-3">
        {top3.map((agent, i) => {
          const medals = ['🥇', '🥈', '🥉'];
          const vault = vaults.find(v => agent.vaultsManaged.includes(v.id));
          return (
            <div key={agent.id} className={cn(
              "rounded-2xl border bg-card p-6 shadow-premium transition-shadow hover:shadow-premium-md",
              i === 0 ? "border-primary/30 ring-1 ring-primary/10" : "border-border"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-2xl">{medals[i]}</span>
                <StatusPill status={agent.status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 font-display text-lg font-bold text-accent">{agent.avatar}</div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.style}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">30d Return</p><p className="text-lg font-bold text-primary tabular-nums">+{agent.return30d}%</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sharpe</p><p className="text-lg font-bold text-foreground tabular-nums">{agent.sharpeRatio}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capital</p><p className="text-sm font-semibold text-foreground tabular-nums">{formatCapital(agent.capitalManaged)}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust</p><p className="text-sm font-semibold text-foreground tabular-nums">{agent.trustScore}%</p></div>
              </div>
              {vault && <p className="mt-3 text-xs text-muted-foreground">Managing: {vault.name}</p>}
            </div>
          );
        })}
      </motion.div>

      {/* Rankings table */}
      <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-display text-base font-semibold text-foreground">Full Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Agent</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">30d Return</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Sharpe</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Max DD</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Trust</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Capital</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((agent, i) => (
                <tr key={agent.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-semibold text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">{agent.avatar}</div>
                      <div>
                        <p className="font-medium text-foreground">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">{agent.style}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">+{agent.return30d}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{agent.sharpeRatio}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">{agent.maxDrawdown}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{agent.trustScore}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCapital(agent.capitalManaged)}</td>
                  <td className="px-4 py-3 text-center"><StatusPill status={agent.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Feed */}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Live Arena Activity</h3>
        <div className="space-y-3">
          {recentActivity.map(a => <ActivityFeedItem key={a.id} activity={a} />)}
        </div>
      </div>
    </div>
  );
}
