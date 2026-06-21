'use strict';

const path = require('path');
const fs = require('fs');
const express = require('express');
const engine = require('./engine');
const prompt = require('./llm/prompt');
const llm = require('./llm/providers');
const runtime = require('./dist/runtime');

const memoryRuntime = process.env.LT_USE_MEMORY_RUNTIME === 'true'
  ? new runtime.MemoryRuntime(new runtime.InMemoryMemoryStorage())
  : undefined;

let config = {};
try { config = require('dotenv').config({ path: path.join(__dirname, '.env') }).parsed || {}; } catch (_) {}

const LLM_ENABLED = (process.env.LLM_ENABLED || config.LLM_ENABLED) === 'true';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || config.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || config.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || config.DEEPSEEK_MODEL || 'deepseek-v4-pro';
const LLM_MAX_TOKENS = process.env.LLM_MAX_TOKENS || config.LLM_MAX_TOKENS || '512';
const LLM_TEMPERATURE = process.env.LLM_TEMPERATURE || config.LLM_TEMPERATURE || '0.7';

const LT_LLM_PROVIDER = process.env.LT_LLM_PROVIDER || config.LT_LLM_PROVIDER
  || (LLM_ENABLED ? 'deepseek' : 'disabled');

const app = express();
const PORT = process.env.PORT || 3030;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes (no /api/plugins — standalone) ──

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, engine: 'looptrain', version: 'v0.8.2-version-source', mode: 'standalone' });
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
  res.json({
    llm_enabled: LLM_ENABLED && !!DEEPSEEK_API_KEY,
    llm_provider: config.LLM_PROVIDER || 'deepseek',
    lt_llm_provider: LT_LLM_PROVIDER,
  });
});

app.get('/api/commands', (_req, res) => {
  try {
    var base = path.join(__dirname, '..', 'looptrain', 'materials', 'runtime');
    if (!require('fs').existsSync(base)) base = path.join(__dirname, '..', '..', 'looptrain', 'materials', 'runtime');
    const file = path.join(base, 'commands', 'command-registry.json');
    res.json(JSON.parse(require('fs').readFileSync(file, 'utf-8')));
  } catch (_) { res.json({ commands: [] }); }
});

app.get('/api/xu-dialogue', (_req, res) => {
  try {
    var base = path.join(__dirname, '..', 'looptrain', 'materials', 'runtime');
    if (!require('fs').existsSync(base)) base = path.join(__dirname, '..', '..', 'looptrain', 'materials', 'runtime');
    const file = path.join(base, 'dialogues', 'xu-zhiwei-dialogue.json');
    res.json(JSON.parse(require('fs').readFileSync(file, 'utf-8')));
  } catch (_) { res.json({ templates: [] }); }
});

// ── Content API endpoints ──

app.get('/api/intro', (_req, res) => {
  try {
    var base = path.join(__dirname, '..', 'looptrain', 'materials', 'runtime');
    if (!require('fs').existsSync(base)) base = path.join(__dirname, '..', '..', 'looptrain', 'materials', 'runtime');
    const introPath = path.join(base, 'intro', 'intro-text.json');
    const data = JSON.parse(require('fs').readFileSync(introPath, 'utf-8'));
    res.json(data);
  } catch (_) {
    res.json({
      kicker: '渝江线 307 次｜1939 年冬',
      title: '二号车厢',
      steps: [
        { role: '重庆', text: '日机轰炸不断。渝江线 307 次夜行列车，是离开这座燃烧之城最后的窗口。' },
        { role: '身份', text: '普通乘客只是伪装，你携带绝密情报前往江城。' },
        { role: '接头', text: '代号"扣子"的同志会在列车上出现。' },
        { role: '危机', text: '14:15 前，列车将在北江铁桥前爆炸。' },
      ],
      memory: '你只记得爆炸前最后听见的声音——二号车厢地板下方，传来一阵极轻的滴答声。',
      buttonLabel: '进入二号车厢',
      skipLabel: '点击任意位置跳过',
    });
  }
});

app.get('/api/app-strings', (_req, res) => {
  try {
    var base = path.join(__dirname, '..', 'looptrain', 'materials', 'runtime');
    if (!require('fs').existsSync(base)) base = path.join(__dirname, '..', '..', 'looptrain', 'materials', 'runtime');
    const stringsPath = path.join(base, 'intro', 'app-strings.json');
    const data = JSON.parse(fs.readFileSync(stringsPath, 'utf-8'));
    res.json(data);
  } catch (_) {
    res.json({
      commandHelp: '可用指令：查看线索、查看人物、查看状态、结束对话、进入下一轮、重置本轮。',
      statusFormat: '{clock}｜AP {ap}｜第 {loop} 轮｜{mode}',
      npcSummaries: {},
      gameStartToast: '第 1 轮开始',
      nextLoopToast: '进入下一轮',
      resetToast: '已重置试玩版。开场背景将重新显示。',
      trialSuccessToast: '试玩版成功',
      noClueText: '暂无线索',
      noDialogueRecord: '当前没有对话记录',
      noNewClues: '没有获得新线索',
      noWorldEvents: '世界仍在继续推进',
      emptyGoals: '证明二号车厢存在异常，并说服赵乘警检查地板。',
    });
  }
});

// ── Runtime v0.6 API routes (spec Section 6) ──

const assistantController = new runtime.AssistantController(memoryRuntime);

app.post('/api/assistant/ask', async (req, res) => {
  const { clientState, trigger, playerText, debug } = req.body || {};

  if (!clientState || typeof clientState !== 'object' || !clientState.playerId || !clientState.runId) {
    return res.status(400).json({ error: 'missing_client_state' });
  }

  if (trigger && typeof trigger === 'string') {
    const validTriggers = [
      'ASK_ASSISTANT_BUTTON', 'ASSISTANT_FREE_TEXT', 'PLAYER_STALLED',
      'NEW_CLUE_ACQUIRED', 'LOOP_STARTED', 'DIALOGUE_SETTLEMENT', 'LOOP_SETTLEMENT',
    ];
    if (!validTriggers.includes(trigger)) {
      return res.status(400).json({ error: 'invalid_trigger' });
    }
  }

  try {
    if (memoryRuntime) {
      try {
        const migrator = new runtime.LegacyStandaloneStateMigrator();
        const drafts = migrator.migrate(clientState, clientState.runId || 'run_default');
        if (drafts && drafts.length > 0) {
          memoryRuntime.appendEvents(drafts);
        }
      } catch (_migErr) {
        // Non-legacy clientState — skip migration silently
      }
    }

    const result = await assistantController.ask({
      clientState,
      trigger: trigger || 'ASK_ASSISTANT_BUTTON',
      playerText: typeof playerText === 'string' ? playerText.slice(0, 2048) : undefined,
      locale: 'zh-CN',
      clientNow: new Date().toISOString(),
      debug: !!debug,
    });
    res.json(result);
  } catch (e) {
    console.error('[LT] /api/assistant/ask error:', e);
    res.status(500).json({
      error: 'assistant_error',
      message: '助手处理请求时出现问题，请稍后重试。',
    });
  }
});

app.get('/api/assistant/state', (_req, res) => {
  const clientState = {
    playerId: 'player_default', runId: 'run_default', chapterId: 'chapter-01',
    episodeId: 'trial-001', loopId: 'loop_0000_default', sceneId: 'scene-carriage-03',
    snapshotId: null, lastEventId: null, eventSeq: 0, eventsSinceSnapshot: [],
  };
  res.json(assistantController.getInitialState(clientState));
});

// ── Legacy LLM bridge ──

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
  console.log(`\n  LoopTrain Standalone v0.8.2-version-source`);
  console.log(`  ────────────────────────`);
  console.log(`  Local:  http://localhost:${PORT}`);
  console.log(`  LLM:    ${LLM_ENABLED && DEEPSEEK_API_KEY ? 'enabled (deepseek)' : 'mock only'}`);
  console.log(`  Memory: ${memoryRuntime ? 'enabled' : 'disabled'}`);
  console.log(`  Engine: v0.8.2-version-source\n`);
});

module.exports = app;
