import type { RiskLevel, VaultStatus } from '@/data/types';

export interface VaultMeta {
  id: string;
  name: string;
  symbol: string;
  strategy: string;
  category: string;
  riskLevel: RiskLevel;
  riskScore: number;
  managingAgentId: string;
  status: VaultStatus;
  allocation: { asset: string; percentage: number }[];
  createdAt: string;
}

export const VAULT_META: Record<string, VaultMeta> = {
  'vault-1': {
    id: 'vault-1',
    name: 'HBAR Treasury Core',
    symbol: 'vaHBAR',
    strategy: 'Conservative treasury management with diversified HBAR yield',
    category: 'Treasury',
    riskLevel: 'low',
    riskScore: 12,
    managingAgentId: 'agent-1',
    status: 'active',
    allocation: [
      { asset: 'HBAR', percentage: 45 },
      { asset: 'USDC', percentage: 30 },
      { asset: 'HBARX', percentage: 15 },
      { asset: 'DAI', percentage: 10 },
    ],
    createdAt: '2024-03-15',
  },
  'vault-2': {
    id: 'vault-2',
    name: 'StableFlow Income',
    symbol: 'vaSFI',
    strategy: 'Optimized stablecoin yield across lending protocols',
    category: 'Stable Yield',
    riskLevel: 'low',
    riskScore: 8,
    managingAgentId: 'agent-3',
    status: 'active',
    allocation: [
      { asset: 'USDC', percentage: 50 },
      { asset: 'DAI', percentage: 30 },
      { asset: 'USDT', percentage: 20 },
    ],
    createdAt: '2024-02-20',
  },
  'vault-3': {
    id: 'vault-3',
    name: 'Momentum Alpha',
    symbol: 'vaMALPHA',
    strategy: 'Trend-following HBAR momentum with dynamic position sizing',
    category: 'HBAR Momentum',
    riskLevel: 'high',
    riskScore: 62,
    managingAgentId: 'agent-2',
    status: 'active',
    allocation: [
      { asset: 'HBAR', percentage: 65 },
      { asset: 'HBARX', percentage: 20 },
      { asset: 'USDC', percentage: 15 },
    ],
    createdAt: '2024-04-10',
  },
};
