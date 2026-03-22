import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/contexts/WalletContext';
import { readTokenBalance } from '@/lib/contracts';
import { USDC_ADDRESS } from '@/config/contracts';

export function useUSDCBalance() {
  const { address, isConnected } = useWallet();
  return useQuery({
    queryKey: ['usdc-balance', address],
    queryFn: () => readTokenBalance(USDC_ADDRESS, address!),
    enabled: isConnected && !!address,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
