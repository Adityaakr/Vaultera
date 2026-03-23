import { useMarketData, type TokenQuote } from '@/hooks/useMarketData';
import { motion } from 'framer-motion';

function fmtPrice(n: number): string {
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(4)}`;
}

function fmtCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function TokenPill({ symbol, icon, quote, accent }: { symbol: string; icon: string; quote: TokenQuote; accent: string }) {
  const pos = quote.percent_change_24h >= 0;
  return (
    <div className="group flex items-center gap-2.5 transition-colors">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accent} text-sm font-bold`}>
        {icon}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-foreground">{symbol}</span>
        <span className="text-[12px] font-bold tabular-nums text-foreground">{fmtPrice(quote.price)}</span>
        <span className={`text-[10px] font-semibold tabular-nums ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
          {pos ? '+' : ''}{quote.percent_change_24h.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-4 w-px bg-border/60" />;
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export function MarketTicker() {
  const { data, isLoading, isError } = useMarketData();

  if (isError || isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/30 px-4 py-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-500/60 animate-pulse" />
        <span className="text-[11px] text-muted-foreground">
          {isLoading ? 'Connecting to CoinMarketCap...' : 'Market data unavailable'}
        </span>
      </div>
    );
  }

  const hbar = data!.HBAR;
  const hbar7dPos = hbar.percent_change_7d >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/40 backdrop-blur-sm px-4 py-2 overflow-x-auto"
    >
      {/* Live indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Live</span>
      </div>

      <Divider />

      {/* Token prices */}
      <div className="flex items-center gap-4">
        <TokenPill symbol="HBAR" icon="ℏ" quote={data!.HBAR} accent="bg-foreground/10 text-foreground" />
        <TokenPill symbol="BTC" icon="₿" quote={data!.BTC} accent="bg-amber-500/10 text-amber-500" />
        <TokenPill symbol="ETH" icon="Ξ" quote={data!.ETH} accent="bg-blue-500/10 text-blue-500" />
      </div>

      <Divider />

      {/* HBAR extended stats */}
      <div className="hidden lg:flex items-center gap-3 shrink-0">
        <StatItem label="Vol" value={fmtCompact(hbar.volume_24h)} />
        <StatItem label="MCap" value={fmtCompact(hbar.market_cap)} />
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-muted-foreground">7d</span>
          <span className={`font-semibold tabular-nums ${hbar7dPos ? 'text-emerald-400' : 'text-red-400'}`}>
            {hbar7dPos ? '+' : ''}{hbar.percent_change_7d.toFixed(2)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
