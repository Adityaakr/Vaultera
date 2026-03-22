import { useState, useEffect } from 'react';
import { useScheduledActions, type ScheduledAction } from '@/hooks/useScheduledActions';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

function Countdown({ executeAt }: { executeAt: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(executeAt).getTime() - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.max(0, new Date(executeAt).getTime() - Date.now());
      setRemaining(r);
      if (r <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [executeAt]);

  if (remaining <= 0) return <span className="text-primary font-semibold">Executing...</span>;

  const seconds = Math.floor(remaining / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <span className="font-mono text-sm tabular-nums text-foreground">
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

function ActionItem({ action }: { action: ScheduledAction }) {
  const isPending = action.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        'flex items-center justify-between rounded-xl border p-3 transition-colors',
        isPending ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold',
          isPending ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          {isPending ? (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
          ) : '✓'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{action.agent}</span>
            <span className="text-[10px] text-muted-foreground">→</span>
            <span className="text-xs text-muted-foreground">{action.strategy}</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {action.type} ${action.amount.toLocaleString()} — {action.reason?.slice(0, 60) ?? 'Scheduled rebalance'}
          </p>
        </div>
      </div>
      <div className="text-right">
        {isPending ? (
          <Countdown executeAt={action.executeAt} />
        ) : (
          <span className="text-[10px] font-medium text-primary">Executed</span>
        )}
      </div>
    </motion.div>
  );
}

interface ScheduledActionsPanelProps {
  vaultId?: string;
  className?: string;
}

export function ScheduledActionsPanel({ vaultId, className }: ScheduledActionsPanelProps) {
  const { data: actions, isLoading } = useScheduledActions();

  const filtered = vaultId
    ? (actions ?? []).filter(a => a.vault === vaultId)
    : (actions ?? []);

  const pending = filtered.filter(a => a.status === 'pending');
  const recent = filtered.filter(a => a.status === 'executed').slice(0, 3);
  const display = [...pending, ...recent];

  if (isLoading) {
    return (
      <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-premium', className)}>
        <div className="h-6 w-48 animate-pulse rounded bg-secondary" />
        <div className="mt-4 space-y-3">
          {[1,2].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-premium', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
          Scheduled Actions
          {pending.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              {pending.length} pending
            </span>
          )}
        </h3>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Agent-planned actions with autonomous execution timers</p>

      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {display.length > 0 ? (
            display.map((a, i) => <ActionItem key={`${a.vault}-${a.strategy}-${a.executeAt}-${i}`} action={a} />)
          ) : (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No scheduled actions yet. Run the agent runner to see autonomous planning.
            </p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
