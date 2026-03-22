import { useQuery } from '@tanstack/react-query';
import { VAULT_ADDRESSES, USDC_ADDRESS, VAUSD_ADDRESS } from '@/config/contracts';
import { readUserShares, readVaultOnChain, readTokenBalance } from '@/lib/contracts';
import { getAccountBalance } from '@/lib/mirror';
import { useWallet } from '@/contexts/WalletContext';

export interface Position {
  vaultId: string;
  shares: number;
  value: number;
  pnl: number;
}

async function fetchPortfolio(address: string) {
  const [hbarBalance, usdcBalance, vausdBalance] = await Promise.all([
    getAccountBalance(address),
    readTokenBalance(USDC_ADDRESS, address),
    readTokenBalance(VAUSD_ADDRESS, address),
  ]);

  const vaultIds = Object.keys(VAULT_ADDRESSES);
  const positions: Position[] = [];

  for (const vaultId of vaultIds) {
    try {
      const shares = await readUserShares(vaultId, address);
      if (shares <= 0) continue;

      const { tvl, supply } = await readVaultOnChain(vaultId);
      const value = supply > 0 ? (shares / supply) * tvl : 0;

      positions.push({ vaultId, shares, value, pnl: 0 });
    } catch {}
  }

  return { positions, hbarBalance, usdcBalance, vausdBalance };
}

export function usePortfolio() {
  const { address, isConnected } = useWallet();
  return useQuery({
    queryKey: ['portfolio', address],
    queryFn: () => fetchPortfolio(address!),
    enabled: isConnected && !!address,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
