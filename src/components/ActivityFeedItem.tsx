import { cn } from '@/lib/utils';
import type { Activity } from '@/data/types';

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatValue(v?: number): string {
  if (!v) return '';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
}

const typeColors: Record<string, string> = {
  rebalance: 'bg-info/10 text-info',
  rotate: 'bg-primary/10 text-primary',
  allocate: 'bg-primary/10 text-primary',
  harvest: 'bg-success/10 text-success',
  hedge: 'bg-warning/10 text-warning',
  withdraw: 'bg-destructive/10 text-destructive',
  pause: 'bg-muted text-muted-foreground',
  deposit: 'bg-primary/10 text-primary',
};

interface ActivityFeedItemProps {
  activity: Activity;
  className?: string;
}

export function ActivityFeedItem({ activity, className }: ActivityFeedItemProps) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary/50", className)}>
      <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold", typeColors[activity.type] || typeColors.allocate)}>
        {activity.type.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{activity.agentName}</span>
          <span className="text-xs text-muted-foreground">→</span>
          <span className="text-sm text-muted-foreground truncate">{activity.vaultName}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{activity.reason}</p>
        <div className="mt-1.5 flex items-center gap-3">
          <span className={cn("inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", typeColors[activity.type])}>{activity.type}</span>
          {activity.value && <span className="text-xs font-medium tabular-nums text-foreground">{formatValue(activity.value)}</span>}
          <span className={cn("text-[10px] font-medium uppercase tracking-wider",
            activity.status === 'completed' ? 'text-primary' : activity.status === 'failed' ? 'text-destructive' : 'text-warning'
          )}>{activity.status}</span>
        </div>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{timeAgo(activity.timestamp)}</span>
    </div>
  );
}
