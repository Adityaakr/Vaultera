import { useQuery } from '@tanstack/react-query';
import { HEDERA_TESTNET } from '@/config/hedera';
import { HCS_TOPIC_IDS } from '@/config/contracts';

export interface ScheduledAction {
  agent: string;
  vault: string;
  type: string;
  strategy: string;
  amount: number;
  reason: string;
  executeAt: string;
  publishedAt: string;
  topicId: string;
  status: 'pending' | 'executed';
}

async function fetchScheduledActions(): Promise<ScheduledAction[]> {
  const actions: ScheduledAction[] = [];

  for (const [agentId, topicId] of Object.entries(HCS_TOPIC_IDS)) {
    try {
      const res = await fetch(
        `${HEDERA_TESTNET.mirrorUrl}/api/v1/topics/${topicId}/messages?order=desc&limit=10`
      );
      if (!res.ok) continue;

      const data = await res.json();
      for (const msg of data.messages ?? []) {
        try {
          const decoded = atob(msg.message);
          const parsed = JSON.parse(decoded);

          // Scheduled action announcements
          if (parsed.scheduledActions && Array.isArray(parsed.scheduledActions)) {
            for (const sa of parsed.scheduledActions) {
              actions.push({
                agent: parsed.agent,
                vault: parsed.vault,
                type: sa.type,
                strategy: sa.strategy,
                amount: sa.amount,
                reason: sa.reason,
                executeAt: sa.executeAt,
                publishedAt: parsed.timestamp,
                topicId,
                status: new Date(sa.executeAt).getTime() <= Date.now() ? 'executed' : 'pending',
              });
            }
          }

          // Execution confirmations override status
          if (parsed.type === 'schedule_executed') {
            const matching = actions.find(
              a => a.vault === parsed.vault &&
                a.strategy === parsed.action?.strategy &&
                a.status === 'pending'
            );
            if (matching) matching.status = 'executed';
          }
        } catch {
          // skip malformed
        }
      }
    } catch {
      // skip topic fetch errors
    }
  }

  actions.sort((a, b) => new Date(a.executeAt).getTime() - new Date(b.executeAt).getTime());
  return actions;
}

export function useScheduledActions() {
  return useQuery({
    queryKey: ['scheduled-actions'],
    queryFn: fetchScheduledActions,
    staleTime: 3_000,
    refetchInterval: 5_000,
  });
}
