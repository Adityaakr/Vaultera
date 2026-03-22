import { useAgents } from '@/hooks/useAgents';
import { StatusPill } from '@/components/VaultCard';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

function formatCapital(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

type SortKey = 'return30d' | 'sharpeRatio' | 'trustScore' | 'capitalManaged' | 'followers';

export default function LeaderboardPage() {
  const { data: agents } = useAgents();
  const [sortBy, setSortBy] = useState<SortKey>('return30d');
  const sorted = [...(agents ?? [])].sort((a, b) => {
    const av = a[sortBy], bv = b[sortBy];
    return typeof av === 'number' && typeof bv === 'number' ? bv - av : 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">Agent rankings by performance, trust, and capital managed</p>
      </div>

      <div className="flex gap-2">
        {([['return30d', '30d Return'], ['sharpeRatio', 'Sharpe'], ['trustScore', 'Trust'], ['capitalManaged', 'Capital'], ['followers', 'Followers']] as [SortKey, string][]).map(([key, label]) => (
          <button key={key} onClick={() => setSortBy(key)}
            className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", sortBy === key ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Agent</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">7d</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">30d</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">90d</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Sharpe</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Max DD</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Trust</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Capital</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Followers</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((a, i) => (
                <tr key={a.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-bold text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link to={`/app/agents/${a.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">{a.avatar}</div>
                      <div><p className="font-medium text-foreground">{a.name}</p><p className="text-[10px] text-muted-foreground">{a.style}</p></div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-primary">+{a.return7d}%</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">+{a.return30d}%</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-primary">+{a.return90d}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.sharpeRatio}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">{a.maxDrawdown}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.trustScore}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{formatCapital(a.capitalManaged)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.followers.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{a.actionsCount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center"><StatusPill status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
