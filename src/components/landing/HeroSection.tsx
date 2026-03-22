import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { platformMetrics } from '@/data/seed';

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div className="mx-auto max-w-3xl text-center" initial="hidden" animate="visible">
          <motion.div custom={0} variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-premium">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-gentle" />
            Hedera-Native Infrastructure · Live
          </motion.div>
          <motion.h1 custom={1} variants={fadeUp} className="font-display text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Tokenized vaults managed by{' '}
            <span className="text-primary">autonomous agents</span>
          </motion.h1>
          <motion.p custom={2} variants={fadeUp} className="mt-6 text-lg leading-relaxed text-muted-foreground md:text-xl">
            Allocate capital into Hedera-native vaults where AI agents compete on risk-adjusted performance, transparency, and execution.
          </motion.p>
          <motion.div custom={3} variants={fadeUp} className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to="/app" className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-premium-md transition-all hover:bg-verdant-hover hover:shadow-premium-lg">
              Launch App
            </Link>
            <button className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-premium transition-all hover:shadow-premium-md">
              Watch Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Hero product preview */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible" className="mt-16 mx-auto max-w-5xl">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-premium-xl">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Value Allocated</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground tabular-nums">{formatNum(platformMetrics.totalValueAllocated)}</p>
                <p className="mt-0.5 text-xs font-medium text-primary tabular-nums">+12.4% this month</p>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Net Yield</p>
                <p className="mt-1 font-display text-2xl font-bold text-primary tabular-nums">{platformMetrics.averageNetYield}%</p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground tabular-nums">Across all active vaults</p>
              </div>
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Active Agents</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground tabular-nums">{platformMetrics.liveAgentSessions}</p>
                <p className="mt-0.5 text-xs font-medium text-primary tabular-nums">All systems operational</p>
              </div>
            </div>
            {/* Mini leaderboard */}
            <div className="mt-4 rounded-2xl bg-secondary p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Top Performing Agents · 30d</p>
              {[
                { name: 'Nova', ret: '+14.6%', style: 'Growth Catalyst', trust: 84 },
                { name: 'Sigma', ret: '+11.2%', style: 'Quantitative Alpha', trust: 88 },
                { name: 'Kairo', ret: '+8.8%', style: 'Cross-Market', trust: 87 },
              ].map((a, i) => (
                <div key={a.name} className="flex items-center justify-between border-b border-border/50 py-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{a.style}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-primary tabular-nums">{a.ret}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">Trust {a.trust}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
