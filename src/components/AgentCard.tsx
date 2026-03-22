import { cn } from '@/lib/utils';
import type { Agent } from '@/data/types';
import { StatusPill } from './VaultCard';
import { Link } from 'react-router-dom';
import { useAgentLastAction, timeAgoShort } from '@/hooks/useAgentLastAction';

function formatCapital(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  if (v > 0) return `$${v.toFixed(0)}`;
  return '$0';
}

interface AgentCardProps {
  agent: Agent;
  rank?: number;
  className?: string;
}

export function AgentCard({ agent, rank, className }: AgentCardProps) {
  const { data: lastTs } = useAgentLastAction(agent.id);
  const lastAction = timeAgoShort(lastTs);
  const isRecent = lastTs ? (Date.now() / 1000 - Number(lastTs.split('.')[0])) < 300 : false;

  return (
    <Link to={`/app/agents/${agent.id}`} className={cn(
      "group block rounded-2xl border border-border bg-card p-5 shadow-premium transition-all hover:shadow-premium-md hover:border-primary/30",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 font-display text-sm font-bold text-accent">
          {agent.avatar}
          {rank && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {rank}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">{agent.name}</h3>
            <StatusPill status={agent.status} />
          </div>
          <p className="text-xs text-muted-foreground">{agent.style}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{agent.explanation}</p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">30d</p>
          <p className={cn("text-sm font-semibold tabular-nums", agent.return30d >= 0 ? "text-primary" : "text-destructive")}>
            {agent.return30d > 0 ? '+' : ''}{agent.return30d}%
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sharpe</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">{agent.sharpeRatio}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capital</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">{formatCapital(agent.capitalManaged)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust</p>
          <p className="text-sm font-semibold tabular-nums text-foreground">{agent.trustScore}%</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
        <span className={cn("h-1.5 w-1.5 rounded-full", isRecent ? "bg-primary animate-pulse" : "bg-muted-foreground/30")} />
        <span className="text-[10px] text-muted-foreground">Last action: {lastAction}</span>
      </div>
    </Link>
  );
}
