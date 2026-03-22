import { useParams, Link } from 'react-router-dom';
import { vaults, agents, activities } from '@/data/seed';
import { KPICard } from '@/components/KPICard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { StatusPill } from '@/components/VaultCard';
import { motion } from 'framer-motion';

function formatTVL(tvl: number): string {
  if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(2)}B`;
  if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
  return `$${(tvl / 1_000).toFixed(0)}K`;
}

export default function VaultDetailPage() {
  const { id } = useParams();
  const vault = vaults.find(v => v.id === id);
  const agent = vault ? agents.find(a => a.id === vault.managingAgentId) : null;
  const vaultActivities = activities.filter(a => a.vaultId === id).slice(0, 10);

  if (!vault) return <div className="py-20 text-center text-muted-foreground">Vault not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/app/vaults" className="text-sm text-muted-foreground hover:text-foreground">← Back to Vaults</Link>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground">{vault.name}</h1>
          <div className="mt-1 flex items-center gap-3">
            <StatusPill status={vault.status} />
            <span className="text-sm text-muted-foreground">{vault.category}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-premium hover:shadow-premium-md transition-all">Watch</button>
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-premium-md hover:bg-verdant-hover transition-colors">Deposit</button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{vault.strategy}</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="TVL" value={formatTVL(vault.tvl)} change="+4.2% this week" changeType="positive" />
        <KPICard label="APY (30d)" value={`${vault.apy30d}%`} change="Risk-adjusted" changeType="neutral" />
        <KPICard label="Utilization" value={`${vault.utilization}%`} />
        <KPICard label="Trust Score" value={`${vault.trustScore}/100`} change="Verified" changeType="positive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Allocation */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <h3 className="font-display text-base font-semibold text-foreground">Allocation Composition</h3>
          <div className="mt-4 space-y-3">
            {vault.allocation.map(a => (
              <div key={a.asset} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{a.asset}</span>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${a.percentage}%` }} />
                  </div>
                  <span className="text-sm font-medium tabular-nums text-foreground w-10 text-right">{a.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Managing Agent */}
        {agent && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
            <h3 className="font-display text-base font-semibold text-foreground">Managing Agent</h3>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 font-display text-lg font-bold text-accent">{agent.avatar}</div>
              <div>
                <Link to={`/app/agents/${agent.id}`} className="font-display text-base font-semibold text-foreground hover:text-primary">{agent.name}</Link>
                <p className="text-xs text-muted-foreground">{agent.style}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</p><p className="text-sm font-semibold text-foreground">{agent.confidence}%</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sharpe</p><p className="text-sm font-semibold text-foreground">{agent.sharpeRatio}</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust</p><p className="text-sm font-semibold text-primary">{agent.trustScore}%</p></div>
              <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p><StatusPill status={agent.status} /></div>
            </div>
          </div>
        )}

        {/* Deposit Widget */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <h3 className="font-display text-base font-semibold text-foreground">Deposit</h3>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Amount</label>
              <input type="text" placeholder="0.00" className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold tabular-nums text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="flex gap-2">
              {['25%', '50%', '75%', 'Max'].map(pct => (
                <button key={pct} className="flex-1 rounded-lg bg-secondary py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary">{pct}</button>
              ))}
            </div>
            <button className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-premium-md transition-all hover:bg-verdant-hover">
              Deposit & Receive Vault Tokens
            </button>
            <p className="text-center text-[10px] text-muted-foreground">You will receive tokenized vault shares on Hedera</p>
          </div>
        </div>
      </div>

      {/* Performance table */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Performance History</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">7d Return</p>
            <p className="mt-1 text-xl font-bold text-primary tabular-nums">+{vault.apy7d}%</p>
          </div>
          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">30d Return</p>
            <p className="mt-1 text-xl font-bold text-primary tabular-nums">+{vault.apy30d}%</p>
          </div>
          <div className="rounded-xl bg-secondary p-4 text-center">
            <p className="text-xs text-muted-foreground">90d Return</p>
            <p className="mt-1 text-xl font-bold text-primary tabular-nums">+{vault.apy90d}%</p>
          </div>
        </div>
      </div>

      {/* Activity */}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Recent Vault Activity</h3>
        <div className="space-y-3">
          {vaultActivities.map(a => <ActivityFeedItem key={a.id} activity={a} />)}
        </div>
      </div>
    </motion.div>
  );
}
