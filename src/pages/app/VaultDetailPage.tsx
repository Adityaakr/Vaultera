import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { useVault } from '@/hooks/useVaults';
import { useActivities } from '@/hooks/useActivities';
import { useStrategies } from '@/hooks/useStrategies';
import { useUSDCBalance } from '@/hooks/useUSDC';
import { useVaUSDBalance } from '@/hooks/useVaUSD';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useWallet } from '@/contexts/WalletContext';
import { getVaultContract, getUSDCContract, getVaUSDContract } from '@/lib/contracts';
import { VAULT_ADDRESSES } from '@/config/contracts';
import { HEDERA_TESTNET, HBAR_PRICE_USD } from '@/config/hedera';
import { AGENT_META } from '@/config/agents';
import { KPICard } from '@/components/KPICard';
import { StatusPill } from '@/components/VaultCard';
import { ActivityFeedItem } from '@/components/ActivityFeedItem';
import { ScheduledActionsPanel } from '@/components/ScheduledActionsPanel';
import { PerformancePanel } from '@/components/PerformancePanel';
import { usePerformanceHistory } from '@/hooks/usePerformanceHistory';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function formatUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v > 0) return `$${v.toFixed(2)}`;
  return '$0';
}

export default function VaultDetailPage() {
  const { id } = useParams();
  const { data: vault, isLoading } = useVault(id);
  const { data: activities } = useActivities();
  const { data: strategyData } = useStrategies(id);
  const perf = usePerformanceHistory(id ?? '');
  const { data: usdcBal } = useUSDCBalance();
  const { data: vausdBal } = useVaUSDBalance();
  const { data: portfolio } = usePortfolio();
  const { isConnected, connect, signer } = useWallet();
  const queryClient = useQueryClient();

  const [usdcAmount, setUsdcAmount] = useState('');
  const [vausdAmount, setVausdAmount] = useState('');
  const [hbarAmount, setHbarAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [step, setStep] = useState<'idle' | 'approving' | 'depositing'>('idle');

  const agent = vault ? AGENT_META[vault.managingAgentId] : null;
  const vaultActivities = (activities ?? []).filter(a => a.vaultId === id).slice(0, 5);
  const hbarBalance = portfolio?.hbarBalance ?? 0;

  const usdcNum = Number(usdcAmount) || 0;
  const vausdNum = Number(vausdAmount) || 0;
  const hbarNum = Number(hbarAmount) || 0;
  const totalUSD = usdcNum + vausdNum + (hbarNum * HBAR_PRICE_USD);

  async function handleDeposit() {
    if (!signer || !id || totalUSD <= 0) return;
    setDepositing(true);

    try {
      const vaultAddr = VAULT_ADDRESSES[id];
      const usdcWei = ethers.parseEther(usdcNum > 0 ? String(usdcNum) : '0');
      const vausdWei = ethers.parseEther(vausdNum > 0 ? String(vausdNum) : '0');
      const hbarWei = ethers.parseEther(hbarNum > 0 ? String(hbarNum) : '0');

      // Step 1: Approve USDC if needed
      if (usdcNum > 0) {
        setStep('approving');
        toast.info('Approving USDC...');
        const usdcContract = getUSDCContract(signer);
        const allowance = await usdcContract.allowance(await signer.getAddress(), vaultAddr);
        if (allowance < usdcWei) {
          const tx = await usdcContract.approve(vaultAddr, usdcWei, { gasLimit: 500_000 });
          await tx.wait();
        }
      }

      // Step 1b: Approve vaUSD if needed
      if (vausdNum > 0) {
        setStep('approving');
        toast.info('Approving vaUSD...');
        const vausdContract = getVaUSDContract(signer);
        const allowance = await vausdContract.allowance(await signer.getAddress(), vaultAddr);
        if (allowance < vausdWei) {
          const tx = await vausdContract.approve(vaultAddr, vausdWei, { gasLimit: 500_000 });
          await tx.wait();
        }
      }

      // Step 2: Deposit
      setStep('depositing');
      toast.info('Depositing into pool...');
      const vault = getVaultContract(id, signer);
      const tx = await vault.deposit(usdcWei, vausdWei, {
        value: hbarWei,
        gasLimit: 1_500_000,
      });
      await tx.wait();

      toast.success(`Deposited ${formatUSD(totalUSD)} — LP tokens minted!`);
      setUsdcAmount('');
      setVausdAmount('');
      setHbarAmount('');
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['usdc-balance'] });
      queryClient.invalidateQueries({ queryKey: ['vausd-balance'] });
    } catch (err: any) {
      toast.error(err?.reason || err?.message || 'Deposit failed');
    } finally {
      setDepositing(false);
      setStep('idle');
    }
  }

  if (isLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />)}</div>;
  }
  if (!vault) return <div className="py-20 text-center text-muted-foreground">Vault not found</div>;

  const totalStrategyAmount = strategyData?.reduce((s, st) => s + st.amount, 0) ?? 0;
  const idleAmount = vault.tvl - totalStrategyAmount;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/app/vaults" className="text-sm text-muted-foreground hover:text-foreground">← Back to Vaults</Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">{vault.name}</h1>
            <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold tracking-wide text-primary">{vault.symbol}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{vault.strategy}</p>
          <div className="mt-1.5 flex items-center gap-3">
            <StatusPill status={vault.status} />
            <span className="text-sm text-muted-foreground">{vault.category}</span>
            <a href={`${HEDERA_TESTNET.explorerUrl}/contract/${VAULT_ADDRESSES[vault.id]}`}
              target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
              View on HashScan →
            </a>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="TVL" value={formatUSD(vault.tvl)} change="Live on-chain (USD)" changeType="positive" />
        <KPICard label="APY (30d)" value={`${vault.apy30d}%`} changeType="neutral" />
        <KPICard label="Risk Level" value={vault.riskLevel.charAt(0).toUpperCase() + vault.riskLevel.slice(1)} />
        <KPICard label="Trust Score" value={`${vault.trustScore}/100`} change="Verified" changeType="positive" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Strategy Allocation */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <h3 className="font-display text-base font-semibold text-foreground">Pool Allocation</h3>
          <p className="text-xs text-muted-foreground mt-1">How the AI agent deploys pool capital</p>
          <div className="mt-4 space-y-3">
            <AllocationBar label="Idle (in pool)" amount={idleAmount} total={vault.tvl} color="bg-muted-foreground/30" />
            {(strategyData ?? []).map(s => (
              <AllocationBar key={s.name} label={s.name} amount={s.amount} total={vault.tvl}
                color={s.name === 'StableLending' ? 'bg-primary' : s.name === 'MomentumPool' ? 'bg-orange-500' : 'bg-violet-500'} />
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
          <h3 className="font-display text-base font-semibold text-foreground">Deposit into Pool</h3>
          <p className="text-xs text-muted-foreground mt-1">Deposit any combination of tokens</p>
          <div className="mt-4 space-y-3">
            <DepositInput label="USDC" balance={usdcBal ?? 0} value={usdcAmount} onChange={setUsdcAmount}
              onMax={() => setUsdcAmount(String(Math.floor(usdcBal ?? 0)))} />
            <DepositInput label="vaUSD" balance={vausdBal ?? 0} value={vausdAmount} onChange={setVausdAmount}
              onMax={() => setVausdAmount(String(Math.floor(vausdBal ?? 0)))} />
            <DepositInput label="HBAR" balance={hbarBalance} value={hbarAmount} onChange={setHbarAmount} suffix={hbarNum > 0 ? `≈ $${(hbarNum * HBAR_PRICE_USD).toFixed(2)}` : undefined}
              onMax={() => setHbarAmount(String(Math.floor(hbarBalance * 100) / 100))} />

            {totalUSD > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Total USD Value</span>
                <span className="text-sm font-bold text-primary">{formatUSD(totalUSD)}</span>
              </div>
            )}

            {isConnected ? (
              <button onClick={handleDeposit} disabled={depositing || totalUSD <= 0}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-premium-md transition-all hover:bg-verdant-hover disabled:opacity-50">
                {step === 'approving' ? 'Approving...' : step === 'depositing' ? 'Depositing...' : 'Deposit & Receive LP Tokens'}
              </button>
            ) : (
              <button onClick={connect}
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-premium-md transition-all hover:bg-verdant-hover">
                Connect Wallet to Deposit
              </button>
            )}

            {!isConnected && (
              <p className="text-center text-[10px] text-muted-foreground">No USDC? <Link to="/app/settings" className="text-primary hover:underline">Get test tokens in Settings →</Link></p>
            )}
          </div>
        </div>
      </div>

      {/* Performance */}
      {perf ? (
        <PerformancePanel perf={perf} vault={{ apy7d: vault.apy7d, apy30d: vault.apy30d, apy90d: vault.apy90d }} />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Performance</h3>
          <div className="h-24 animate-pulse rounded-lg bg-secondary" />
        </div>
      )}

      {/* Scheduled Actions */}
      <ScheduledActionsPanel vaultId={vault.id} />

      {/* Activity */}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Recent Vault Activity</h3>
        <div className="space-y-3">
          {vaultActivities.length > 0
            ? vaultActivities.map(a => <ActivityFeedItem key={a.id} activity={a} />)
            : <p className="text-sm text-muted-foreground">No activity yet for this vault.</p>
          }
        </div>
      </div>
    </motion.div>
  );
}

function DepositInput({ label, balance, value, onChange, onMax, suffix }: {
  label: string; balance: number; value: string; onChange: (v: string) => void; onMax: () => void; suffix?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        <button onClick={onMax} className="text-[10px] text-primary hover:underline">
          Balance: {balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </button>
      </div>
      <div className="relative">
        <input type="number" step="0.01" min="0" placeholder="0.00" value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function AllocationBar({ label, amount, total, color }: { label: string; amount: number; total: number; color: string }) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">{formatUSD(amount)} ({pct.toFixed(0)}%)</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(pct, 1)}%` }} />
      </div>
    </div>
  );
}
