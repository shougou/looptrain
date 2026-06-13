'use strict';

const path = require('path');
const express = require('express');
const engine = require('./engine');
const prompt = require('./llm/prompt');
const llm = require('./llm/providers');

let config = {};
try { config = require('dotenv').config({ path: path.join(__dirname, '.env') }).parsed || {}; } catch (_) {}

const LLM_ENABLED = (process.env.LLM_ENABLED || config.LLM_ENABLED) === 'true';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || config.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || config.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || config.DEEPSEEK_MODEL || 'deepseek-v4-pro';
const LLM_MAX_TOKENS = process.env.LLM_MAX_TOKENS || config.LLM_MAX_TOKENS || '512';
const LLM_TEMPERATURE = process.env.LLM_TEMPERATURE || config.LLM_TEMPERATURE || '0.7';

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes (no /api/plugins — standalone) ──

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, engine: 'looptrain', version: '0.5-standalone-mvp', mode: 'standalone' });
});

app.post('/api/session/init', (req, res) => {
  const state = engine.normalize(req.body?.state || engine.START_STATE);
  res.json({ state, suggestions: engine.suggestions(state), goal: engine.currentGoal(state) });
});

app.post('/api/action/commit', (req, res) => {
  res.json(engine.commitAction(req.body?.text || '', req.body?.state));
});

app.post('/api/dialogue/start', (req, res) => {
  res.json(engine.startDialogue(engine.normalize(req.body?.state), req.body?.npc_id));
});

app.post('/api/dialogue/message', (req, res) => {
  res.json(engine.dialogueMessage(
    req.body?.npc_id,
    req.body?.player_text || '',
    req.body?.state,
    { llm_reply: req.body?.llm_reply || '' }
  ));
});

app.post('/api/dialogue/end', (req, res) => {
  res.json(engine.endDialogue(req.body?.state));
});

app.post('/api/loop/fail', (req, res) => {
  res.json(engine.failLoop(
    engine.normalize(req.body?.state),
    req.body?.failure_type || 'time_out_explosion'
  ));
});

app.post('/api/loop/next', (req, res) => {
  res.json(engine.nextLoop(req.body || {}));
});

app.get('/api/suggestions', (req, res) => {
  const state = engine.normalize(req.query?.state ? JSON.parse(req.query.state) : engine.START_STATE);
  res.json({
    suggestions: engine.suggestions(state),
    dialogue_suggestions: engine.dialogueSuggestions(state),
  });
});

app.get('/api/npcs', (_req, res) => {
  res.json({ npcs: engine.getNpcs(), npc_info: engine.getNpcInfo(), clue_titles: engine.getClueTitles() });
});

app.get('/api/scenes', (_req, res) => {
  res.json({ scenes: engine.getScenes() });
});

app.get('/api/config', (_req, res) => {
  res.json({ llm_enabled: LLM_ENABLED && !!DEEPSEEK_API_KEY, llm_provider: config.LLM_PROVIDER || 'deepseek' });
});

app.post('/api/llm/npc-reply', async (req, res) => {
  const { npc_id, player_text, state } = req.body;
  if (!npc_id || !player_text) {
    return res.status(400).json({ error: 'missing npc_id or player_text' });
  }

  try {
    const p = prompt.buildNpcPrompt(npc_id, player_text, state || engine.START_STATE);
    if (!p) return res.json({ reply: '' });

    if (LLM_ENABLED && DEEPSEEK_API_KEY) {
      try {
        const raw = await llm.generateDeepSeekReply(p.systemPrompt, p.userPrompt, {
          DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL, LLM_MAX_TOKENS, LLM_TEMPERATURE,
        });
        const cleaned = llm.cleanLlmReply(raw);
        return res.json({ reply: cleaned, mode: 'llm' });
      } catch (e) {
        console.warn('[LT] LLM call failed, falling back to mock:', e.message);
      }
    }

    const mockReply = await llm.generateMockReply(npc_id);
    return res.json({ reply: mockReply, mode: 'mock' });
  } catch (e) {
    console.error('[LT] npc-reply error:', e);
    return res.json({ reply: '', mode: 'error' });
  }
});

// Serve index.html for SPA fallback
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  LoopTrain Standalone MVP`);
  console.log(`  ─────────────────────`);
  console.log(`  Local:  http://localhost:${PORT}`);
  console.log(`  LLM:    ${LLM_ENABLED && DEEPSEEK_API_KEY ? 'enabled (deepseek)' : 'mock only'}`);
  console.log(`  Engine: v0.5.0\n`);
});

module.exports = app;
