import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(join(__dirname, 'dist')));

// ─── CoinMarketCap proxy ────────────────────────────────────────────
app.use('/api/cmc', async (req, res) => {
  const cmcKey = process.env.CMC_API_KEY;
  if (!cmcKey) return res.status(503).json({ error: 'CMC_API_KEY not configured' });

  const path = req.url;
  const url = `https://pro-api.coinmarketcap.com${path}`;

  try {
    const r = await fetch(url, { headers: { 'X-CMC_PRO_API_KEY': cmcKey, Accept: 'application/json' } });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'CMC proxy error', message: err.message });
  }
});

// ─── OpenRouter LLM proxy ───────────────────────────────────────────
app.use('/api/llm', async (req, res) => {
  const llmKey = process.env.OPENROUTER_API_KEY;
  if (!llmKey) return res.status(503).json({ error: 'OPENROUTER_API_KEY not configured' });

  const url = `https://openrouter.ai${req.url}`;

  try {
    const r = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmKey}`,
        'HTTP-Referer': 'https://vaultera.app',
        'X-Title': 'Vaultera Agent Chat',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    res.status(502).json({ error: 'LLM proxy error', message: err.message });
  }
});

// ─── SPA fallback ───────────────────────────────────────────────────
app.use((req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Vaultera running on port ${PORT}`);
});
