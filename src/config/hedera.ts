export const HEDERA_TESTNET = {
  chainId: 296,
  chainIdHex: '0x128',
  name: 'Hedera Testnet',
  rpcUrl: import.meta.env.VITE_HEDERA_RPC_URL || 'https://testnet.hashio.io/api',
  mirrorUrl: import.meta.env.VITE_HEDERA_MIRROR_URL || 'https://testnet.mirrornode.hedera.com',
  explorerUrl: 'https://hashscan.io/testnet',
  currency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
};

export const HBAR_PRICE_USD = 0.089;

export const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function mint(uint256 amount) external',
] as const;

export const VAUSD_ABI = [
  ...ERC20_ABI,
  'function depositUSDC(uint256 amount) external',
  'function redeemForUSDC(uint256 amount) external',
  'function mintFor(address to, uint256 amount) external',
  'function usdc() view returns (address)',
] as const;

export const VAULT_V2_ABI = [
  'function deposit(uint256 usdcAmount, uint256 vausdAmount) external payable',
  'function withdraw(uint256 shares, uint8 tokenChoice) external',
  'function tvl() view returns (uint256)',
  'function idleBalance() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function totalHbarWei() view returns (uint256)',
  'function totalInStrategies() view returns (uint256)',
  'function strategyDeposits(address) view returns (uint256)',
  'function strategyBalance(address) view returns (uint256)',
  'function getStrategies() view returns (address[])',
  'function usdc() view returns (address)',
  'function vausd() view returns (address)',
  'function agent() view returns (address)',
  'function owner() view returns (address)',
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'event Deposited(address indexed user, uint256 usdValue, uint256 shares)',
  'event Withdrawn(address indexed user, uint256 shares, uint256 usdValue)',
  'event StrategyAllocated(address indexed strategy, uint256 amount)',
  'event StrategyDeallocated(address indexed strategy, uint256 amount)',
  'event ArenaEntered(address indexed arena, uint256 roundId, uint256 stake)',
  'event AgentAction(address indexed agent, string action, string reason)',
] as const;

export const STRATEGY_ABI = [
  'function name() view returns (string)',
  'function totalDeposits() view returns (uint256)',
  'function vaultDeposits(address) view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
] as const;

export const ARENA_ABI = [
  'function roundCount() view returns (uint256)',
  'function getRound(uint256) view returns (address vaultA, address vaultB, uint256 stakeA, uint256 stakeB, string positionA, string positionB, uint8 status, address winner, uint256 payout)',
  'function protocolFees() view returns (uint256)',
  'event RoundOpened(uint256 indexed roundId, address indexed vaultA, uint256 stake, string position)',
  'event RoundAccepted(uint256 indexed roundId, address indexed vaultB, uint256 stake, string position)',
  'event RoundResolved(uint256 indexed roundId, address indexed winner, uint256 payout)',
] as const;
