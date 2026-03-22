import { useQuery } from '@tanstack/react-query';
import { HEDERA_TESTNET } from '@/config/hedera';
import { HCS_TOPIC_IDS } from '@/config/contracts';

export interface HCSMessage {
  sequenceNumber: number;
  timestamp: string;
  agent: string;
  vault: string;
  cycle: number;
  actions: { type: string; strategy: string; amount: number; reason: string }[];
  arena: { enter: boolean; stake: number; position: string } | null;
  summary: string;
}

async function fetchHCSMessages(topicId: string): Promise<HCSMessage[]> {
  if (!topicId) return [];

  const res = await fetch(
    `${HEDERA_TESTNET.mirrorUrl}/api/v1/topics/${topicId}/messages?order=desc&limit=20`
  );
  if (!res.ok) return [];

  const data = await res.json();
  const messages: HCSMessage[] = [];

  for (const msg of data.messages ?? []) {
    try {
      const decoded = atob(msg.message);
      const parsed = JSON.parse(decoded);
      messages.push({
        sequenceNumber: msg.sequence_number,
        timestamp: msg.consensus_timestamp,
        ...parsed,
      });
    } catch {
      // skip malformed messages
    }
  }

  return messages;
}

export function useHCSLogs(agentId: string | undefined) {
  const topicId = agentId ? HCS_TOPIC_IDS[agentId] : undefined;
  return useQuery({
    queryKey: ['hcs-logs', topicId],
    queryFn: () => fetchHCSMessages(topicId!),
    enabled: !!topicId,
    staleTime: 3_000,
    refetchInterval: 5_000,
  });
}
