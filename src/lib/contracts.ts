import { ethers } from 'ethers';
import { HEDERA_TESTNET, ERC20_ABI, VAUSD_ABI, VAULT_V2_ABI, STRATEGY_ABI, ARENA_ABI } from '@/config/hedera';
import { VAULT_ADDRESSES, USDC_ADDRESS, VAUSD_ADDRESS, STRATEGY_ADDRESSES, ARENA_ADDRESS } from '@/config/contracts';

let _readProvider: ethers.JsonRpcProvider | null = null;

export function getReadProvider(): ethers.JsonRpcProvider {
  if (!_readProvider) {
    _readProvider = new ethers.JsonRpcProvider(HEDERA_TESTNET.rpcUrl, HEDERA_TESTNET.chainId);
  }
  return _readProvider;
}

export function getUSDCContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signerOrProvider ?? getReadProvider());
}

export function getVaUSDContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(VAUSD_ADDRESS, VAUSD_ABI, signerOrProvider ?? getReadProvider());
}

export function getVaultContract(vaultId: string, signerOrProvider?: ethers.Signer | ethers.Provider) {
  const address = VAULT_ADDRESSES[vaultId];
  if (!address) throw new Error(`Unknown vault: ${vaultId}`);
  return new ethers.Contract(address, VAULT_V2_ABI, signerOrProvider ?? getReadProvider());
}

export function getStrategyContract(address: string, signerOrProvider?: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, STRATEGY_ABI, signerOrProvider ?? getReadProvider());
}

export function getArenaContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(ARENA_ADDRESS, ARENA_ABI, signerOrProvider ?? getReadProvider());
}

export interface VaultOnChainData {
  tvl: number;
  idleBalance: number;
  supply: number;
  totalInStrategies: number;
  name: string;
  symbol: string;
}

export async function readVaultOnChain(vaultId: string): Promise<VaultOnChainData> {
  const contract = getVaultContract(vaultId);
  const [tvl, idle, totalSupply, inStrategies, name, symbol] = await Promise.all([
    contract.tvl(),
    contract.idleBalance(),
    contract.totalSupply(),
    contract.totalInStrategies(),
    contract.name(),
    contract.symbol(),
  ]);
  return {
    tvl: Number(ethers.formatEther(tvl)),
    idleBalance: Number(ethers.formatEther(idle)),
    supply: Number(ethers.formatEther(totalSupply)),
    totalInStrategies: Number(ethers.formatEther(inStrategies)),
    name,
    symbol,
  };
}

export async function readUserShares(vaultId: string, userAddress: string): Promise<number> {
  const contract = getVaultContract(vaultId);
  const bal = await contract.balanceOf(userAddress);
  return Number(ethers.formatEther(bal));
}

export async function readTokenBalance(tokenAddress: string, userAddress: string): Promise<number> {
  const contract = new ethers.Contract(tokenAddress, ERC20_ABI, getReadProvider());
  const bal = await contract.balanceOf(userAddress);
  return Number(ethers.formatEther(bal));
}

export async function readStrategyAllocation(vaultId: string, strategyAddress: string): Promise<number> {
  const contract = getVaultContract(vaultId);
  const bal = await contract.strategyDeposits(strategyAddress);
  return Number(ethers.formatEther(bal));
}
