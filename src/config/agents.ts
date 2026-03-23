import type { AgentStatus, RiskLevel } from '@/data/types';

export interface AgentMeta {
  id: string;
  name: string;
  style: string;
  strategy: string;
  confidence: number;
  reactionSpeed: string;
  riskProfile: RiskLevel;
  specialties: string[];
  status: AgentStatus;
  trustScore: number;
  return7d: number;
  return30d: number;
  return90d: number;
  sharpeRatio: number;
  maxDrawdown: number;
  followers: number;
  actionsCount: number;
  vaultsManaged: string[];
  explanation: string;
  recentActions: string[];
  avatar: string;
}

export const AGENT_META: Record<string, AgentMeta> = {
  'agent-1': {
    id: 'agent-1',
    name: 'Atlas',
    style: 'Conservative Macro',
    strategy: 'Multi-factor risk parity with dynamic hedging across yield-bearing assets',
    confidence: 94,
    reactionSpeed: '< 200ms',
    riskProfile: 'low',
    specialties: ['Treasury Management', 'Yield Optimization', 'Risk Parity'],
    status: 'monitoring',
    trustScore: 97,
    return7d: 3.6,
    return30d: 14.8,
    return90d: 45.2,
    sharpeRatio: 2.41,
    maxDrawdown: -1.8,
    followers: 12_400,
    actionsCount: 0,
    vaultsManaged: ['vault-1'],
    explanation: 'Atlas prioritizes capital preservation with consistent yield generation through diversified exposure and dynamic rebalancing.',
    recentActions: [],
    avatar: 'A',
  },
  'agent-2': {
    id: 'agent-2',
    name: 'Meridian',
    style: 'Dynamic Momentum',
    strategy: 'Trend-following with mean-reversion overlays on liquid Hedera assets',
    confidence: 89,
    reactionSpeed: '< 150ms',
    riskProfile: 'moderate',
    specialties: ['Momentum Trading', 'Trend Analysis', 'Liquidity Routing'],
    status: 'executing',
    trustScore: 92,
    return7d: 2.8,
    return30d: 8.1,
    return90d: 22.7,
    sharpeRatio: 1.98,
    maxDrawdown: -4.2,
    followers: 9_800,
    actionsCount: 0,
    vaultsManaged: ['vault-3'],
    explanation: 'Meridian captures directional moves in trending markets while using mean-reversion signals to manage drawdown risk.',
    recentActions: [],
    avatar: 'M',
  },
  'agent-3': {
    id: 'agent-3',
    name: 'Echo',
    style: 'Adaptive Yield',
    strategy: 'Cross-protocol yield optimization with automated compounding and risk controls',
    confidence: 91,
    reactionSpeed: '< 180ms',
    riskProfile: 'low',
    specialties: ['Yield Farming', 'Protocol Analysis', 'Auto-Compounding'],
    status: 'monitoring',
    trustScore: 95,
    return7d: 1.8,
    return30d: 5.9,
    return90d: 17.4,
    sharpeRatio: 2.15,
    maxDrawdown: -2.4,
    followers: 7_600,
    actionsCount: 0,
    vaultsManaged: ['vault-2'],
    explanation: 'Echo continuously scans yield opportunities across Hedera protocols, auto-compounding returns while maintaining strict risk boundaries.',
    recentActions: [],
    avatar: 'E',
  },
};
