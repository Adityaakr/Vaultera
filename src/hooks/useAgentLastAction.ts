import { useQuery } from '@tanstack/react-query';
import { HEDERA_TESTNET } from '@/config/hedera';
import { HCS_TOPIC_IDS } from '@/config/contracts';

async function fetchLastAction(topicId: string): Promise<string | null> {
  if (!topicId) return null;
  try {
    const res = await fetch(
      `${HEDERA_TESTNET.mirrorUrl}/api/v1/topics/${topicId}/messages?order=desc&limit=1`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const msg = data.messages?.[0];
    if (!msg) return null;
    return msg.consensus_timestamp;
  } catch {
    return null;
  }
}

export function useAgentLastAction(agentId: string) {
  const topicId = HCS_TOPIC_IDS[agentId];
  return useQuery({
    queryKey: ['agent-last-action', agentId],
    queryFn: () => fetchLastAction(topicId),
    enabled: !!topicId,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}

export function timeAgoShort(timestamp: string | null | undefined): string {
  if (!timestamp) return 'No actions yet';
  const seconds = Math.floor(Date.now() / 1000 - Number(timestamp.split('.')[0]));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
