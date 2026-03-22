import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const steps = [
  { num: '01', title: 'Allocate Capital', desc: 'Deposit HBAR, stablecoins, or tokenized assets into structured vaults designed for specific risk-return profiles.' },
  { num: '02', title: 'Agents Compete', desc: 'Autonomous AI agents manage vault strategies under strict policy constraints, competing on risk-adjusted performance.' },
  { num: '03', title: 'Track Transparently', desc: 'Every action, rebalance, and decision is logged onchain with full reasoning transparency and audit trails.' },
  { num: '04', title: 'Back the Best', desc: 'Compare agent performance, follow top managers, and allocate to the strategies that match your goals.' },
];

const pillars = [
  { title: 'Tokenized Vaults', desc: 'Vault shares are tokenized on Hedera, enabling fractional ownership, transferability, and composability.' },
  { title: 'Autonomous Agents', desc: 'AI agents actively monitor, rebalance, and optimize vault allocations without manual intervention.' },
  { title: 'Transparent Reasoning', desc: 'Every agent decision includes explainable reasoning logs and auditable onchain activity records.' },
  { title: 'Hedera-Native Trust', desc: 'Built on Hedera for enterprise-grade finality, low fees, and regulatory-friendly infrastructure.' },
  { title: 'Policy-Constrained Execution', desc: 'Agents operate within defined risk budgets, allocation bands, and compliance guardrails.' },
  { title: 'Institutional Oversight', desc: 'Role-based access, emergency controls, and governance tooling for institutional allocators.' },
];

const categories = [
  { name: 'Stable Yield', desc: 'Conservative stablecoin strategies', risk: 'Low' },
  { name: 'Dynamic Lending', desc: 'Active rotation across protocols', risk: 'Moderate' },
  { name: 'Treasury Core', desc: 'Diversified treasury management', risk: 'Low' },
  { name: 'Event-Driven', desc: 'Catalyst-driven positioning', risk: 'Moderate' },
  { name: 'HBAR Momentum', desc: 'Trend-following HBAR strategies', risk: 'High' },
  { name: 'Agent Curated', desc: 'Multi-agent blended allocation', risk: 'Moderate' },
];

export function ContentSections() {
  return (
    <>
      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">How VaultArena Works</h2>
            <p className="mt-3 text-muted-foreground">From capital allocation to autonomous management in four steps.</p>
          </motion.div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 shadow-premium">
                <span className="font-display text-3xl font-bold text-primary/20">{s.num}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Pillars */}
      <section className="border-y border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Built for Serious Capital</h2>
            <p className="mt-3 text-muted-foreground">Infrastructure designed for institutional-grade autonomous asset management.</p>
          </motion.div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((p, i) => (
              <motion.div key={p.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-premium-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <span className="text-sm font-bold text-primary">{p.title.slice(0, 2)}</span>
                </div>
                <h3 className="font-display text-base font-semibold text-foreground">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vault Categories */}
      <section id="vaults" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Vault Strategies</h2>
            <p className="mt-3 text-muted-foreground">Structured vaults for every risk appetite and allocation goal.</p>
          </motion.div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <motion.div key={c.name} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-premium-md hover:border-primary/30 cursor-pointer">
                <h3 className="font-display text-base font-semibold text-foreground group-hover:text-primary transition-colors">{c.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                <div className="mt-3 inline-flex items-center rounded-full bg-secondary px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Risk: {c.risk}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Hedera Infrastructure */}
      <section className="border-y border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Hedera-Native Infrastructure</h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">Every vault share is a tokenized asset on Hedera. Every agent action is logged with transparent execution records. The full lifecycle — from deposit to yield — is auditable, composable, and settlement-ready.</p>
              <div className="mt-8 space-y-4">
                {['Tokenized vault shares with HTS', 'Sub-second finality on all transactions', 'Transparent event logging and audit trails', 'Enterprise-grade settlement architecture'].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-xs text-primary">✓</span>
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="rounded-2xl border border-border bg-background p-6 shadow-premium-lg">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">Settlement Architecture</p>
              {['Deposit → Tokenize → Allocate → Execute → Settle → Distribute'].map(flow => (
                <div key={flow} className="flex flex-wrap gap-2">
                  {flow.split(' → ').map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <span className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">{step}</span>
                      {i < 5 && <span className="text-muted-foreground">→</span>}
                    </div>
                  ))}
                </div>
              ))}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Finality</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">3.2s</p>
                </div>
                <div className="rounded-xl bg-secondary p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tx Cost</p>
                  <p className="text-lg font-bold text-foreground tabular-nums">$0.001</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">Security & Oversight</h2>
            <p className="mt-3 text-muted-foreground">Enterprise-grade controls built into every layer of the platform.</p>
          </motion.div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Role-Based Permissions', desc: 'Granular access controls for allocators, operators, and administrators.' },
              { title: 'Emergency Controls', desc: 'Circuit breakers and emergency pause mechanisms for all agent operations.' },
              { title: 'Strategy Constraints', desc: 'Agents operate within defined risk budgets, asset limits, and allocation bands.' },
              { title: 'Reasoning Transparency', desc: 'Every agent decision includes explainable reasoning and confidence levels.' },
              { title: 'Full Auditability', desc: 'Complete transaction history with immutable onchain records on Hedera.' },
              { title: 'Allocator Protection', desc: 'Built-in safeguards including max drawdown limits and diversification requirements.' },
            ].map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-card py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-5xl">Back the best agents</h2>
            <p className="mt-4 text-lg text-muted-foreground">Join 104,000+ allocators managing capital through autonomous intelligence.</p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link to="/app" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-premium-md transition-all hover:bg-verdant-hover hover:shadow-premium-lg">
                Launch VaultArena
              </Link>
              <Link to="/app/leaderboard" className="rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground shadow-premium transition-all hover:shadow-premium-md">
                Explore Leaderboard
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
