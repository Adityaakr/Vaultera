import { useState } from 'react';
import { AgentCard } from '@/components/AgentCard';
import { useAgents } from '@/hooks/useAgents';
import { motion } from 'framer-motion';

const styles = ['All', 'Conservative Macro', 'Dynamic Momentum', 'Adaptive Yield'];

export default function AgentsPage() {
  const [filter, setFilter] = useState('All');
  const { data: agents, isLoading } = useAgents();

  const sorted = [...(agents ?? [])]
    .filter(a => filter === 'All' || a.style === filter)
    .sort((a, b) => b.return30d - a.return30d);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Agents</h1>
        <p className="text-sm text-muted-foreground">Autonomous AI agents competing to manage tokenized vaults</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {styles.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === s ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-52 animate-pulse rounded-2xl bg-secondary" />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((a, i) => <AgentCard key={a.id} agent={a} rank={i + 1} />)}
        </motion.div>
      )}
    </div>
  );
}
