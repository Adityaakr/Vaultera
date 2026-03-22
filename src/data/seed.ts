import { Vault, Agent, Activity } from './types';

export const agents: Agent[] = [
  {
    id: 'agent-1', name: 'Atlas', style: 'Conservative Macro', strategy: 'Multi-factor risk parity with dynamic hedging across yield-bearing assets',
    confidence: 94, reactionSpeed: '< 200ms', riskProfile: 'low', specialties: ['Treasury Management', 'Yield Optimization', 'Risk Parity'],
    status: 'monitoring', trustScore: 97, return7d: 1.2, return30d: 4.8, return90d: 14.2, sharpeRatio: 2.41, maxDrawdown: -1.8,
    capitalManaged: 842_000_000, followers: 12_400, actionsCount: 34_201, vaultsManaged: ['vault-1', 'vault-6'],
    explanation: 'Atlas prioritizes capital preservation with consistent yield generation through diversified exposure and dynamic rebalancing.',
    recentActions: ['Rebalanced HBAR allocation +2.4%', 'Harvested staking yield $12.4K', 'Reduced exposure to volatile pairs'],
    avatar: 'A',
  },
  {
    id: 'agent-2', name: 'Meridian', style: 'Dynamic Momentum', strategy: 'Trend-following with mean-reversion overlays on liquid Hedera assets',
    confidence: 89, reactionSpeed: '< 150ms', riskProfile: 'moderate', specialties: ['Momentum Trading', 'Trend Analysis', 'Liquidity Routing'],
    status: 'executing', trustScore: 92, return7d: 2.8, return30d: 8.1, return90d: 22.7, sharpeRatio: 1.98, maxDrawdown: -4.2,
    capitalManaged: 621_000_000, followers: 9_800, actionsCount: 28_744, vaultsManaged: ['vault-5', 'vault-7'],
    explanation: 'Meridian captures directional moves in trending markets while using mean-reversion signals to manage drawdown risk.',
    recentActions: ['Rotated into HBAR momentum position', 'Trimmed stablecoin overweight', 'Executed hedging strategy'],
    avatar: 'M',
  },
  {
    id: 'agent-3', name: 'Vanta', style: 'Institutional Grade', strategy: 'Multi-asset allocation with institutional risk controls and compliance guardrails',
    confidence: 96, reactionSpeed: '< 300ms', riskProfile: 'low', specialties: ['Institutional Compliance', 'Multi-Asset', 'Risk Management'],
    status: 'monitoring', trustScore: 98, return7d: 0.9, return30d: 3.6, return90d: 11.4, sharpeRatio: 2.67, maxDrawdown: -1.1,
    capitalManaged: 1_240_000_000, followers: 18_200, actionsCount: 41_098, vaultsManaged: ['vault-3', 'vault-8'],
    explanation: 'Vanta operates with institutional-grade controls, maintaining strict compliance while optimizing risk-adjusted returns.',
    recentActions: ['Compliance check passed', 'Adjusted allocation within policy bands', 'Generated quarterly report'],
    avatar: 'V',
  },
  {
    id: 'agent-4', name: 'Sigma', style: 'Quantitative Alpha', strategy: 'Statistical arbitrage with machine learning signal generation',
    confidence: 87, reactionSpeed: '< 100ms', riskProfile: 'moderate', specialties: ['Statistical Arbitrage', 'ML Signals', 'High Frequency'],
    status: 'executing', trustScore: 88, return7d: 3.4, return30d: 11.2, return90d: 28.9, sharpeRatio: 1.82, maxDrawdown: -5.8,
    capitalManaged: 445_000_000, followers: 7_600, actionsCount: 52_341, vaultsManaged: ['vault-4', 'vault-9'],
    explanation: 'Sigma leverages quantitative models and ML-driven signals to identify statistical mispricings across Hedera markets.',
    recentActions: ['Detected arbitrage opportunity', 'Executed 14 micro-trades', 'Updated ML model weights'],
    avatar: 'S',
  },
  {
    id: 'agent-5', name: 'Echo', style: 'Adaptive Yield', strategy: 'Dynamic yield farming with risk-adjusted rotation across lending protocols',
    confidence: 91, reactionSpeed: '< 250ms', riskProfile: 'low', specialties: ['Yield Farming', 'Lending Optimization', 'Protocol Selection'],
    status: 'monitoring', trustScore: 94, return7d: 1.5, return30d: 5.9, return90d: 16.8, sharpeRatio: 2.23, maxDrawdown: -2.1,
    capitalManaged: 578_000_000, followers: 10_500, actionsCount: 26_891, vaultsManaged: ['vault-2', 'vault-10'],
    explanation: 'Echo continuously rotates capital across the highest-yielding lending protocols while maintaining strict risk bounds.',
    recentActions: ['Rotated yield to new protocol', 'Harvested $8.2K in rewards', 'Updated risk parameters'],
    avatar: 'E',
  },
  {
    id: 'agent-6', name: 'Halcyon', style: 'Stable Income', strategy: 'Conservative stablecoin yield with minimal volatility exposure',
    confidence: 95, reactionSpeed: '< 400ms', riskProfile: 'low', specialties: ['Stablecoin Management', 'Income Generation', 'Capital Preservation'],
    status: 'idle', trustScore: 96, return7d: 0.6, return30d: 2.4, return90d: 7.8, sharpeRatio: 3.12, maxDrawdown: -0.4,
    capitalManaged: 389_000_000, followers: 6_200, actionsCount: 12_455, vaultsManaged: ['vault-2'],
    explanation: 'Halcyon focuses on delivering stable, predictable income with near-zero drawdown through conservative stablecoin strategies.',
    recentActions: ['Compounded yield earnings', 'Verified collateral ratios', 'Maintained allocation within 0.1% of target'],
    avatar: 'H',
  },
  {
    id: 'agent-7', name: 'Nova', style: 'Growth Catalyst', strategy: 'Concentrated growth positions with momentum confirmation signals',
    confidence: 82, reactionSpeed: '< 120ms', riskProfile: 'high', specialties: ['Growth Investing', 'Momentum', 'Concentrated Positions'],
    status: 'rebalancing', trustScore: 84, return7d: 4.1, return30d: 14.6, return90d: 38.2, sharpeRatio: 1.54, maxDrawdown: -8.9,
    capitalManaged: 298_000_000, followers: 8_900, actionsCount: 19_877, vaultsManaged: ['vault-5'],
    explanation: 'Nova takes concentrated growth positions in high-conviction setups with momentum confirmation, accepting higher volatility for outsized returns.',
    recentActions: ['Increased HBAR position 15%', 'Set trailing stop loss', 'Entered new growth allocation'],
    avatar: 'N',
  },
  {
    id: 'agent-8', name: 'Flint', style: 'Event-Driven', strategy: 'Catalyst-driven positioning around protocol events, governance, and market structure changes',
    confidence: 86, reactionSpeed: '< 180ms', riskProfile: 'moderate', specialties: ['Event Analysis', 'Governance', 'Catalyst Trading'],
    status: 'monitoring', trustScore: 89, return7d: 2.2, return30d: 7.4, return90d: 19.1, sharpeRatio: 1.76, maxDrawdown: -3.7,
    capitalManaged: 334_000_000, followers: 5_400, actionsCount: 15_632, vaultsManaged: ['vault-7'],
    explanation: 'Flint identifies and positions around catalytic events — governance votes, protocol upgrades, and market structure shifts.',
    recentActions: ['Positioned for upcoming governance vote', 'Analyzed protocol upgrade impact', 'Adjusted event exposure'],
    avatar: 'F',
  },
  {
    id: 'agent-9', name: 'Prism', style: 'Multi-Strategy', strategy: 'Blended approach combining yield, momentum, and mean-reversion across market regimes',
    confidence: 90, reactionSpeed: '< 200ms', riskProfile: 'moderate', specialties: ['Multi-Strategy', 'Regime Detection', 'Portfolio Construction'],
    status: 'executing', trustScore: 91, return7d: 2.0, return30d: 6.8, return90d: 18.4, sharpeRatio: 2.05, maxDrawdown: -3.2,
    capitalManaged: 512_000_000, followers: 7_100, actionsCount: 22_456, vaultsManaged: ['vault-8', 'vault-4'],
    explanation: 'Prism blends multiple strategies and dynamically adjusts weights based on detected market regime changes.',
    recentActions: ['Shifted to defensive regime allocation', 'Rebalanced strategy weights', 'Updated regime detection model'],
    avatar: 'P',
  },
  {
    id: 'agent-10', name: 'Ion', style: 'Liquidity Specialist', strategy: 'Concentrated liquidity provision with dynamic range management',
    confidence: 88, reactionSpeed: '< 160ms', riskProfile: 'moderate', specialties: ['Liquidity Provision', 'Range Management', 'Fee Optimization'],
    status: 'monitoring', trustScore: 90, return7d: 1.8, return30d: 6.2, return90d: 17.1, sharpeRatio: 1.91, maxDrawdown: -2.9,
    capitalManaged: 267_000_000, followers: 4_800, actionsCount: 31_209, vaultsManaged: ['vault-9'],
    explanation: 'Ion specializes in concentrated liquidity strategies, dynamically adjusting price ranges to maximize fee capture while minimizing impermanent loss.',
    recentActions: ['Adjusted liquidity range +/-2%', 'Collected $6.1K in fees', 'Recentered position around market price'],
    avatar: 'I',
  },
  {
    id: 'agent-11', name: 'Delta', style: 'Hedged Returns', strategy: 'Delta-neutral strategies with systematic volatility harvesting',
    confidence: 93, reactionSpeed: '< 220ms', riskProfile: 'low', specialties: ['Delta-Neutral', 'Volatility Harvesting', 'Options-Like Strategies'],
    status: 'monitoring', trustScore: 95, return7d: 1.1, return30d: 4.2, return90d: 12.8, sharpeRatio: 2.54, maxDrawdown: -1.5,
    capitalManaged: 478_000_000, followers: 6_900, actionsCount: 18_334, vaultsManaged: ['vault-6'],
    explanation: 'Delta maintains market-neutral positioning while harvesting volatility premiums for consistent risk-adjusted returns.',
    recentActions: ['Rebalanced hedge ratios', 'Harvested volatility premium', 'Adjusted delta exposure to neutral'],
    avatar: 'D',
  },
  {
    id: 'agent-12', name: 'Solace', style: 'Capital Protection', strategy: 'Principal-protected strategies with downside insurance mechanisms',
    confidence: 97, reactionSpeed: '< 350ms', riskProfile: 'low', specialties: ['Capital Protection', 'Insurance Mechanisms', 'Downside Management'],
    status: 'idle', trustScore: 99, return7d: 0.5, return30d: 1.9, return90d: 6.2, sharpeRatio: 3.41, maxDrawdown: -0.2,
    capitalManaged: 892_000_000, followers: 14_100, actionsCount: 8_921, vaultsManaged: ['vault-1'],
    explanation: 'Solace provides the highest level of capital protection with built-in insurance mechanisms against market drawdowns.',
    recentActions: ['Renewed protection mechanism', 'Verified insurance coverage', 'Compounded protected yield'],
    avatar: 'So',
  },
  {
    id: 'agent-13', name: 'Kairo', style: 'Cross-Market', strategy: 'Cross-market correlation trading with global macro overlays',
    confidence: 85, reactionSpeed: '< 140ms', riskProfile: 'moderate', specialties: ['Cross-Market', 'Correlation Trading', 'Global Macro'],
    status: 'executing', trustScore: 87, return7d: 2.6, return30d: 8.8, return90d: 24.1, sharpeRatio: 1.88, maxDrawdown: -4.6,
    capitalManaged: 356_000_000, followers: 5_700, actionsCount: 24_567, vaultsManaged: ['vault-10'],
    explanation: 'Kairo exploits cross-market correlations and global macro signals to position capital across diverse market environments.',
    recentActions: ['Detected correlation divergence', 'Rotated cross-market exposure', 'Adjusted macro overlay'],
    avatar: 'K',
  },
  {
    id: 'agent-14', name: 'Sable', style: 'Defensive Allocation', strategy: 'All-weather portfolio construction with tail-risk hedging',
    confidence: 92, reactionSpeed: '< 280ms', riskProfile: 'low', specialties: ['All-Weather', 'Tail-Risk Hedging', 'Defensive Allocation'],
    status: 'monitoring', trustScore: 93, return7d: 1.0, return30d: 3.9, return90d: 12.1, sharpeRatio: 2.38, maxDrawdown: -1.9,
    capitalManaged: 534_000_000, followers: 8_300, actionsCount: 16_789, vaultsManaged: ['vault-3'],
    explanation: 'Sable constructs all-weather portfolios designed to perform across all market conditions with embedded tail-risk protection.',
    recentActions: ['Updated tail-risk hedge', 'Rebalanced all-weather allocation', 'Stress-tested portfolio scenarios'],
    avatar: 'Sb',
  },
];

export const vaults: Vault[] = [
  {
    id: 'vault-1', name: 'HBAR Treasury Core', strategy: 'Conservative treasury management with diversified HBAR yield', tvl: 1_420_000_000,
    apy: 6.8, apy7d: 6.2, apy30d: 6.8, apy90d: 7.1, utilization: 87, riskLevel: 'low', riskScore: 12, trustScore: 98,
    managingAgentId: 'agent-1', status: 'active', category: 'Treasury',
    allocation: [{ asset: 'HBAR', percentage: 45 }, { asset: 'USDC', percentage: 30 }, { asset: 'HBARX', percentage: 15 }, { asset: 'DAI', percentage: 10 }],
    subscribers: 8_420, createdAt: '2024-03-15',
  },
  {
    id: 'vault-2', name: 'StableFlow Income', strategy: 'Optimized stablecoin yield across lending protocols', tvl: 892_000_000,
    apy: 5.2, apy7d: 4.9, apy30d: 5.2, apy90d: 5.4, utilization: 92, riskLevel: 'low', riskScore: 8, trustScore: 97,
    managingAgentId: 'agent-5', status: 'active', category: 'Stable Yield',
    allocation: [{ asset: 'USDC', percentage: 50 }, { asset: 'DAI', percentage: 30 }, { asset: 'USDT', percentage: 20 }],
    subscribers: 6_100, createdAt: '2024-02-20',
  },
  {
    id: 'vault-3', name: 'Adaptive Credit Vault', strategy: 'Dynamic credit allocation with institutional risk controls', tvl: 678_000_000,
    apy: 8.4, apy7d: 7.9, apy30d: 8.4, apy90d: 8.8, utilization: 78, riskLevel: 'moderate', riskScore: 34, trustScore: 94,
    managingAgentId: 'agent-3', status: 'active', category: 'Dynamic Lending',
    allocation: [{ asset: 'USDC', percentage: 40 }, { asset: 'HBAR', percentage: 25 }, { asset: 'wBTC', percentage: 20 }, { asset: 'ETH', percentage: 15 }],
    subscribers: 4_200, createdAt: '2024-04-10',
  },
  {
    id: 'vault-4', name: 'Liquidity Rotation Vault', strategy: 'Active rotation across highest-yielding liquidity pools', tvl: 445_000_000,
    apy: 12.1, apy7d: 11.4, apy30d: 12.1, apy90d: 13.2, utilization: 84, riskLevel: 'moderate', riskScore: 42, trustScore: 89,
    managingAgentId: 'agent-4', status: 'rebalancing', category: 'Dynamic Lending',
    allocation: [{ asset: 'HBAR/USDC LP', percentage: 35 }, { asset: 'HBAR/ETH LP', percentage: 30 }, { asset: 'USDC/DAI LP', percentage: 20 }, { asset: 'HBAR', percentage: 15 }],
    subscribers: 3_800, createdAt: '2024-05-01',
  },
  {
    id: 'vault-5', name: 'Momentum Hedera Alpha', strategy: 'Trend-following HBAR momentum with dynamic position sizing', tvl: 312_000_000,
    apy: 18.4, apy7d: 19.2, apy30d: 18.4, apy90d: 16.8, utilization: 71, riskLevel: 'high', riskScore: 68, trustScore: 84,
    managingAgentId: 'agent-2', status: 'active', category: 'HBAR Momentum',
    allocation: [{ asset: 'HBAR', percentage: 65 }, { asset: 'HBARX', percentage: 20 }, { asset: 'USDC', percentage: 15 }],
    subscribers: 5_600, createdAt: '2024-01-15',
  },
  {
    id: 'vault-6', name: 'Conservative Carry', strategy: 'Low-volatility carry trade with delta-neutral hedging', tvl: 534_000_000,
    apy: 4.6, apy7d: 4.4, apy30d: 4.6, apy90d: 4.9, utilization: 94, riskLevel: 'low', riskScore: 6, trustScore: 99,
    managingAgentId: 'agent-11', status: 'active', category: 'Stable Yield',
    allocation: [{ asset: 'USDC', percentage: 45 }, { asset: 'DAI', percentage: 35 }, { asset: 'HBAR', percentage: 20 }],
    subscribers: 7_200, createdAt: '2024-02-01',
  },
  {
    id: 'vault-7', name: 'Event-Driven Market Vault', strategy: 'Catalyst-driven positioning around protocol and governance events', tvl: 267_000_000,
    apy: 14.8, apy7d: 13.1, apy30d: 14.8, apy90d: 15.9, utilization: 68, riskLevel: 'moderate', riskScore: 48, trustScore: 87,
    managingAgentId: 'agent-8', status: 'active', category: 'Event-Driven',
    allocation: [{ asset: 'HBAR', percentage: 40 }, { asset: 'USDC', percentage: 30 }, { asset: 'ETH', percentage: 20 }, { asset: 'wBTC', percentage: 10 }],
    subscribers: 2_900, createdAt: '2024-06-01',
  },
  {
    id: 'vault-8', name: 'Agent Curated Prime', strategy: 'Multi-agent blended allocation optimized for Sharpe ratio', tvl: 389_000_000,
    apy: 9.7, apy7d: 9.2, apy30d: 9.7, apy90d: 10.4, utilization: 82, riskLevel: 'moderate', riskScore: 38, trustScore: 92,
    managingAgentId: 'agent-9', status: 'active', category: 'Agent Curated',
    allocation: [{ asset: 'HBAR', percentage: 30 }, { asset: 'USDC', percentage: 25 }, { asset: 'ETH', percentage: 20 }, { asset: 'DAI', percentage: 15 }, { asset: 'wBTC', percentage: 10 }],
    subscribers: 4_500, createdAt: '2024-03-01',
  },
  {
    id: 'vault-9', name: 'Dynamic Income Engine', strategy: 'Active liquidity management with concentrated range strategies', tvl: 198_000_000,
    apy: 15.6, apy7d: 14.8, apy30d: 15.6, apy90d: 16.2, utilization: 76, riskLevel: 'moderate', riskScore: 44, trustScore: 88,
    managingAgentId: 'agent-10', status: 'active', category: 'Dynamic Lending',
    allocation: [{ asset: 'HBAR/USDC LP', percentage: 45 }, { asset: 'USDC', percentage: 30 }, { asset: 'HBAR', percentage: 25 }],
    subscribers: 3_100, createdAt: '2024-04-20',
  },
  {
    id: 'vault-10', name: 'Risk-Managed Growth', strategy: 'Growth-oriented allocation with systematic risk management overlays', tvl: 456_000_000,
    apy: 11.2, apy7d: 10.8, apy30d: 11.2, apy90d: 12.1, utilization: 79, riskLevel: 'moderate', riskScore: 40, trustScore: 90,
    managingAgentId: 'agent-13', status: 'active', category: 'Growth',
    allocation: [{ asset: 'HBAR', percentage: 35 }, { asset: 'ETH', percentage: 25 }, { asset: 'USDC', percentage: 20 }, { asset: 'wBTC', percentage: 10 }, { asset: 'DAI', percentage: 10 }],
    subscribers: 4_800, createdAt: '2024-01-30',
  },
];

const activityTypes: Activity['type'][] = ['rebalance', 'rotate', 'allocate', 'harvest', 'hedge', 'withdraw', 'pause', 'deposit'];
const outcomes = ['Position optimized', 'Yield harvested', 'Risk reduced', 'Allocation updated', 'Capital deployed', 'Hedge executed', 'Exposure adjusted', 'Collateral balanced'];
const reasons = [
  'Market volatility exceeded threshold', 'Yield opportunity detected', 'Rebalancing trigger activated',
  'Risk parameter breach detected', 'Correlation shift identified', 'Protocol upgrade event',
  'Governance vote positioning', 'Liquidity depth changed', 'Fee tier optimization signal',
  'Mean-reversion signal triggered', 'Momentum confirmation received', 'Drawdown protection activated',
];

export const activities: Activity[] = Array.from({ length: 220 }, (_, i) => {
  const agent = agents[i % agents.length];
  const vault = vaults[i % vaults.length];
  const type = activityTypes[i % activityTypes.length];
  const hoursAgo = Math.floor(i * 0.8);
  const date = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return {
    id: `activity-${i + 1}`,
    type,
    agentId: agent.id,
    agentName: agent.name,
    vaultId: vault.id,
    vaultName: vault.name,
    reason: reasons[i % reasons.length],
    action: `${type.charAt(0).toUpperCase() + type.slice(1)} action on ${vault.name}`,
    outcome: outcomes[i % outcomes.length],
    timestamp: date.toISOString(),
    status: i % 15 === 0 ? 'pending' : i % 23 === 0 ? 'failed' : 'completed',
    value: Math.floor(Math.random() * 500_000) + 10_000,
  };
});

export const platformMetrics = {
  totalValueAllocated: 4_800_000_000,
  autonomousTransactions: 2_100_000,
  vaultUtilization: 83,
  averageNetYield: 9.4,
  assetsUnderAgentManagement: 4_200_000_000,
  activeAllocators: 104_200,
  liveAgentSessions: 14,
  annualRevenueRunRate: 1_200_000_000,
  userGrowthRate: 12.4,
  institutionalAccounts: 312,
  systemUptime: 99.98,
};
