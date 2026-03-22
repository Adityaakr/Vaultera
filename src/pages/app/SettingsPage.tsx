import { useState } from 'react';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';
import { shortenAddress } from '@/lib/wallet';
import { HEDERA_TESTNET, HBAR_PRICE_USD } from '@/config/hedera';
import { USDC_ADDRESS, VAUSD_ADDRESS, VAULT_ADDRESSES } from '@/config/contracts';
import { VAULT_META } from '@/config/vaults';
import { getUSDCContract, getVaUSDContract } from '@/lib/contracts';
import { useUSDCBalance } from '@/hooks/useUSDC';
import { useVaUSDBalance } from '@/hooks/useVaUSD';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['usdc-balance'] });
  qc.invalidateQueries({ queryKey: ['vausd-balance'] });
  qc.invalidateQueries({ queryKey: ['portfolio'] });
}

export default function SettingsPage() {
  const { address, isConnected, isCorrectNetwork, signer, connect, disconnect } = useWallet();
  const { data: usdcBalance } = useUSDCBalance();
  const { data: vausdBalance } = useVaUSDBalance();
  const { data: portfolio } = usePortfolio();
  const queryClient = useQueryClient();

  const [usdcMintAmt, setUsdcMintAmt] = useState('10000');
  const [vausdMintAmt, setVausdMintAmt] = useState('10000');
  const [wrapAmt, setWrapAmt] = useState('');
  const [mintingUsdc, setMintingUsdc] = useState(false);
  const [mintingVausd, setMintingVausd] = useState(false);
  const [wrapping, setWrapping] = useState(false);

  const hbarBalance = portfolio?.hbarBalance ?? 0;
  const hbarUSD = hbarBalance * HBAR_PRICE_USD;
  const usdcUSD = usdcBalance ?? 0;
  const vausdUSD = vausdBalance ?? 0;
  const positionsUSD = portfolio?.positions.reduce((s, p) => s + p.value, 0) ?? 0;
  const totalUSD = hbarUSD + usdcUSD + vausdUSD + positionsUSD;

  async function handleMintUSDC() {
    if (!signer) return;
    const num = Number(usdcMintAmt);
    if (num <= 0) { toast.error('Enter a positive amount'); return; }
    setMintingUsdc(true);
    try {
      const contract = getUSDCContract(signer);
      const tx = await contract.mint(ethers.parseEther(String(num)), { gasLimit: 500_000 });
      toast.info(`Minting ${num.toLocaleString()} USDC...`);
      await tx.wait();
      toast.success(`Minted ${num.toLocaleString()} USDC!`);
      invalidateAll(queryClient);
    } catch (err: any) {
      toast.error(err?.reason || err?.message || 'Mint failed');
    } finally {
      setMintingUsdc(false);
    }
  }

  async function handleMintVaUSD() {
    if (!signer) return;
    const num = Number(vausdMintAmt);
    if (num <= 0) { toast.error('Enter a positive amount'); return; }
    setMintingVausd(true);
    try {
      const contract = getVaUSDContract(signer);
      const tx = await contract.mint(ethers.parseEther(String(num)), { gasLimit: 500_000 });
      toast.info(`Minting ${num.toLocaleString()} vaUSD...`);
      await tx.wait();
      toast.success(`Minted ${num.toLocaleString()} vaUSD!`);
      invalidateAll(queryClient);
    } catch (err: any) {
      toast.error(err?.reason || err?.message || 'Mint failed');
    } finally {
      setMintingVausd(false);
    }
  }

  async function handleWrapUSDC() {
    if (!signer) return;
    const num = Number(wrapAmt);
    if (num <= 0) { toast.error('Enter a positive amount'); return; }
    setWrapping(true);
    try {
      const usdcContract = getUSDCContract(signer);
      const vausdContract = getVaUSDContract(signer);
      const amountWei = ethers.parseEther(String(num));

      toast.info('Approving USDC...');
      const approveTx = await usdcContract.approve(VAUSD_ADDRESS, amountWei, { gasLimit: 500_000 });
      await approveTx.wait();

      toast.info('Wrapping USDC → vaUSD...');
      const tx = await vausdContract.depositUSDC(amountWei, { gasLimit: 500_000 });
      await tx.wait();
      toast.success(`Wrapped ${num.toLocaleString()} USDC → vaUSD!`);
      setWrapAmt('');
      invalidateAll(queryClient);
    } catch (err: any) {
      toast.error(err?.reason || err?.message || 'Wrap failed');
    } finally {
      setWrapping(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage tokens, wallet, and preferences</p>
      </div>

      {/* Balance Section */}
      {isConnected && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-foreground">Balances</h3>
            <span className="text-lg font-bold tabular-nums text-foreground">${totalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <BalanceCard symbol="HBAR" label="Hedera" balance={hbarBalance} usdValue={hbarUSD} />
            <BalanceCard symbol="USDC" label="USD Coin" balance={usdcBalance ?? 0} usdValue={usdcUSD} />
            <BalanceCard symbol="vaUSD" label="Vaultera USD" balance={vausdBalance ?? 0} usdValue={vausdUSD} />
          </div>
          {(portfolio?.positions ?? []).length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">LP Positions</p>
              {(portfolio?.positions ?? []).map(p => {
                const meta = VAULT_META[p.vaultId];
                return (
                  <div key={p.vaultId} className="flex items-center justify-between rounded-xl bg-secondary p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">LP</div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{meta?.symbol ?? p.vaultId}</p>
                        <p className="text-[10px] text-muted-foreground">{meta?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold tabular-nums text-foreground">{p.shares.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">${p.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mint Test Tokens */}
      <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-premium ring-1 ring-primary/5">
        <h3 className="font-display text-base font-semibold text-foreground">Mint Test Tokens</h3>
        <p className="mt-1 text-xs text-muted-foreground">Mint any amount of test stablecoins on Hedera Testnet (100M max supply)</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <MintCard symbol="USDC" label="Standard stablecoin" balance={usdcBalance ?? 0}
            amount={usdcMintAmt} onAmountChange={setUsdcMintAmt}
            onMint={handleMintUSDC} minting={mintingUsdc} disabled={!isConnected} primary />
          <MintCard symbol="vaUSD" label="Yield-bearing stablecoin" balance={vausdBalance ?? 0}
            amount={vausdMintAmt} onAmountChange={setVausdMintAmt}
            onMint={handleMintVaUSD} minting={mintingVausd} disabled={!isConnected} />
        </div>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">No cooldown · 100M max supply per token · Hedera Testnet</p>
      </div>

      {/* Wrap USDC → vaUSD */}
      {isConnected && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
          <h3 className="font-display text-base font-semibold text-foreground">Wrap USDC → vaUSD</h3>
          <p className="mt-1 text-xs text-muted-foreground">Convert USDC to yield-bearing vaUSD at 1:1. You can redeem anytime.</p>
          <div className="mt-4 flex gap-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">USDC Amount</label>
                <button onClick={() => setWrapAmt(String(Math.floor(usdcBalance ?? 0)))}
                  className="text-[10px] text-primary hover:underline">Max: {(usdcBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</button>
              </div>
              <input type="number" min="0" step="1" placeholder="1000" value={wrapAmt}
                onChange={e => setWrapAmt(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <button onClick={handleWrapUSDC} disabled={wrapping || !wrapAmt || Number(wrapAmt) <= 0}
              className="self-end rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-premium-md transition-all hover:bg-verdant-hover disabled:opacity-50">
              {wrapping ? 'Wrapping...' : 'Wrap'}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">You receive 1 vaUSD for every 1 USDC wrapped. vaUSD is also auto-minted when you deposit USDC into vaults.</p>
        </div>
      )}

      {/* Wallet & Account */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground">Wallet & Account</h3>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary p-4">
          {isConnected ? (
            <>
              <div>
                <p className="text-sm font-medium text-foreground">{shortenAddress(address!)}</p>
                <p className="text-xs text-muted-foreground">
                  {isCorrectNetwork ? `Connected to ${HEDERA_TESTNET.name}` : 'Wrong network — please switch'}
                </p>
              </div>
              <button onClick={disconnect} className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                Disconnect
              </button>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-foreground">No wallet connected</p>
                <p className="text-xs text-muted-foreground">Connect your wallet to start</p>
              </div>
              <button onClick={connect} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-verdant-hover transition-colors">
                Connect Wallet
              </button>
            </>
          )}
        </div>
      </div>

      {/* Network */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-premium">
        <h3 className="font-display text-base font-semibold text-foreground">Network</h3>
        <div className="mt-4 space-y-2">
          <InfoRow label="Network" value={HEDERA_TESTNET.name} />
          <InfoRow label="Chain ID" value={String(HEDERA_TESTNET.chainId)} />
          <InfoRow label="HBAR Price" value="$0.089 (static)" />
          <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
            <span className="text-sm text-foreground">Explorer</span>
            <a href={HEDERA_TESTNET.explorerUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary hover:underline">HashScan</a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BalanceCard({ symbol, label, balance, usdValue }: { symbol: string; label: string; balance: number; usdValue: number }) {
  return (
    <div className="rounded-xl bg-secondary p-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{symbol.slice(0, 2)}</div>
        <div>
          <p className="text-sm font-semibold text-foreground">{symbol}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums text-foreground">{balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
      <p className="text-xs text-muted-foreground tabular-nums">${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
    </div>
  );
}

function MintCard({ symbol, label, balance, amount, onAmountChange, onMint, minting, disabled, primary }: {
  symbol: string; label: string; balance: number; amount: string; onAmountChange: (v: string) => void;
  onMint: () => void; minting: boolean; disabled: boolean; primary?: boolean;
}) {
  return (
    <div className="rounded-xl bg-secondary p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{symbol}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <span className="text-sm font-bold tabular-nums text-foreground">{balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
      </div>
      <input type="number" min="1" step="1000" placeholder="10000" value={amount}
        onChange={e => onAmountChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold tabular-nums text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30" />
      <button onClick={onMint} disabled={minting || disabled}
        className={`mt-2 w-full rounded-lg py-2 text-sm font-semibold transition-all disabled:opacity-50 ${
          primary ? 'bg-primary text-primary-foreground hover:bg-verdant-hover' : 'bg-card border border-border text-foreground hover:bg-muted'
        }`}>
        {minting ? 'Minting...' : `Mint ${symbol}`}
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-secondary p-3">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-sm font-medium text-muted-foreground">{value}</span>
    </div>
  );
}
