import { cn } from '@/lib/utils';
import { HEDERA_TESTNET } from '@/config/hedera';
import type { Activity } from '@/data/types';

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function fmtVal(v?: number): string {
  if (!v) return '';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${Math.round(v).toLocaleString()}`;
}

const typeStyle: Record<string, { icon: string; label: string; accent: string; bg: string }> = {
  deposit:   { icon: '↓', label: 'Deposit',    accent: 'text-primary',            bg: 'bg-primary/8' },
  withdraw:  { icon: '↑', label: 'Withdraw',   accent: 'text-destructive',        bg: 'bg-destructive/8' },
  allocate:  { icon: '→', label: 'Allocate',   accent: 'text-primary',            bg: 'bg-primary/8' },
  harvest:   { icon: '←', label: 'Deallocate', accent: 'text-accent',             bg: 'bg-accent/8' },
  rebalance: { icon: '⟳', label: 'Decision',   accent: 'text-accent',             bg: 'bg-accent/8' },
  rotate:    { icon: '⚔', label: 'Arena',      accent: 'text-accent',             bg: 'bg-accent/8' },
  hedge:     { icon: '◆', label: 'Hedge',      accent: 'text-accent',             bg: 'bg-accent/8' },
  pause:     { icon: '‖', label: 'Pause',      accent: 'text-muted-foreground',   bg: 'bg-muted/40' },
};

interface Props {
  activity: Activity;
  compact?: boolean;
  className?: string;
}

function parseCycleLabel(reason: string): { cycle: string; decision: string } | null {
  const m = reason.match(/^Cycle\s+(\d+):\s*(.+)$/i);
  if (!m) return null;
  return { cycle: m[1], decision: m[2].trim() };
}

export function ActivityFeedItem({ activity, compact, className }: Props) {
  const style = typeStyle[activity.type] || typeStyle.allocate;
  const hasValue = (activity.value ?? 0) > 0;
  const isDecision = activity.type === 'rebalance';
  const hashscanUrl = activity.txHash
    ? `${HEDERA_TESTNET.explorerUrl}/tx/${activity.txHash}`
    : undefined;

  // --- Compact (for overview sidebar) ---
  if (compact) {
    return (
      <div className={cn("rounded-lg border border-border/40 bg-card px-3 py-2.5", className)}>
        {/* Top: icon + agent + vault + time */}
        <div className="flex items-center gap-2 mb-1">
          <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-semibold", style.bg, style.accent)}>
            {style.icon}
          </span>
          <span className="text-[11px] font-semibold text-foreground">{activity.agentName}</span>
          <span className="text-[10px] text-muted-foreground/40">→</span>
          <span className="text-[10px] text-muted-foreground truncate">{activity.vaultName}</span>
          <div className="flex-1" />
          {hasValue && (
            <span className={cn("text-[11px] font-bold tabular-nums", style.accent)}>{fmtVal(activity.value)}</span>
          )}
          <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">{timeAgo(activity.timestamp)}</span>
        </div>
        {/* Bottom: action text */}
        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 pl-7">
          {isDecision ? `"${activity.action}"` : activity.action}
        </p>
      </div>
    );
  }

  // --- Agent Decision card (the thinking view) ---
  if (isDecision) {
    const cycleInfo = parseCycleLabel(activity.reason);
    const thinking = activity.action;
    const hasScheduled = activity.reason?.includes('scheduled');
    const isAction = cycleInfo ? !cycleInfo.decision.startsWith('hold') : false;

    return (
      <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden", className)}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/30 bg-secondary/30">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent">
            {activity.agentAvatar}
          </span>
          <span className="text-xs font-semibold text-foreground">{activity.agentName}</span>
          <span className="text-[10px] text-muted-foreground/40">·</span>
          <span className="text-[11px] text-muted-foreground">{activity.vaultName}</span>
          <div className="flex-1" />
          {cycleInfo && (
            <span className="text-[10px] font-mono text-muted-foreground/50">#{cycleInfo.cycle}</span>
          )}
          <span className="text-[10px] text-muted-foreground/40 tabular-nums">{timeAgo(activity.timestamp)} ago</span>
        </div>

        {/* Body: thinking */}
        <div className="px-4 py-3">
          {/* Decision badge */}
          <div className="flex items-center gap-2 mb-2">
            {isAction ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wide">
                ⟳ Executing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/8 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wide">
                ◇ Holding
              </span>
            )}
            {hasScheduled && (
              <span className="inline-flex items-center rounded-md bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary">
                + Scheduled
              </span>
            )}
            {cycleInfo && cycleInfo.decision !== 'hold' && (
              <span className="text-[11px] font-medium text-foreground">{cycleInfo.decision}</span>
            )}
          </div>

          {/* Agent thinking */}
          <div className="relative pl-3 border-l-2 border-accent/20">
            <p className="text-[13px] text-foreground/80 leading-relaxed italic">
              "{thinking}"
            </p>
          </div>

          {/* Footer */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="inline-flex items-center rounded bg-primary/6 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              ✓ On-chain
            </span>
            <div className="flex-1" />
            {hashscanUrl && (
              <a href={hashscanUrl} target="_blank" rel="noreferrer"
                className="text-[10px] text-muted-foreground/40 hover:text-primary font-mono transition-colors">
                {activity.txHash!.slice(0, 8)}…{activity.txHash!.slice(-4)} ↗
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Full card for fund-moving events ---
  return (
    <div className={cn("rounded-xl border border-border/50 bg-card overflow-hidden", className)}>
      <div className="px-4 py-3.5">
        {/* Row 1: Type + Agent + Vault + Time */}
        <div className="flex items-center gap-2 mb-2">
          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold", style.bg, style.accent)}>
            {style.icon}
          </span>
          <span className={cn("text-[11px] font-semibold uppercase tracking-wide", style.accent)}>{style.label}</span>
          <span className="text-border">·</span>
          <span className="text-xs font-medium text-foreground">{activity.agentName}</span>
          <span className="text-[10px] text-muted-foreground/40">→</span>
          <span className="text-xs text-muted-foreground">{activity.vaultName}</span>
          <div className="flex-1" />
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{timeAgo(activity.timestamp)} ago</span>
        </div>

        {/* Row 2: Action + Amount (the hero row) */}
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] font-medium text-foreground leading-snug">{activity.action}</p>
          {hasValue && (
            <span className={cn("shrink-0 text-base font-bold tabular-nums", style.accent)}>
              {fmtVal(activity.value)}
            </span>
          )}
        </div>

        {/* Row 3: Reasoning */}
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">{activity.reason}</p>

        {/* Row 4: Metadata chips */}
        <div className="mt-2.5 flex items-center gap-2">
          {activity.strategyName && (
            <span className="inline-flex items-center rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-accent">
              {activity.strategyName}
            </span>
          )}
          <span className="inline-flex items-center rounded bg-primary/6 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            ✓ Confirmed
          </span>
          <div className="flex-1" />
          {hashscanUrl && (
            <a href={hashscanUrl} target="_blank" rel="noreferrer"
              className="text-[10px] text-muted-foreground/40 hover:text-primary font-mono transition-colors">
              {activity.txHash!.slice(0, 8)}…{activity.txHash!.slice(-4)} ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
