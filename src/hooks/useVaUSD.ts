import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/contexts/WalletContext';
import { readTokenBalance } from '@/lib/contracts';
import { VAUSD_ADDRESS } from '@/config/contracts';

export function useVaUSDBalance() {
  const { address, isConnected } = useWallet();
  return useQuery({
    queryKey: ['vausd-balance', address],
    queryFn: () => readTokenBalance(VAUSD_ADDRESS, address!),
    enabled: isConnected && !!address,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
