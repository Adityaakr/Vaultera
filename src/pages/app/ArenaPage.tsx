import { ethers } from 'ethers';
import { useAgents } from '@/hooks/useAgents';
import { useVaults } from '@/hooks/useVaults';
import { useArenaRounds } from '@/hooks/useArenaRounds';
import { motion } from 'framer-motion';
import { StatusPill } from '@/components/VaultCard';
import { VAULT_ADDRESSES } from '@/config/contracts';
import { VAULT_META } from '@/config/vaults';
import { HEDERA_TESTNET } from '@/config/hedera';
import { cn } from '@/lib/utils';

function formatUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  if (v > 0) return `$${v.toFixed(0)}`;
  return '$0';
}

function vaultName(addr: string): string {
  const entry = Object.entries(VAULT_ADDRESSES).find(([, a]) => a.toLowerCase() === addr.toLowerCase());
  if (!entry) return addr.slice(0, 8) + '...';
  return VAULT_META[entry[0]]?.name ?? entry[0];
}

const STATUS_LABELS = ['Open', 'Active', 'Resolved'] as const;
const STATUS_COLORS = ['bg-yellow-500/10 text-yellow-600', 'bg-blue-500/10 text-blue-600', 'bg-primary/10 text-primary'] as const;

export default function ArenaPage() {
  const { data: agents } = useAgents();
  const { data: vaults } = useVaults();
  const { data: rounds, isLoading: roundsLoading } = useArenaRounds();

  const ranked = [...(agents ?? [])].sort((a, b) => b.return30d - a.return30d);
  const top3 = ranked.slice(0, 3);

  const resolvedRounds = (rounds ?? []).filter(r => r.status === 2);
  const activeRounds = (rounds ?? []).filter(r => r.status <= 1);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Arena</h1>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Autonomous agents competing with real USDC stakes on Hedera Testnet</p>
      </div>

      {/* Podium */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 md:grid-cols-3">
        {top3.map((agent, i) => {
          const medals = ['1st', '2nd', '3rd'];
          const vault = (vaults ?? []).find(v => agent.vaultsManaged.includes(v.id));
          return (
            <div key={agent.id} className={cn(
              "rounded-2xl border bg-card p-6 shadow-premium transition-shadow hover:shadow-premium-md",
              i === 0 ? "border-primary/30 ring-1 ring-primary/10" : "border-border"
            )}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{medals[i]}</span>
                <StatusPill status={agent.status} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 font-display text-lg font-bold text-accent">{agent.avatar}</div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.style}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">30d Return</p><p className="text-lg font-bold text-primary tabular-nums">+{agent.return30d}%</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sharpe</p><p className="text-lg font-bold text-foreground tabular-nums">{agent.sharpeRatio}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Capital</p><p className="text-sm font-semibold text-foreground tabular-nums">{formatUSD(vault?.tvl ?? 0)}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust</p><p className="text-sm font-semibold text-foreground tabular-nums">{agent.trustScore}%</p></div>
              </div>
              {vault && <p className="mt-3 text-xs text-muted-foreground">Managing: {vault.name}</p>}
            </div>
          );
        })}
      </motion.div>

      {/* Active / Open Rounds */}
      {activeRounds.length > 0 && (
        <div>
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Active Rounds</h3>
          <div className="space-y-3">
            {activeRounds.map(round => (
              <div key={round.id} className="rounded-2xl border border-border bg-card p-5 shadow-premium">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Round #{round.id}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[round.status])}>
                    {STATUS_LABELS[round.status]}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <RoundSide label="Vault A" vault={round.vaultA} stake={round.stakeA} position={round.positionA} />
                  {round.vaultB !== ethers.ZeroAddress ? (
                    <RoundSide label="Vault B" vault={round.vaultB} stake={round.stakeB} position={round.positionB} />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border p-4 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground">Waiting for challenger...</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved Rounds */}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">
          {resolvedRounds.length > 0 ? 'Resolved Rounds' : 'Arena History'}
        </h3>
        {roundsLoading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
        ) : resolvedRounds.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-premium">
            <p className="text-sm text-muted-foreground">No arena rounds yet. Run the agent runner to start competitions.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resolvedRounds.map(round => (
              <div key={round.id} className="rounded-2xl border border-border bg-card p-5 shadow-premium">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Round #{round.id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">Payout: {formatUSD(round.payout)}</span>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', STATUS_COLORS[2])}>Resolved</span>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <RoundSide label="Vault A" vault={round.vaultA} stake={round.stakeA} position={round.positionA}
                    isWinner={round.winner.toLowerCase() === round.vaultA.toLowerCase()} />
                  <RoundSide label="Vault B" vault={round.vaultB} stake={round.stakeB} position={round.positionB}
                    isWinner={round.winner.toLowerCase() === round.vaultB.toLowerCase()} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rankings */}
      <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-display text-base font-semibold text-foreground">Full Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Agent</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">30d Return</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Sharpe</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Max DD</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Trust</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((agent, i) => (
                <tr key={agent.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                  <td className="px-4 py-3 font-semibold text-muted-foreground tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">{agent.avatar}</div>
                      <div>
                        <p className="font-medium text-foreground">{agent.name}</p>
                        <p className="text-[10px] text-muted-foreground">{agent.style}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary tabular-nums">+{agent.return30d}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{agent.sharpeRatio}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">{agent.maxDrawdown}%</td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">{agent.trustScore}%</td>
                  <td className="px-4 py-3 text-center"><StatusPill status={agent.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function RoundSide({ label, vault, stake, position, isWinner }: {
  label: string; vault: string; stake: number; position: string; isWinner?: boolean;
}) {
  return (
    <div className={cn('rounded-xl p-4', isWinner ? 'bg-primary/5 ring-1 ring-primary/20' : 'bg-secondary')}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {isWinner && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Winner</span>}
      </div>
      <p className="mt-1 text-sm font-semibold text-foreground">{vaultName(vault)}</p>
      <p className="text-xs text-muted-foreground">Stake: {formatUSD(stake)}</p>
      {position && <p className="mt-2 text-xs text-foreground/80 italic">"{position.slice(0, 120)}{position.length > 120 ? '...' : ''}"</p>}
    </div>
  );
}
