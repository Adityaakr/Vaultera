import { useEffect, useRef, useState, useCallback } from 'react';
import { readVaultOnChain } from '@/lib/contracts';
import { readStrategyAllocation } from '@/lib/contracts';
import { STRATEGY_ADDRESSES, VAULT_ADDRESSES } from '@/config/contracts';
import { AGENT_META } from '@/config/agents';
import { VAULT_META } from '@/config/vaults';

export interface PerfSnapshot {
  ts: number;
  tvl: number;
  idle: number;
  deployed: number;
  utilization: number;
  yieldAccrued: number;
}

export interface VaultPerf {
  vaultId: string;
  vaultName: string;
  agentName: string;
  current: PerfSnapshot;
  history: PerfSnapshot[];
  return10m: number;
  return1h: number;
  dollarReturn10m: number;
  dollarReturnSession: number;
  yieldRate: number;
  yieldPerSec: number;
  totalYieldAccrued: number;
  earningPerHour: number;
  strategyBreakdown: { name: string; amount: number; pct: number; apy: number }[];
}

const ON_CHAIN_POLL_MS = 15_000;
const TICK_MS = 1_000;
const MAX_HISTORY = 600;

const STRATEGY_APY: Record<string, number> = {
  StableLending: 0.048,
  MomentumPool: 0.081,
  YieldFarm: 0.059,
};

function yieldPerSecond(strategies: { name: string; amount: number }[]): number {
  let total = 0;
  for (const s of strategies) {
    const apy = STRATEGY_APY[s.name] ?? 0.05;
    total += (s.amount * apy) / (365.25 * 24 * 3600);
  }
  return total;
}

export function usePerformanceHistory(vaultId: string) {
  const [perf, setPerf] = useState<VaultPerf | null>(null);

  const historyRef = useRef<PerfSnapshot[]>([]);
  const baseRef = useRef<{ tvl: number; idle: number; deployed: number; strategies: { name: string; amount: number }[] } | null>(null);
  const baseTsRef = useRef(0);
  const cumulYieldRef = useRef(0);
  const startTsRef = useRef(Date.now());

  const fetchOnChain = useCallback(async () => {
    try {
      const data = await readVaultOnChain(vaultId);
      const strategies: { name: string; amount: number }[] = [];

      await Promise.all(Object.entries(STRATEGY_ADDRESSES).map(async ([name, addr]) => {
        try {
          const amt = await readStrategyAllocation(vaultId, addr);
          strategies.push({ name, amount: amt });
        } catch {
          strategies.push({ name, amount: 0 });
        }
      }));

      baseRef.current = {
        tvl: data.tvl,
        idle: data.idleBalance,
        deployed: data.totalInStrategies,
        strategies,
      };
      baseTsRef.current = Date.now();
    } catch {}
  }, [vaultId]);

  useEffect(() => {
    startTsRef.current = Date.now();
    historyRef.current = [];
    cumulYieldRef.current = 0;
    baseRef.current = null;

    fetchOnChain();
    const chainPoll = setInterval(fetchOnChain, ON_CHAIN_POLL_MS);

    const tick = setInterval(() => {
      const base = baseRef.current;
      if (!base) return;

      const yps = yieldPerSecond(base.strategies);
      const secsSinceBase = (Date.now() - baseTsRef.current) / 1000;
      const accruedSinceBase = yps * secsSinceBase;

      const liveTvl = base.tvl + accruedSinceBase;
      const liveDeployed = base.deployed + accruedSinceBase;
      const utilization = liveTvl > 0 ? (liveDeployed / liveTvl) * 100 : 0;

      cumulYieldRef.current += yps;

      const snap: PerfSnapshot = {
        ts: Date.now(),
        tvl: liveTvl,
        idle: base.idle,
        deployed: liveDeployed,
        utilization,
        yieldAccrued: cumulYieldRef.current,
      };

      const h = historyRef.current;
      h.push(snap);
      if (h.length > MAX_HISTORY) h.shift();

      const now = Date.now();
      const tenMinAgo = h.find(s => s.ts >= now - 10 * 60 * 1000) ?? h[0];
      const first = h[0];

      const dollarReturn10m = tenMinAgo ? snap.tvl - tenMinAgo.tvl : 0;
      const dollarReturnSession = first ? snap.tvl - first.tvl : 0;

      const return10m = tenMinAgo && tenMinAgo.tvl > 0
        ? ((snap.tvl - tenMinAgo.tvl) / tenMinAgo.tvl) * 100
        : 0;
      const return1h = first && first.tvl > 0
        ? ((snap.tvl - first.tvl) / first.tvl) * 100
        : 0;

      const blendedApy = base.deployed > 0
        ? base.strategies.reduce((s, st) => s + st.amount * (STRATEGY_APY[st.name] ?? 0.05), 0) / base.deployed * 100
        : 0;

      const earningPerHour = yps * 3600;
      const totalSinceStart = (now - startTsRef.current) / 1000 * yps;

      const meta = VAULT_META[vaultId];
      const agentMeta = meta ? AGENT_META[meta.managingAgentId] : null;

      const strategyBreakdown = base.strategies.map(s => ({
        name: s.name,
        amount: s.amount,
        pct: liveTvl > 0 ? (s.amount / liveTvl) * 100 : 0,
        apy: (STRATEGY_APY[s.name] ?? 0.05) * 100,
      }));

      setPerf({
        vaultId,
        vaultName: meta?.name ?? vaultId,
        agentName: agentMeta?.name ?? 'Unknown',
        current: snap,
        history: [...h],
        return10m,
        return1h,
        dollarReturn10m,
        dollarReturnSession,
        yieldRate: blendedApy,
        yieldPerSec: yps,
        totalYieldAccrued: totalSinceStart,
        earningPerHour,
        strategyBreakdown,
      });
    }, TICK_MS);

    return () => {
      clearInterval(chainPoll);
      clearInterval(tick);
    };
  }, [vaultId, fetchOnChain]);

  return perf;
}
