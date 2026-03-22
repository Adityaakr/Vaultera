import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ethers } from 'ethers';
import { connectMetaMask } from '@/lib/wallet';
import { HEDERA_TESTNET } from '@/config/hedera';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState>({
  address: null,
  isConnected: false,
  chainId: null,
  provider: null,
  signer: null,
  isCorrectNetwork: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
});

export function useWallet() {
  return useContext(WalletContext);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = !!address;
  const isCorrectNetwork = chainId === HEDERA_TESTNET.chainId;

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const result = await connectMetaMask();
      setProvider(result.provider);
      setSigner(result.signer);
      setAddress(result.address);
      setChainId(result.chainId);
    } catch (err) {
      console.error('Wallet connection failed:', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
      if (address) {
        connect();
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, connect, disconnect]);

  return (
    <WalletContext.Provider value={{
      address, isConnected, chainId, provider, signer, isCorrectNetwork, isConnecting, connect, disconnect,
    }}>
      {children}
    </WalletContext.Provider>
  );
}
