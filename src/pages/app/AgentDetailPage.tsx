import { useParams, Link } from 'react-router-dom';
import { agents, vaults, activities } from '@/data/seed';
import { KPICard } from '@/components/KPICard';
import { VaultCard } from '@/components/VaultCard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { StatusPill } from '@/components/VaultCard';
import { motion } from 'framer-motion';

function formatCapital(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  return `$${(v / 1_000).toFixed(0)}K`;
}

export default function AgentDetailPage() {
  const { id } = useParams();
  const agent = agents.find(a => a.id === id);
  const agentVaults = agent ? vaults.filter(v => agent.vaultsManaged.includes(v.id)) : [];
  const agentActivities = activities.filter(a => a.agentId === id).slice(0, 8);

  if (!agent) return <div className="py-20 text-center text-muted-foreground">Agent not found</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Link to="/app/agents" className="text-sm text-muted-foreground hover:text-foreground">← Back to Agents</Link>

      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent/10 font-display text-2xl font-bold text-accent">{agent.avatar}</div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">{agent.name}</h1>
            <StatusPill status={agent.status} />
          </div>
          <p className="text-sm text-muted-foreground">{agent.style} · {agent.reactionSpeed} response</p>
          <p className="mt-2 text-sm text-muted-foreground">{agent.explanation}</p>
        </div>
        <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-premium-md hover:bg-verdant-hover transition-colors">Follow Agent</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard label="30d Return" value={`${agent.return30d > 0 ? '+' : ''}${agent.return30d}%`} changeType={agent.return30d > 0 ? 'positive' : 'negative'} />
        <KPICard label="Sharpe Ratio" value={agent.sharpeRatio.toString()} />
        <KPICard label="Max Drawdown" value={`${agent.maxDrawdown}%`} />
        <KPICard label="Capital Managed" value={formatCapital(agent.capitalManaged)} />
        <KPICard label="Trust Score" value={`${agent.trustScore}/100`} changeType="positive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strategy & Specialties */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <h3 className="font-display text-base font-semibold text-foreground">Strategy Profile</h3>
          <div className="mt-4 space-y-3">
            <div><p className="text-xs text-muted-foreground">Strategy</p><p className="text-sm text-foreground">{agent.strategy}</p></div>
            <div><p className="text-xs text-muted-foreground">Confidence</p><p className="text-sm font-semibold text-foreground">{agent.confidence}%</p></div>
            <div><p className="text-xs text-muted-foreground">Risk Profile</p><p className="text-sm font-medium text-foreground capitalize">{agent.riskProfile}</p></div>
            <div>
              <p className="text-xs text-muted-foreground">Specialties</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {agent.specialties.map(s => (
                  <span key={s} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reasoning Logs */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <h3 className="font-display text-base font-semibold text-foreground">Recent Reasoning & Actions</h3>
          <div className="mt-4 space-y-3">
            {agent.recentActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl bg-secondary p-3">
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <p className="text-sm text-foreground">{action}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-secondary/50 p-3">
            <p className="text-xs text-muted-foreground">Followers: <span className="font-semibold text-foreground">{agent.followers.toLocaleString()}</span> · Actions: <span className="font-semibold text-foreground">{agent.actionsCount.toLocaleString()}</span></p>
          </div>
        </div>
      </div>

      {/* Managed Vaults */}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Managed Vaults</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agentVaults.map(v => <VaultCard key={v.id} vault={v} />)}
        </div>
      </div>

      {/* Activity */}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Agent Activity</h3>
        <div className="space-y-3">
          {agentActivities.map(a => <ActivityFeedItem key={a.id} activity={a} />)}
        </div>
      </div>
    </motion.div>
  );
}
