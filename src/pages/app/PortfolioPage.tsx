import { useState } from 'react';
import { ethers } from 'ethers';
import { KPICard } from '@/components/KPICard';
import { VaultCard } from '@/components/VaultCard';
import { useVaults } from '@/hooks/useVaults';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useWallet } from '@/contexts/WalletContext';
import { getVaultContract } from '@/lib/contracts';
import { VAULT_META } from '@/config/vaults';
import { HBAR_PRICE_USD } from '@/config/hedera';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

function formatUSD(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (v > 0) return `$${v.toFixed(2)}`;
  return '$0';
}

const TOKEN_CHOICES = [
  { value: 0, label: 'USDC' },
  { value: 1, label: 'vaUSD' },
  { value: 2, label: 'HBAR' },
] as const;

export default function PortfolioPage() {
  const { data: vaults } = useVaults();
  const { data: portfolio, isLoading } = usePortfolio();
  const { isConnected, connect, signer } = useWallet();
  const queryClient = useQueryClient();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawAmounts, setWithdrawAmounts] = useState<Record<string, string>>({});
  const [tokenChoices, setTokenChoices] = useState<Record<string, number>>({});

  const positions = portfolio?.positions ?? [];
  const hbarBalance = portfolio?.hbarBalance ?? 0;
  const usdcBalance = portfolio?.usdcBalance ?? 0;
  const vausdBalance = portfolio?.vausdBalance ?? 0;

  const hbarUSD = hbarBalance * HBAR_PRICE_USD;
  const positionsUSD = positions.reduce((s, p) => s + p.value, 0);
  const totalUSD = hbarUSD + usdcBalance + vausdBalance + positionsUSD;

  async function handleWithdraw(vaultId: string) {
    if (!signer) return;
    const amtStr = withdrawAmounts[vaultId];
    const position = positions.find(p => p.vaultId === vaultId);
    if (!position) return;

    const shares = amtStr ? Number(amtStr) : position.shares;
    if (shares <= 0) return;

    const tokenChoice = tokenChoices[vaultId] ?? 0;
    setWithdrawingId(vaultId);

    try {
      const contract = getVaultContract(vaultId, signer);
      const sharesWei = ethers.parseEther(shares.toString());
      const tx = await contract.withdraw(sharesWei, tokenChoice, { gasLimit: 1_000_000 });
      toast.info('Withdraw submitted...');
      await tx.wait();
      toast.success(`Withdrawn as ${TOKEN_CHOICES[tokenChoice].label}!`);
      queryClient.invalidateQueries({ queryKey: ['vaults'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['usdc-balance'] });
      queryClient.invalidateQueries({ queryKey: ['vausd-balance'] });
    } catch (err: any) {
      toast.error(err?.reason || err?.message || 'Withdraw failed');
    } finally {
      setWithdrawingId(null);
    }
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <h1 className="font-display text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-muted-foreground">Connect your wallet to view your positions.</p>
        <button onClick={connect} className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-premium-md hover:bg-verdant-hover transition-colors">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Your live positions and balances on Hedera Testnet</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KPICard label="Total Value" value={formatUSD(totalUSD)} change="All assets" changeType="positive" />
        <KPICard label="HBAR" value={`${hbarBalance.toFixed(2)}`} change={formatUSD(hbarUSD)} changeType="neutral" />
        <KPICard label="USDC" value={`${usdcBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} change={formatUSD(usdcBalance)} changeType="neutral" />
        <KPICard label="vaUSD" value={`${vausdBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} change={formatUSD(vausdBalance)} changeType="neutral" />
        <KPICard label="In Vaults" value={formatUSD(positionsUSD)} change={`${positions.length} positions`} changeType="positive" />
      </motion.div>

      {isLoading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-secondary" />
      ) : positions.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-premium">
          <p className="text-muted-foreground">No vault positions yet.</p>
          <Link to="/app/vaults" className="mt-2 inline-block text-sm text-primary hover:underline">Browse Vaults →</Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-display text-base font-semibold text-foreground">Your LP Positions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Vault</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">LP Tokens</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Value (USD)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Withdraw</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Payout</th>
                  <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(p => {
                  const meta = VAULT_META[p.vaultId];
                  const choice = tokenChoices[p.vaultId] ?? 0;
                  return (
                    <tr key={p.vaultId} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{meta?.name ?? p.vaultId}</p>
                        <p className="text-[10px] text-muted-foreground">{meta?.symbol}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-foreground">{p.shares.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">{formatUSD(p.value)}</td>
                      <td className="px-4 py-3 text-right">
                        <input type="number" placeholder="All" value={withdrawAmounts[p.vaultId] ?? ''}
                          onChange={e => setWithdrawAmounts(prev => ({ ...prev, [p.vaultId]: e.target.value }))}
                          className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs tabular-nums text-right text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <select value={choice} onChange={e => setTokenChoices(prev => ({ ...prev, [p.vaultId]: Number(e.target.value) }))}
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none">
                          {TOKEN_CHOICES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleWithdraw(p.vaultId)}
                          disabled={withdrawingId === p.vaultId}
                          className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
                          {withdrawingId === p.vaultId ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {positions.length > 0 && (
        <div>
          <h3 className="font-display text-base font-semibold text-foreground mb-4">Your Vaults</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {positions.map(p => {
              const vault = (vaults ?? []).find(v => v.id === p.vaultId);
              return vault ? <VaultCard key={vault.id} vault={vault} /> : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
