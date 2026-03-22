import { useState } from 'react';
import { VaultCard } from '@/components/VaultCard';
import { useVaults } from '@/hooks/useVaults';
import { motion } from 'framer-motion';

const categories = ['All', 'Treasury', 'Stable Yield', 'HBAR Momentum'];

export default function VaultsPage() {
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const { data: vaults, isLoading } = useVaults();

  const filtered = (vaults ?? []).filter(v => {
    if (filter !== 'All' && v.category !== filter) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Vaults</h1>
        <p className="text-sm text-muted-foreground">Browse and allocate to tokenized vault strategies on Hedera</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${filter === c ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {c}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search vaults..." value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-xl border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-64" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-52 animate-pulse rounded-2xl bg-secondary" />)}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(v => <VaultCard key={v.id} vault={v} />)}
        </motion.div>
      )}
    </div>
  );
}
