import { cn } from '@/lib/utils';
import type { Vault } from '@/data/types';
import { agents } from '@/data/seed';
import { Link } from 'react-router-dom';

function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(0)}M`;
  return `$${(tvl / 1_000).toFixed(0)}K`;
}

interface VaultCardProps {
  vault: Vault;
  className?: string;
}

export function VaultCard({ vault, className }: VaultCardProps) {
  const agent = agents.find(a => a.id === vault.managingAgentId);
  return (
    <Link to={`/app/vaults/${vault.id}`} className={cn(
      "group block rounded-2xl border border-border bg-card p-5 shadow-premium transition-all hover:shadow-premium-md hover:border-primary/30",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">{vault.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{vault.category}</p>
        </div>
        <StatusPill status={vault.status} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{vault.strategy}</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <MetricBlock label="TVL" value={formatTVL(vault.tvl)} />
        <MetricBlock label="APY" value={`${vault.apy}%`} highlight />
        <MetricBlock label="Risk" value={vault.riskLevel} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{agent?.avatar}</div>
          <span className="text-xs text-muted-foreground">{agent?.name}</span>
        </div>
        <span className="text-xs text-muted-foreground">Trust {vault.trustScore}%</span>
      </div>
    </Link>
  );
}

function MetricBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-semibold tabular-nums", highlight ? "text-primary" : "text-foreground")}>{value}</p>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-primary/10 text-primary',
    paused: 'bg-warning/10 text-warning',
    rebalancing: 'bg-info/10 text-info',
    new: 'bg-muted text-muted-foreground',
    monitoring: 'bg-primary/10 text-primary',
    executing: 'bg-emerald-signal/10 text-emerald-signal',
    idle: 'bg-muted text-muted-foreground',
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider", styles[status] || styles.active)}>
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current animate-pulse-gentle" />
      {status}
    </span>
  );
}
