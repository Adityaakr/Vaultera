import { useMarketData, type TokenQuote } from '@/hooks/useMarketData';
import { motion } from 'framer-motion';

function fmt(n: number, decimals = 2): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (n >= 1) return `$${n.toFixed(decimals)}`;
  return `$${n.toFixed(4)}`;
}

function PctBadge({ value }: { value: number }) {
  const pos = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${pos ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
      {pos ? '▲' : '▼'} {Math.abs(value).toFixed(2)}%
    </span>
  );
}

function TokenCard({ symbol, icon, quote }: { symbol: string; icon: string; quote: TokenQuote }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-secondary/50 px-3.5 py-2.5 min-w-[160px]">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground">{symbol}</span>
          <PctBadge value={quote.percent_change_24h} />
        </div>
        <p className="text-sm font-bold tabular-nums text-foreground">{fmt(quote.price)}</p>
      </div>
    </div>
  );
}

export function MarketTicker() {
  const { data, isLoading, isError } = useMarketData();

  if (isError || isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-yellow-500/60 animate-pulse" />
          {isLoading ? 'Loading live market data...' : 'Market data unavailable'}
        </div>
      </div>
    );
  }

  const hbar = data!.HBAR;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-3"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Live Market</span>
          </div>
          <span className="text-[10px] text-muted-foreground">via CoinMarketCap</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <TokenCard symbol="HBAR" icon="ℏ" quote={data!.HBAR} />
          <TokenCard symbol="BTC" icon="₿" quote={data!.BTC} />
          <TokenCard symbol="ETH" icon="Ξ" quote={data!.ETH} />
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>Vol 24h: <strong className="text-foreground">{fmt(hbar.volume_24h)}</strong></span>
          <span>MCap: <strong className="text-foreground">{fmt(hbar.market_cap)}</strong></span>
          <span>7d: <PctBadge value={hbar.percent_change_7d} /></span>
        </div>
      </div>
    </motion.div>
  );
}
