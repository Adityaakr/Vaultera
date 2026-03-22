export type VaultStatus = 'active' | 'paused' | 'rebalancing' | 'new';
export type AgentStatus = 'monitoring' | 'executing' | 'rebalancing' | 'paused' | 'idle';
export type RiskLevel = 'low' | 'moderate' | 'high';
export type ActivityType = 'rebalance' | 'rotate' | 'allocate' | 'harvest' | 'hedge' | 'withdraw' | 'pause' | 'deposit';

export interface Vault {
  id: string;
  name: string;
  symbol: string;
  strategy: string;
  tvl: number;
  apy: number;
  apy7d: number;
  apy30d: number;
  apy90d: number;
  utilization: number;
  riskLevel: RiskLevel;
  riskScore: number;
  trustScore: number;
  managingAgentId: string;
  status: VaultStatus;
  category: string;
  allocation: { asset: string; percentage: number }[];
  subscribers: number;
  createdAt: string;
}

export interface Agent {
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
  capitalManaged: number;
  followers: number;
  actionsCount: number;
  vaultsManaged: string[];
  explanation: string;
  recentActions: string[];
  avatar: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  agentId: string;
  agentName: string;
  agentAvatar: string;
  vaultId: string;
  vaultName: string;
  reason: string;
  action: string;
  outcome: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  value?: number;
  strategyName?: string;
  txHash?: string;
}
