import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { getArenaContract } from '@/lib/contracts';

export interface ArenaRound {
  id: number;
  vaultA: string;
  vaultB: string;
  stakeA: number;
  stakeB: number;
  positionA: string;
  positionB: string;
  status: number; // 0=open, 1=active, 2=resolved
  winner: string;
  payout: number;
}

async function fetchArenaRounds(): Promise<ArenaRound[]> {
  const arena = getArenaContract();
  const count = Number(await arena.roundCount());
  if (count === 0) return [];

  const rounds: ArenaRound[] = [];
  for (let i = 0; i < count; i++) {
    const r = await arena.getRound(i);
    rounds.push({
      id: i,
      vaultA: r[0],
      vaultB: r[1],
      stakeA: Number(ethers.formatEther(r[2])),
      stakeB: Number(ethers.formatEther(r[3])),
      positionA: r[4],
      positionB: r[5],
      status: Number(r[6]),
      winner: r[7],
      payout: Number(ethers.formatEther(r[8])),
    });
  }

  return rounds.reverse();
}

export function useArenaRounds() {
  return useQuery({
    queryKey: ['arena-rounds'],
    queryFn: fetchArenaRounds,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
