import { useState, useEffect, useRef, useMemo } from 'react';
import { useActivities } from '@/hooks/useActivities';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { motion, AnimatePresence } from 'framer-motion';
import type { ActivityType } from '@/data/types';

const filterConfig: { key: ActivityType | 'all'; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'allocate',  label: 'Allocations' },
  { key: 'harvest',   label: 'Deallocations' },
  { key: 'deposit',   label: 'Deposits' },
  { key: 'withdraw',  label: 'Withdrawals' },
  { key: 'rebalance', label: 'Decisions' },
  { key: 'rotate',    label: 'Arena' },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const { data: activities, isLoading } = useActivities();
  const [prevCount, setPrevCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const all = activities ?? [];
  const filtered = filter === 'all' ? all : all.filter(a => a.type === filter);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    let volume = 0;
    for (const a of all) {
      byType[a.type] = (byType[a.type] || 0) + 1;
      volume += a.value || 0;
    }
    return { byType, volume };
  }, [all]);

  useEffect(() => {
    const count = all.length;
    if (count > prevCount && prevCount > 0) {
      setNewCount(count - prevCount);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setNewCount(0), 4000);
    }
    setPrevCount(count);
  }, [all.length]);

  const fmtVol = stats.volume >= 1_000_000
    ? `$${(stats.volume / 1_000_000).toFixed(1)}M`
    : stats.volume >= 1_000
      ? `$${(stats.volume / 1_000).toFixed(1)}K`
      : `$${Math.round(stats.volume)}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="font-display text-2xl font-bold text-foreground">Activity</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
          </span>
          <AnimatePresence>
            {newCount > 0 && (
              <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground tabular-nums">
                +{newCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <p className="text-sm text-muted-foreground">
          On-chain transactions from Hedera Testnet
          <span className="mx-1.5 text-border">·</span>
          <span className="tabular-nums font-medium text-foreground">{all.length}</span> events
          {stats.volume > 0 && (
            <>
              <span className="mx-1.5 text-border">·</span>
              <span className="tabular-nums font-medium text-foreground">{fmtVol}</span> volume
            </>
          )}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {filterConfig.map(({ key, label }) => {
          const count = key === 'all' ? all.length : (stats.byType[key] || 0);
          const active = filter === key;
          return (
            <button key={key} onClick={() => setFilter(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                active
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}>
              {label}
              {count > 0 && (
                <span className={`tabular-nums text-[10px] ${active ? 'text-background/60' : 'text-muted-foreground/50'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-secondary/60" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border/50 bg-card px-6 py-16 text-center">
          <p className="text-base font-semibold text-foreground">No {filter === 'all' ? '' : filter + ' '}activity yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
            {filter === 'all'
              ? 'Make a deposit or run the agent runner to see live on-chain transactions appear here.'
              : 'No matching events. Try "All" to see everything.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {filtered.slice(0, 80).map((a, i) => (
              <motion.div key={a.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: i < 5 ? i * 0.03 : 0 }}
                layout>
                <ActivityFeedItem activity={a} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
