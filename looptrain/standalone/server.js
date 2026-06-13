'use strict';

const path = require('path');
const express = require('express');
const engine = require('./engine');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes (no /api/plugins — standalone) ──

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, engine: 'looptrain', version: '0.4.3', mode: 'standalone' });
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
  res.json({ npcs: engine.getNpcs(), clue_titles: engine.getClueTitles() });
});

// Serve index.html for SPA fallback
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  LoopTrain Standalone MVP`);
  console.log(`  ─────────────────────`);
  console.log(`  Local:  http://localhost:${PORT}`);
  console.log(`  Mode:   Mock (no LLM required)`);
  console.log(`  Engine: v0.4.3\n`);
});

module.exports = app;
