'use strict';

const engine = require('./engine');

async function init(router) {
  router.get('/health', (_req, res) => {
    res.json({ ok: true, engine: 'looptrain', version: '0.4.3' });
  });

  router.post('/session/init', (req, res) => {
    const state = engine.normalize(req.body?.state || engine.START_STATE);
    res.json({ state, suggestions: engine.suggestions(state) });
  });

  router.post('/state/normalize', (req, res) => {
    res.json({ state: engine.normalize(req.body?.state) });
  });

  router.post('/action/parse', (req, res) => {
    res.json({ parsed_action: engine.parseAction(req.body?.text || '') });
  });

  router.post('/action/commit', (req, res) => {
    res.json(engine.commitAction(req.body?.text || '', req.body?.state));
  });

  router.post('/dialogue/start', (req, res) => {
    res.json(engine.startDialogue(engine.normalize(req.body?.state), req.body?.npc_id));
  });

  router.post('/dialogue/message', (req, res) => {
    res.json(engine.dialogueMessage(req.body?.npc_id, req.body?.player_text || '', req.body?.state, { llm_reply: req.body?.llm_reply || '' }));
  });

  router.post('/dialogue/end', (req, res) => {
    res.json(engine.endDialogue(req.body?.state));
  });

  router.post('/loop/fail', (req, res) => {
    res.json(engine.failLoop(engine.normalize(req.body?.state), req.body?.failure_type || 'time_out_explosion'));
  });

  router.post('/loop/next', (req, res) => {
    res.json(engine.nextLoop(req.body || {}));
  });

  router.post('/suggestions', (req, res) => {
    const state = engine.normalize(req.body?.state);
    res.json({ suggestions: engine.suggestions(state), dialogue_suggestions: engine.dialogueSuggestions(state) });
  });

  router.get('/npcs', (_req, res) => {
    res.json({ npcs: engine.getNpcs(), clue_titles: engine.getClueTitles() });
  });


  console.log('[LoopTrain] server plugin loaded: /api/plugins/looptrain/*');
  return Promise.resolve();
}

async function exit() {
  console.log('[LoopTrain] server plugin unloaded');
  return Promise.resolve();
}

module.exports = {
  init,
  exit,
  info: {
    id: 'looptrain',
    name: 'LoopTrain Core Engine',
    description: 'LoopTrain v0.4.3 generateRaw bridge + asset path fix engine for SillyTavern-compatible trial episodes.',
  },
};
