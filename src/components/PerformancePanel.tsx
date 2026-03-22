import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { VaultPerf, PerfSnapshot } from '@/hooks/usePerformanceHistory';

function fmtUSD(v: number, decimals = 0): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(decimals > 0 ? decimals : 1)}K`;
  if (v > 0) return `$${v.toFixed(decimals)}`;
  return '$0';
}

function fmtPct(v: number, dp = 4): string {
  const sign = v >= 0 ? '+' : '';
  return `${sign}${v.toFixed(dp)}%`;
}

function TickingCounter({ value, prefix = '$', suffix = '', decimals = 2, locale = true }: { value: number; prefix?: string; suffix?: string; decimals?: number; locale?: boolean }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const dur = 800;
    const start = display;
    const diff = value - start;
    if (Math.abs(diff) < 1e-12) { setDisplay(value); return; }
    const t0 = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(start + diff * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const formatted = locale
    ? display.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : display.toFixed(decimals);
  return <span className="tabular-nums">{prefix}{formatted}{suffix}</span>;
}

function Sparkline({ data, width = 320, height = 80 }: { data: PerfSnapshot[]; width?: number; height?: number }) {
  const { path, areaPath, isUp, lastY } = useMemo(() => {
    if (data.length < 2) return { path: '', areaPath: '', isUp: true, lastY: height / 2 };
    const tvls = data.map(d => d.tvl);
    const min = Math.min(...tvls);
    const max = Math.max(...tvls);
    const range = max - min || 1;
    const pad = 6;

    let p = '';
    let ly = 0;
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * width;
      const y = height - pad - ((data[i].tvl - min) / range) * (height - pad * 2);
      p += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)} `;
      ly = y;
    }
    return {
      path: p,
      areaPath: `${p} L${width},${height} L0,${height} Z`,
      isUp: tvls[tvls.length - 1] >= tvls[0],
      lastY: ly,
    };
  }, [data, width, height]);

  const color = isUp ? 'hsl(142,69%,38%)' : 'hsl(0,72%,51%)';

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-[10px] text-muted-foreground/40 italic" style={{ width, height }}>
        Building chart…
      </div>
    );
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${isUp}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${isUp})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={lastY} r="3" fill={color}>
        <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

interface Props {
  perf: VaultPerf;
  vault: { apy7d: number; apy30d: number; apy90d: number };
}

export function PerformancePanel({ perf, vault }: Props) {
  const elapsed = perf.history.length > 1
    ? Math.round((perf.history[perf.history.length - 1].ts - perf.history[0].ts) / 1000)
    : 0;
  const elapsedLabel = elapsed >= 3600
    ? `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`
    : elapsed >= 60
      ? `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`
      : `${elapsed}s`;

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-premium">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 bg-secondary/20">
        <h3 className="font-display text-base font-semibold text-foreground">Live Performance</h3>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Live
          </span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">{perf.history.length} pts · {elapsedLabel}</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Top: Sparkline + Live counter */}
        <div className="flex gap-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-2xl font-bold text-foreground">
                <TickingCounter value={perf.current.tvl} />
              </p>
              <span className={cn("text-sm font-semibold tabular-nums", perf.return1h >= 0 ? 'text-primary' : 'text-destructive')}>
                {fmtPct(perf.return1h, 5)}
              </span>
            </div>
            <div className="rounded-lg bg-secondary/30 p-2.5">
              <Sparkline data={perf.history} width={340} height={80} />
            </div>
            <div className="flex items-center justify-between mt-1.5 px-1">
              <span className="text-[9px] text-muted-foreground/40 tabular-nums">{elapsedLabel} ago</span>
              <span className="text-[9px] text-muted-foreground/40">now</span>
            </div>
          </div>

          {/* Right stats */}
          <div className="w-40 shrink-0 space-y-3">
            <div className="rounded-lg bg-primary/5 p-3">
              <p className="text-[10px] text-primary uppercase tracking-wide font-medium mb-0.5">Earning / Hour</p>
              <p className="text-lg font-bold text-primary tabular-nums">
                <TickingCounter value={perf.earningPerHour} decimals={4} />
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Deployed</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{fmtUSD(perf.current.deployed, 1)}</p>
              <div className="mt-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(perf.current.utilization, 100)}%` }} />
              </div>
              <p className="text-[9px] text-muted-foreground tabular-nums mt-0.5">{perf.current.utilization.toFixed(1)}% of TVL</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Idle</p>
              <p className="text-sm font-semibold text-accent tabular-nums">{fmtUSD(perf.current.idle)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Session Yield</p>
              <p className="text-sm font-bold text-primary tabular-nums">
                <TickingCounter value={perf.totalYieldAccrued} prefix="+$" decimals={4} />
              </p>
            </div>
          </div>
        </div>

        {/* Strategy breakdown */}
        {perf.strategyBreakdown.length > 0 && perf.strategyBreakdown.some(s => s.amount > 0) && (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Strategy Allocation</p>
            <div className="grid grid-cols-3 gap-2">
              {perf.strategyBreakdown.filter(s => s.amount > 0).map(s => (
                <div key={s.name} className="rounded-lg bg-secondary/40 px-3 py-2">
                  <p className="text-[11px] font-medium text-foreground">{s.name}</p>
                  <p className="text-sm font-bold tabular-nums text-foreground">{fmtUSD(s.amount)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground tabular-nums">{s.pct.toFixed(1)}%</span>
                    <span className="text-[10px] text-primary font-medium tabular-nums">{s.apy.toFixed(1)}% APY</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Return cards */}
        <div className="grid grid-cols-5 gap-2">
          <ReturnCard label="10m" value={perf.return10m} dollarValue={perf.dollarReturn10m} live />
          <ReturnCard label="Session" value={perf.return1h} dollarValue={perf.dollarReturnSession} live />
          <ReturnCard label="7d" value={vault.apy7d} />
          <ReturnCard label="30d" value={vault.apy30d} />
          <ReturnCard label="90d" value={vault.apy90d} />
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 pt-1 border-t border-border/30">
          <Stat label="Blended APY" value={`${perf.yieldRate.toFixed(2)}%`} accent />
          <Stat label="Yield/sec" value={`$${perf.yieldPerSec.toFixed(6)}`} />
          <Stat label="Agent" value={perf.agentName} />
          <div className="flex-1" />
          <span className="text-[9px] text-muted-foreground/40 tabular-nums">1s tick · 15s on-chain poll</span>
        </div>
      </div>
    </div>
  );
}

function ReturnCard({ label, value, dollarValue, live }: { label: string; value: number; dollarValue?: number; live?: boolean }) {
  const pos = value >= 0;
  const dollarPos = (dollarValue ?? 0) >= 0;
  return (
    <div className="rounded-lg bg-secondary/40 p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-0.5">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        {live && <span className="h-1 w-1 rounded-full bg-primary animate-pulse" />}
      </div>
      {live && dollarValue !== undefined ? (
        <>
          <p className={cn("text-sm font-bold", dollarPos ? 'text-primary' : 'text-destructive')}>
            <TickingCounter value={Math.abs(dollarValue)} prefix={dollarPos ? '+$' : '-$'} decimals={6} />
          </p>
          <p className={cn("text-[10px] mt-0.5", pos ? 'text-primary/70' : 'text-destructive/70')}>
            <TickingCounter value={Math.abs(value)} prefix={pos ? '+' : '-'} suffix="%" decimals={7} locale={false} />
          </p>
        </>
      ) : (
        <p className={cn("text-sm font-bold", pos ? 'text-primary' : 'text-destructive')}>
          {fmtPct(value, 3)}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[9px] text-muted-foreground">{label}</p>
      <p className={cn("text-xs font-semibold tabular-nums", accent ? 'text-primary' : 'text-foreground')}>{value}</p>
    </div>
  );
}
