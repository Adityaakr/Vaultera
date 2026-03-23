import { useQuery } from '@tanstack/react-query';

export interface TokenQuote {
  price: number;
  volume_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  market_cap: number;
}

export interface MarketData {
  HBAR: TokenQuote;
  BTC: TokenQuote;
  ETH: TokenQuote;
  lastUpdated: string;
}

function fallback(): MarketData {
  return {
    HBAR: { price: 0.19, volume_24h: 0, percent_change_1h: 0, percent_change_24h: 0, percent_change_7d: 0, market_cap: 0 },
    BTC: { price: 0, volume_24h: 0, percent_change_1h: 0, percent_change_24h: 0, percent_change_7d: 0, market_cap: 0 },
    ETH: { price: 0, volume_24h: 0, percent_change_1h: 0, percent_change_24h: 0, percent_change_7d: 0, market_cap: 0 },
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchMarketData(): Promise<MarketData> {
  const res = await fetch('/api/cmc/v1/cryptocurrency/quotes/latest?symbol=HBAR,BTC,ETH&convert=USD');
  if (!res.ok) throw new Error(`CMC ${res.status}`);
  const json = await res.json();

  const extract = (sym: string): TokenQuote => {
    const q = json.data?.[sym]?.quote?.USD;
    if (!q) return fallback().HBAR;
    return {
      price: q.price ?? 0,
      volume_24h: q.volume_24h ?? 0,
      percent_change_1h: q.percent_change_1h ?? 0,
      percent_change_24h: q.percent_change_24h ?? 0,
      percent_change_7d: q.percent_change_7d ?? 0,
      market_cap: q.market_cap ?? 0,
    };
  };

  return { HBAR: extract('HBAR'), BTC: extract('BTC'), ETH: extract('ETH'), lastUpdated: new Date().toISOString() };
}

export function useMarketData() {
  return useQuery({
    queryKey: ['market-data-cmc'],
    queryFn: fetchMarketData,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 2,
    placeholderData: fallback(),
  });
}
