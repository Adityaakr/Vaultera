import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  className?: string;
}

export function KPICard({ label, value, change, changeType = 'neutral', icon, className }: KPICardProps) {
  return (
    <div className={cn(
      "rounded-2xl border border-border bg-card p-5 shadow-premium transition-shadow hover:shadow-premium-md",
      className
    )}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      {change && (
        <p className={cn(
          "mt-1 text-sm font-medium tabular-nums",
          changeType === 'positive' && "text-primary",
          changeType === 'negative' && "text-destructive",
          changeType === 'neutral' && "text-muted-foreground",
        )}>
          {change}
        </p>
      )}
    </div>
  );
}
