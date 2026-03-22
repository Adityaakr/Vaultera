import { KPICard } from '@/components/KPICard';
import { VaultCard } from '@/components/VaultCard';
import { vaults } from '@/data/seed';
import { motion } from 'framer-motion';

const positions = [
  { vaultId: 'vault-1', shares: 1240, value: 48200, yield: 1820, pnl: 12.4 },
  { vaultId: 'vault-2', shares: 890, value: 32100, yield: 1240, pnl: 8.2 },
  { vaultId: 'vault-5', shares: 450, value: 18400, yield: 2100, pnl: 18.4 },
  { vaultId: 'vault-8', shares: 670, value: 24800, yield: 1560, pnl: 9.7 },
];

export default function PortfolioPage() {
  const totalValue = positions.reduce((s, p) => s + p.value, 0);
  const totalYield = positions.reduce((s, p) => s + p.yield, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Portfolio</h1>
        <p className="text-sm text-muted-foreground">Your positions, tokenized shares, and yield summary</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total Portfolio Value" value={`$${totalValue.toLocaleString()}`} change="+12.4% all-time" changeType="positive" />
        <KPICard label="Claimable Yield" value={`$${totalYield.toLocaleString()}`} change="Ready to harvest" changeType="positive" />
        <KPICard label="Active Positions" value={positions.length.toString()} />
        <KPICard label="Watched Agents" value="6" />
      </motion.div>

      {/* Positions */}
      <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-foreground">Your Positions</h3>
          <button className="text-sm font-medium text-primary hover:underline">Harvest All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Vault</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Shares</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Yield</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">PnL</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(p => {
                const vault = vaults.find(v => v.id === p.vaultId);
                if (!vault) return null;
                return (
                  <tr key={p.vaultId} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{vault.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">{p.shares.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-foreground">${p.value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-primary">${p.yield.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">+{p.pnl}%</td>
                    <td className="px-4 py-3 text-right">
                      <button className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors">Withdraw</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vault cards for context */}
      <div>
        <h3 className="font-display text-base font-semibold text-foreground mb-4">Your Vaults</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {positions.map(p => {
            const vault = vaults.find(v => v.id === p.vaultId);
            return vault ? <VaultCard key={vault.id} vault={vault} /> : null;
          })}
        </div>
      </div>
    </div>
  );
}
