import { useParams, Link } from 'react-router-dom';
import { useAgents } from '@/hooks/useAgents';
import { useVaults } from '@/hooks/useVaults';
import { useActivities } from '@/hooks/useActivities';
import { useHCSLogs } from '@/hooks/useHCSLogs';
import { KPICard } from '@/components/KPICard';
import { VaultCard } from '@/components/VaultCard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { ScheduledActionsPanel } from '@/components/ScheduledActionsPanel';
import { StatusPill } from '@/components/VaultCard';
import { HCS_TOPIC_IDS } from '@/config/contracts';
import { HEDERA_TESTNET } from '@/config/hedera';
import { motion, AnimatePresence } from 'framer-motion';

function formatUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  if (v > 0) return `$${v.toFixed(0)}`;
  return '$0';
}

export default function AgentDetailPage() {
  const { id } = useParams();
  const { data: agents } = useAgents();
  const { data: vaults } = useVaults();
  const { data: activities } = useActivities();
  const { data: hcsLogs, isLoading: hcsLoading } = useHCSLogs(id);
  const agent = (agents ?? []).find(a => a.id === id);
  const agentVaults = agent ? (vaults ?? []).filter(v => agent.vaultsManaged.includes(v.id)) : [];
  const agentActivities = (activities ?? []).filter(a => a.agentId === id).slice(0, 8);
  const topicId = id ? HCS_TOPIC_IDS[id] : undefined;

  if (!agent) return <div className="py-20 text-center text-muted-foreground">Agent not found</div>;

  const managedTVL = agentVaults.reduce((s, v) => s + v.tvl, 0);

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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard label="30d Return" value={`${agent.return30d > 0 ? '+' : ''}${agent.return30d}%`} changeType={agent.return30d > 0 ? 'positive' : 'negative'} />
        <KPICard label="Sharpe Ratio" value={agent.sharpeRatio.toString()} />
        <KPICard label="Max Drawdown" value={`${agent.maxDrawdown}%`} />
        <KPICard label="Capital Managed" value={formatUSD(managedTVL)} change="Live TVL" changeType="positive" />
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

        {/* HCS Decision Log */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              Decision Log (HCS)
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
              </span>
            </h3>
            {topicId && (
              <a href={`${HEDERA_TESTNET.explorerUrl}/topic/${topicId}`} target="_blank" rel="noreferrer"
                className="text-[10px] text-primary hover:underline">View Topic →</a>
            )}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Immutable reasoning published to Hedera Consensus Service — polls every 5s</p>

          <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {hcsLoading ? (
              <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />)}</div>
            ) : (hcsLogs ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No HCS messages yet. Run the agent runner to generate decisions.</p>
            ) : (
              <AnimatePresence initial={false}>
                {(hcsLogs ?? []).map((log, i) => (
                  <motion.div key={log.sequenceNumber}
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl bg-secondary p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-primary">Cycle {log.cycle} · #{log.sequenceNumber}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-xs text-foreground">{log.summary}</p>
                    {(log.actions ?? []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {log.actions.map((a, j) => (
                          <span key={j} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {a.type} ${a.amount} → {a.strategy}
                          </span>
                        ))}
                      </div>
                    )}
                    {log.arena?.enter && (
                      <span className="mt-1 inline-block rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                        Arena: ${log.arena.stake} stake
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Actions */}
      <ScheduledActionsPanel vaultId={agent.vaultsManaged[0]} />

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
          {agentActivities.length > 0
            ? agentActivities.map(a => <ActivityFeedItem key={a.id} activity={a} />)
            : <p className="text-sm text-muted-foreground">No on-chain activity yet.</p>
          }
        </div>
      </div>
    </motion.div>
  );
}
