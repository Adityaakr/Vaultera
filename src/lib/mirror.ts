import { HEDERA_TESTNET } from '@/config/hedera';

const BASE = HEDERA_TESTNET.mirrorUrl;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Mirror Node ${res.status}: ${path}`);
  return res.json();
}

export interface MirrorAccount {
  account: string;
  balance: { balance: number; tokens: { token_id: string; balance: number }[] };
  evm_address: string;
}

export interface MirrorTransaction {
  transaction_id: string;
  consensus_timestamp: string;
  name: string;
  result: string;
  transfers: { account: string; amount: number }[];
  token_transfers: { token_id: string; account: string; amount: number }[];
}

export interface MirrorContractLog {
  address: string;
  data: string;
  topics: string[];
  timestamp: string;
  transaction_hash: string;
  block_number: number;
}

export async function getAccountByEvmAddress(evmAddress: string): Promise<MirrorAccount | null> {
  try {
    const data = await get<MirrorAccount>(`/api/v1/accounts/${evmAddress}`);
    return data;
  } catch {
    return null;
  }
}

export async function getAccountBalance(evmAddress: string): Promise<number> {
  const account = await getAccountByEvmAddress(evmAddress);
  if (!account) return 0;
  return account.balance.balance / 1e8;
}

export async function getContractLogs(
  contractEvmAddress: string,
  limit = 50
): Promise<{ logs: MirrorContractLog[] }> {
  return get(`/api/v1/contracts/${contractEvmAddress}/results/logs?order=desc&limit=${limit}`);
}

export async function getTransactionsForAccount(
  accountId: string,
  limit = 25
): Promise<{ transactions: MirrorTransaction[] }> {
  return get(`/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`);
}
