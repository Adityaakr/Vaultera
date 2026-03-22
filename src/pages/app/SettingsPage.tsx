import { motion } from 'framer-motion';

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account, preferences, and integrations</p>
      </div>

      {/* Wallet */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground">Wallet & Account</h3>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary p-4">
          <div>
            <p className="text-sm font-medium text-foreground">No wallet connected</p>
            <p className="text-xs text-muted-foreground">Connect your Hedera wallet to start allocating</p>
          </div>
          <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-verdant-hover transition-colors">Connect Wallet</button>
        </div>
      </div>

      {/* Risk Profile */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground">Risk Profile</h3>
        <div className="mt-4 space-y-3">
          {['Conservative', 'Moderate', 'Aggressive'].map(p => (
            <label key={p} className="flex items-center gap-3 rounded-xl bg-secondary p-3 cursor-pointer hover:bg-muted transition-colors">
              <input type="radio" name="risk" defaultChecked={p === 'Moderate'} className="accent-[hsl(var(--primary))]" />
              <div>
                <p className="text-sm font-medium text-foreground">{p}</p>
                <p className="text-xs text-muted-foreground">{p === 'Conservative' ? 'Lower risk, stable yield' : p === 'Moderate' ? 'Balanced risk-return' : 'Higher risk, higher potential'}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground">Notifications</h3>
        <div className="mt-4 space-y-3">
          {['Agent actions on your vaults', 'Significant yield changes', 'Risk alerts and drawdowns', 'New agent competitions'].map(n => (
            <div key={n} className="flex items-center justify-between rounded-xl bg-secondary p-3">
              <span className="text-sm text-foreground">{n}</span>
              <div className="h-5 w-9 rounded-full bg-primary/30 p-0.5 cursor-pointer">
                <div className="h-4 w-4 rounded-full bg-primary translate-x-4 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Display */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground">Display Preferences</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
            <span className="text-sm text-foreground">Currency</span>
            <span className="text-sm font-medium text-muted-foreground">USD</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
            <span className="text-sm text-foreground">Default time period</span>
            <span className="text-sm font-medium text-muted-foreground">30 days</span>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground">Integrations</h3>
        <p className="mt-2 text-sm text-muted-foreground">API access and third-party integrations coming soon.</p>
        <div className="mt-4 rounded-xl bg-secondary p-4 text-center">
          <p className="text-sm text-muted-foreground">No integrations configured</p>
        </div>
      </div>
    </motion.div>
  );
}
