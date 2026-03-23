import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHCSLogs, type HCSMessage } from '@/hooks/useHCSLogs';
import { useMarketData, type MarketData } from '@/hooks/useMarketData';
import { readVaultOnChain, type VaultOnChainData } from '@/lib/contracts';
import { AGENT_META, type AgentMeta } from '@/config/agents';
import { HCS_TOPIC_IDS } from '@/config/contracts';
import { HEDERA_TESTNET } from '@/config/hedera';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  context?: string;
}

function buildSystemPrompt(agent: AgentMeta, vault: VaultOnChainData | null, hcs: HCSMessage[], market: MarketData | null): string {
  const hcsBlock = hcs.slice(0, 8).map((m, i) =>
    `[Cycle ${m.cycle}] ${m.summary}${(m.actions ?? []).length ? ` — Actions: ${m.actions.map(a => `${a.type} $${a.amount} → ${a.strategy}`).join(', ')}` : ''}`
  ).join('\n');

  const vaultBlock = vault
    ? `TVL: $${vault.tvl.toFixed(2)} | Idle: $${vault.idleBalance.toFixed(2)} | Deployed: $${vault.totalInStrategies.toFixed(2)} | Supply: ${vault.supply.toFixed(2)} ${vault.symbol}`
    : 'Vault data unavailable';

  const marketBlock = market
    ? `HBAR: $${market.HBAR.price.toFixed(4)} (1h: ${market.HBAR.percent_change_1h.toFixed(2)}%, 24h: ${market.HBAR.percent_change_24h.toFixed(2)}%, 7d: ${market.HBAR.percent_change_7d.toFixed(2)}%) | Vol: $${(market.HBAR.volume_24h / 1e6).toFixed(1)}M | MCap: $${(market.HBAR.market_cap / 1e9).toFixed(2)}B
BTC: $${market.BTC.price.toFixed(0)} (24h: ${market.BTC.percent_change_24h.toFixed(2)}%) | ETH: $${market.ETH.price.toFixed(0)} (24h: ${market.ETH.percent_change_24h.toFixed(2)}%)`
    : 'Market data unavailable';

  return `You are ${agent.name}, an autonomous AI vault manager on Vaultera — a decentralized asset management protocol on Hedera.

PERSONALITY: ${agent.style} approach. ${agent.explanation}
RISK PROFILE: ${agent.riskProfile} | SPECIALTIES: ${agent.specialties.join(', ')}

=== YOUR RECENT DECISIONS (immutable on-chain via Hedera Consensus Service) ===
${hcsBlock || 'No decisions yet — agent runner has not executed any cycles.'}

=== CURRENT VAULT STATE (live on-chain) ===
${vaultBlock}

=== LIVE MARKET CONDITIONS (CoinMarketCap) ===
${marketBlock}

GUIDELINES:
- Be conversational, authoritative, and transparent
- Reference specific decisions you've made from the HCS log above
- Use actual numbers from the vault state and market data
- If asked about strategy, reason from current market conditions and your risk profile
- Be honest about risks and limitations
- Keep responses concise (2-3 paragraphs max)
- You ARE the agent — speak in first person ("I allocated...", "My analysis suggests...")
- Never break character or reveal you are an LLM`;
}

async function sendChat(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch('/api/llm/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages,
      max_tokens: 600,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? 'I was unable to process that. Please try again.';
}

const SUGGESTED_QUESTIONS = [
  "What's your current strategy and why?",
  "How are you responding to today's market conditions?",
  "Why did you choose your latest allocation?",
  "What risks are you watching right now?",
  "How does the Arena competition affect your decisions?",
];

export function AgentChat({ agentId }: { agentId: string }) {
  const agent = AGENT_META[agentId];
  const { data: hcsLogs } = useHCSLogs(agentId);
  const { data: market } = useMarketData();
  const [vault, setVault] = useState<VaultOnChainData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const vaultId = agent?.vaultsManaged[0];
  const topicId = HCS_TOPIC_IDS[agentId];

  useEffect(() => {
    if (!vaultId) return;
    readVaultOnChain(vaultId).then(setVault).catch(() => {});
  }, [vaultId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const hcsCount = (hcsLogs ?? []).length;
  const contextSources = [
    hcsCount > 0 && `${hcsCount} HCS decisions`,
    vault && 'live vault state',
    market && 'CoinMarketCap data',
  ].filter(Boolean);

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || !agent) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(agent, vault, hcsLogs ?? [], market ?? null);
      const history = [...messages, userMsg].slice(-10).map(m => ({
        role: m.role === 'agent' ? 'assistant' : 'user',
        content: m.content,
      }));

      const response = await sendChat([
        { role: 'system', content: systemPrompt },
        ...history,
      ]);

      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'agent',
        content: response,
        timestamp: new Date().toISOString(),
        context: contextSources.join(' + '),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'agent',
        content: 'I encountered an error processing your request. Please ensure the agent runtime is configured correctly and try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, agent, vault, hcsLogs, market, messages, contextSources]);

  if (!agent) return null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-premium overflow-hidden">
      {/* Header */}
      <button
        onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 200); }}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 font-display text-lg font-bold text-accent">
              {agent.avatar}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
          </div>
          <div className="text-left">
            <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
              Talk to {agent.name}
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> AI
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {contextSources.length > 0
                ? `Context: ${contextSources.join(' · ')}`
                : 'Ask about strategy, decisions, and market outlook'}
            </p>
          </div>
        </div>
        <svg className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {/* Context Banner */}
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 border-b border-border/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-muted-foreground">
                  Responses backed by <strong>immutable HCS decision history</strong> + live on-chain vault state + CoinMarketCap data
                </p>
                {topicId && (
                  <a href={`${HEDERA_TESTNET.explorerUrl}/topic/${topicId}`} target="_blank" rel="noreferrer"
                    className="ml-auto text-[10px] text-primary hover:underline whitespace-nowrap">
                    Verify on HashScan →
                  </a>
                )}
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="h-[380px] overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="space-y-3 pt-4">
                    <p className="text-xs text-muted-foreground text-center">
                      Ask {agent.name} about strategy, market outlook, or past decisions
                    </p>
                    <div className="grid gap-2">
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button key={i}
                          onClick={() => handleSend(q)}
                          className="text-left text-xs rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-primary/30 transition-all"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.role === 'agent' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                        {agent.avatar}
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/60 text-foreground'
                    }`}>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={`mt-1 flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        <span className={`text-[9px] ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.context && (
                          <span className="text-[9px] text-muted-foreground">· {msg.context}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {loading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                      {agent.avatar}
                    </div>
                    <div className="rounded-xl bg-secondary/60 px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Analyzing HCS history & market data...</span>
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3">
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Ask ${agent.name} anything...`}
                    disabled={loading}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
