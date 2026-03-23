import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useHCSLogs, type HCSMessage } from '@/hooks/useHCSLogs';
import { useMarketData, type MarketData } from '@/hooks/useMarketData';
import { readVaultOnChain, type VaultOnChainData } from '@/lib/contracts';
import { AGENT_META } from '@/config/agents';
import { HCS_TOPIC_IDS } from '@/config/contracts';
import { HEDERA_TESTNET } from '@/config/hedera';

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

function buildSystemPrompt(agent: typeof AGENT_META['agent-1'], vault: VaultOnChainData | null, hcs: HCSMessage[], market: MarketData | null): string {
  const hcsBlock = hcs.slice(0, 10).map(m =>
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
- Reference specific decisions from the HCS log and use real numbers
- Speak in first person — you ARE the agent
- Keep responses well-structured with short paragraphs
- Use **bold** for key metrics and emphasis
- After every response, suggest 3 SHORT follow-up questions the user might ask. Format them exactly as:
  [SUGGESTIONS]
  1. <question>
  2. <question>
  3. <question>
- Never break character or mention being an LLM`;
}

async function sendChat(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch('/api/llm/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages,
      max_tokens: 700,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

function parseSuggestions(text: string): { content: string; suggestions: string[] } {
  const idx = text.indexOf('[SUGGESTIONS]');
  if (idx === -1) return { content: text.trim(), suggestions: [] };

  const content = text.slice(0, idx).trim();
  const sugBlock = text.slice(idx + '[SUGGESTIONS]'.length).trim();
  const suggestions = sugBlock
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(l => l.length > 0)
    .slice(0, 3);

  return { content, suggestions };
}

const INITIAL_SUGGESTIONS = [
  "What's your current strategy and why?",
  "How is today's market affecting your decisions?",
  "Walk me through your latest allocation",
  "What risks are you monitoring right now?",
  "Explain how the Arena competition works for you",
  "What would make you change your strategy?",
];

export default function AgentChatPage() {
  const { id } = useParams();
  const agent = id ? AGENT_META[id] : undefined;
  const { data: hcsLogs } = useHCSLogs(id);
  const { data: market } = useMarketData();
  const [vault, setVault] = useState<VaultOnChainData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const vaultId = agent?.vaultsManaged[0];
  const topicId = id ? HCS_TOPIC_IDS[id] : undefined;

  useEffect(() => {
    if (!vaultId) return;
    readVaultOnChain(vaultId).then(setVault).catch(() => {});
  }, [vaultId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hcsCount = (hcsLogs ?? []).length;
  const contextPills = [
    hcsCount > 0 ? `${hcsCount} HCS decisions` : null,
    vault ? 'On-chain state' : null,
    market ? 'CoinMarketCap' : null,
  ].filter(Boolean) as string[];

  const lastSuggestions = messages.length > 0
    ? messages[messages.length - 1].suggestions
    : undefined;

  const handleSend = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || loading || !agent) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const systemPrompt = buildSystemPrompt(agent, vault, hcsLogs ?? [], market ?? null);
      const history = [...messages, userMsg].slice(-12).map(m => ({
        role: m.role === 'agent' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));

      const raw = await sendChat([{ role: 'system', content: systemPrompt }, ...history]);
      const { content, suggestions } = parseSuggestions(raw);

      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'agent',
        content,
        timestamp: new Date().toISOString(),
        suggestions,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `e-${Date.now()}`,
        role: 'agent',
        content: 'I encountered an error processing your request. Please check that the LLM proxy is configured and try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, agent, vault, hcsLogs, market, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!agent) return <div className="flex h-full items-center justify-center text-muted-foreground">Agent not found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="shrink-0 border-b border-border/60 bg-card/50 backdrop-blur-sm px-6 py-3">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to={`/app/agents/${id}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 font-display text-base font-bold text-accent">
                {agent.avatar}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">{agent.name}</h1>
              <p className="text-[11px] text-muted-foreground">{agent.style}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {contextPills.map(p => (
              <span key={p} className="hidden sm:inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] text-muted-foreground">
                <span className="h-1 w-1 rounded-full bg-emerald-500" />
                {p}
              </span>
            ))}
            {topicId && (
              <a href={`${HEDERA_TESTNET.explorerUrl}/topic/${topicId}`} target="_blank" rel="noreferrer"
                className="rounded-lg border border-border/60 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary/5 transition-colors">
                Verify on HashScan
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-4">
              <div className="text-center mb-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 font-display text-2xl font-bold text-accent mb-4">
                  {agent.avatar}
                </div>
                <h2 className="text-lg font-semibold text-foreground">Talk to {agent.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Ask about strategy, market outlook, or past decisions. Responses are grounded in on-chain HCS history and live CoinMarketCap data.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {INITIAL_SUGGESTIONS.map((q, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSend(q)}
                    className="group text-left rounded-xl border border-border/50 bg-card/60 px-4 py-3 hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <p className="text-xs text-foreground group-hover:text-primary transition-colors">{q}</p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message list */}
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-3">
                      <p className="text-sm text-primary-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent mt-0.5">
                      {agent.avatar}
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div className="prose-sm">
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
                {agent.avatar}
              </div>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex items-center gap-1.5 rounded-xl bg-secondary/60 px-4 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-muted-foreground">Analyzing on-chain data & market conditions…</span>
              </div>
            </motion.div>
          )}

          {/* Follow-up suggestions */}
          {!loading && lastSuggestions && lastSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 pl-11"
            >
              {lastSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="shrink-0 border-t border-border/60 bg-card/30 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${agent.name}...`}
              disabled={loading}
              rows={1}
              className="w-full resize-none rounded-xl border border-border/60 bg-background px-4 py-3 pr-14 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 disabled:opacity-50 transition-shadow"
              style={{ minHeight: '48px', maxHeight: '160px' }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = 'auto';
                t.style.height = Math.min(t.scrollHeight, 160) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-30 disabled:hover:bg-primary"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </form>
          <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
            Responses grounded in <strong>Hedera Consensus Service</strong> decision logs + live vault state + CoinMarketCap data
          </p>
        </div>
      </div>
    </div>
  );
}
