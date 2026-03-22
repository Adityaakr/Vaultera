import { useState } from 'react';
import { activities } from '@/data/seed';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { motion } from 'framer-motion';
import type { ActivityType } from '@/data/types';

const types: (ActivityType | 'all')[] = ['all', 'rebalance', 'rotate', 'allocate', 'harvest', 'hedge', 'withdraw', 'pause', 'deposit'];

export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityType | 'all'>('all');
  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">Chronological feed of all autonomous agent actions</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${filter === t ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        {filtered.slice(0, 50).map(a => <ActivityFeedItem key={a.id} activity={a} />)}
      </motion.div>
    </div>
  );
}
