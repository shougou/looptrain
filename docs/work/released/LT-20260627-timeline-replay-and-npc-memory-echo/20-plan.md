# 20-plan.md — 时间线回放与 NPC 记忆残响实施计划

**Work Item**: LT-20260627-timeline-replay-and-npc-memory-echo
**版本**: v0.12.0 · Replay Echo
**关联 Spec**: `10-spec.md`
**日期**: 2026-06-27

---

## 1. 实施概览

| 项目 | 内容 |
|------|------|
| **目标** | Timeline Replay（预定位接入）+ NPC Memory Echo（残响）+ 版本号体系升级 + IndexedDB 事件流 |
| **工期** | 5 个 Phase，预计 4-5 天 |
| **风险** | 中高（Engine 修改 + 新存储层 + LLM Prompt 修改） |
| **依赖** | 无新 npm 依赖，IndexedDB 为浏览器原生 API |
| **分支** | `playtest/v0.12.0-replay-echo`（已创建） |

---

## 2. 阶段划分

### Phase 1: 版本号体系升级 + 基础设施（Day 1 上午）

**目标**：废弃旧版本命名，建立四层版本字段；创建 IndexedDB 封装和事件记录器。

- 修改 `app.js` 版本常量
- 修改 `server.js` `/api/health` 版本字段
- 创建 `public/runtime-db.js`（IndexedDB 封装 + 降级）
- 创建 `public/runtime-recorder.js`（事件记录 + 锚点生成 + 快照）

### Phase 2: Engine 层核心逻辑（Day 1 下午 - Day 2）

**目标**：实现 `resumeFromReplayAnchor`、NPC Memory Echo、修改 `nextLoop` 和 `startDialogue`。

- 修改 `engine.js`：新增 `resumeFromReplayAnchor`、`calculatePrepositionAP`、`buildNpcMemoryEchoes`、`applyNpcMemoryEchoes`、`buildReplayOpening`
- 修改 `engine.js`：`nextLoop` 末尾加 Echo 应用
- 修改 `engine.js`：`startDialogue` 使用 `openingVariant`
- 修改 `server.js`：新增 `POST /api/replay/resume` 端点
- 修改 `materials/runtime/characters/*.json`：新增 `memory_echo_profile`

### Phase 3: LLM Echo Guard（Day 2 下午）

**目标**：LLM Prompt 增加 echo 段落，新增禁词检测和回退。

- 修改 `llm/prompt.js`：`buildNpcPrompt` 增加 echo 段落
- 修改 `llm/providers.js`：新增 `guardLlmEchoReply`，修改 `module.exports`
- 修改 `server.js`：`/api/dialogue/message` 和 `/api/llm/npc-reply` 管线增加 echo guard

### Phase 4: 前端 UI 改造（Day 3）

**目标**：事件记录接入、失败结算 UI 扩展、ReplayAnchorPicker 组件。

- 修改 `app.js`：`handleResponse`/`handleObserveResponse`/`failLoop`/`nextLoop` 加 `recordEvent()`
- 修改 `app.js`：`nextLoop` 补 `saveState()` bugfix
- 修改 `app.js`：`renderFailureOutcome` 增加 ReplayAnchorPicker 区域
- 创建 `public/components/replay-anchor-picker.js`
- 修改 `public/style.css`：ReplayAnchorPicker 样式 + Echo 视觉提示
- 修改 `public/index.html`：引入新 JS 文件

### Phase 5: 测试与验收（Day 4-5）

**目标**：单元测试 + E2E 测试 + 人工验证。

- 创建 `tests/replay_resume_test.js`
- 创建 `tests/npc_memory_echo_test.js`
- 创建 `tests/llm_echo_guard_test.js`
- 创建 `tests/e2e/replay-flow.spec.js`
- 运行现有测试确认不回归
- 人工走查完整流程

---

## 3. 文件变更清单

### 3.1 新增文件（6 个）

| 文件 | 大小估算 | 说明 |
|------|---------|------|
| `public/runtime-db.js` | ~150 行 | IndexedDB 封装（init/read/write/降级） |
| `public/runtime-recorder.js` | ~120 行 | 事件记录器（recordEvent/buildAnchor/buildSnapshot） |
| `public/components/replay-anchor-picker.js` | ~100 行 | ReplayAnchorPicker UI 组件 |
| `tests/replay_resume_test.js` | ~80 行 | 回放接入测试 |
| `tests/npc_memory_echo_test.js` | ~80 行 | Echo 生成与应用测试 |
| `tests/llm_echo_guard_test.js` | ~60 行 | LLM 禁词检测测试 |

### 3.2 修改文件（9 个）

| 文件 | 变更行数 | 核心变更 | 风险 |
|------|---------|---------|------|
| `public/app.js` | ~180 行 | 版本常量、事件记录接入、nextLoop bugfix、renderFailureOutcome 扩展 | 高 |
| `engine.js` | ~200 行 | 新增 5 个函数、修改 nextLoop/startDialogue | 高 |
| `server.js` | ~40 行 | /api/replay/resume、/api/health 版本字段 | 中 |
| `llm/prompt.js` | ~30 行 | buildNpcPrompt echo 段落 | 中 |
| `llm/providers.js` | ~40 行 | guardLlmEchoReply + module.exports | 中 |
| `public/style.css` | ~60 行 | ReplayAnchorPicker + Echo 视觉 | 低 |
| `public/index.html` | ~5 行 | 引入新 JS 文件 | 低 |
| `materials/runtime/characters/xiaoning.json` | ~20 行 | memory_echo_profile | 低 |
| `materials/runtime/characters/gray_passenger.json` | ~20 行 | memory_echo_profile | 低 |
| `materials/runtime/characters/zhao_police.json` | ~20 行 | memory_echo_profile | 低 |

### 3.3 E2E 测试文件（1 个）

| 文件 | 说明 |
|------|------|
| `tests/e2e/replay-flow.spec.js` | 完整回放流程 E2E |

---

## 4. 详细实施步骤

### Step 1: 版本号体系升级（`app.js` + `server.js`）

**文件**: `public/app.js`（第 8-12 行替换）

将：
```js
var LT_SAVE_SCHEMA_VERSION = 1;
var LT_MIN_COMPATIBLE_SCHEMA_VERSION = 1;
var LT_RUNTIME_VERSION = 'v0.11.0-newbie-ui-unlock';
var LT_STORY_VERSION = 'demo-0.8-handeng';
```

替换为：
```js
var LT_APP_VERSION = '0.12.0';
var LT_RELEASE_CHANNEL = 'playtest';
var LT_RELEASE_NAME = 'Replay Echo';
var LT_STORY_VERSION = 'c01-trial-0.3';
var LT_SAVE_SCHEMA_VERSION = 2;
var LT_MIN_COMPATIBLE_SCHEMA_VERSION = 2;
var LT_RUNTIME_VERSION = LT_APP_VERSION; // 向后兼容
```

**文件**: `server.js`（第 37 行、第 296 行、第 301 行）

- `/api/health` 响应改为：
```js
res.json({
  ok: true, engine: 'looptrain',
  version: '0.12.0',
  release_channel: 'playtest',
  release_name: 'Replay Echo',
  story_version: 'c01-trial-0.3',
  save_schema_version: 2,
  mode: 'standalone'
});
```

- 启动日志改为 `LoopTrain Playtest v0.12.0 · Replay Echo`

**验证**: `npm run check` 通过；`/api/health` 返回新字段。

---

### Step 2: 创建 IndexedDB 封装（`public/runtime-db.js`）

**职责**: IndexedDB 初始化、读写、降级。

核心 API：
```js
var RuntimeDB = {
  _db: null,
  _ready: false,

  async init(runId, storyVersion, appVersion) { /* 打开 DB + 写 meta，失败返回 null */ },
  _openDB() { /* indexedDB.open('LoopTrainRuntimeDB', 2)，创建 5 个 store */ },
  async addEvent(event) { /* 写 events store */ },
  async addSnapshot(snapshot) { /* 写 snapshots store */ },
  async addAnchor(anchor) { /* 写 replayAnchors store */ },
  async getAnchorsByLoop(loopNo) { /* 读取指定 loop 的 anchors */ },
  isReady() { return this._ready; }
};
```

store 结构：
- `meta` (keyPath: `key`) — `{ key, value }`
- `events` (keyPath: `eventId`) — RuntimeEvent
- `snapshots` (keyPath: `snapshotId`) — `{ snapshotId, runId, loopId, eventSeq, state, stateHash, createdAt }`
- `replayAnchors` (keyPath: `anchorId`) — ReplayAnchor

降级策略：`init()` 失败时 `_ready = false`，所有读写操作静默跳过。

**验证**: 浏览器控制台 `RuntimeDB.init('test', 'c01-trial-0.3', '0.12.0')` 不报错；隐私模式下 `isReady()` 返回 false。

---

### Step 3: 创建事件记录器（`public/runtime-recorder.js`）

**职责**: 在行动边界生成 RuntimeEvent + ReplayAnchor + Snapshot。

核心 API：
```js
var RuntimeRecorder = {
  _eventSeq: 0,
  resetSeq() { this._eventSeq = 0; },
  async recordEvent(kind, prevState, input, res, state) { /* 生成 event + snapshot + anchor，写入 RuntimeDB */ },
  _buildLabel(state, kind) { /* "14:04 · 连接处" */ },
  _buildSummary(res, kind) { /* 从 res.messages 提取摘要 */ },
  _mapActionType(kind) { /* ACTION_COMMITTED→move, OBSERVATION_RESOLVED→observe, ... */ }
};
```

事件去重：`eventId` 由 `loopNo + eventSeq + actionType` 组成，重复时跳过写入。

anchor 生成：每次 `recordEvent` 都生成一个 anchor，`storyVersion` 不匹配时 `replayable = false`。

**验证**: 控制台调用 `RuntimeRecorder.recordEvent('ACTION_COMMITTED', null, {}, {messages:[{type:'system',text:'测试'}]}, {loop:1,clock:'14:01',ap_remaining:9,location:'carriage_2',run_id:'test'})` 后 IndexedDB 中有 event + snapshot + anchor。

---

### Step 4: Engine — resumeFromReplayAnchor + AP 计算（`engine.js`）

在 `engine.js` 的 `nextLoop()` 函数之后（约第 1203 行），新增：

```js
function calculatePrepositionAP(anchor, policy) {
  if (policy && policy.apPolicy === 'free_debug') return START_STATE.ap_remaining;
  if (policy && policy.apPolicy === 'strict_previous') return anchor.apRemaining;
  var minutesFromStart = timeToMinutes(anchor.clock) - timeToMinutes(START_STATE.clock);
  if (minutesFromStart <= 0) return START_STATE.ap_remaining;
  var cost = Math.max(1, Math.min(3, Math.ceil(minutesFromStart / 5)));
  return Math.max(1, START_STATE.ap_remaining - cost);
}

function buildReplayOpening(s, anchor) {
  var loc = anchor.location === 'connector_2_3' ? '连接处' : '二号车厢';
  var opening = '你猛地睁开眼。\n\n' + loc + '，' + anchor.clock + '。';
  opening += '\n\n你已经知道上一轮这里会发生异常，于是这一次醒来后没有再重复无效询问，而是直接提前守到了这里。';
  if (s.player_timeline && s.player_timeline.entries && s.player_timeline.entries.length) {
    opening += '\n\n你记得上一轮留下的信息，但这些记忆仍需要本轮重新验证。';
  }
  if (s.npc_memory_echoes && s.npc_memory_echoes.length) {
    opening += '\n\n你感觉车厢里的气氛和上一次不太一样。';
  }
  return opening;
}

function resumeFromReplayAnchor(previous, anchor, policy) {
  var next = nextLoop(previous);
  var s = normalize(next.state);

  s.clock = anchor.clock;
  s.location = anchor.location || START_STATE.location;
  s.ap_remaining = calculatePrepositionAP(anchor, policy);
  s.flags.intro_seen = true;
  s.dialogue_session = null;
  s.active_npc = null;
  s.mode = 'explore';

  s.replay = {
    mode: (policy && policy.mode) ? policy.mode : 'preposition',
    source_loop: anchor.loopNo,
    anchor_id: anchor.anchorId,
    resumed_at: anchor.clock
  };

  // Echo 已在 nextLoop() 内部应用，此处不需要重复

  return {
    state: s,
    opening: buildReplayOpening(s, anchor),
    replay_resume_outcome: {
      anchor: anchor,
      inherited_memory_count: s.player_timeline.entries.length,
      note: '上一轮记忆已带入，但仍需本轮重新验证关键证据。'
    },
    suggestions: suggestions(s),
    goal: currentGoal(s)
  };
}
```

在 `module.exports` 中新增导出：`resumeFromReplayAnchor`、`calculatePrepositionAP`、`buildReplayOpening`。

**验证**: `node -e "var e=require('./engine'); console.log(e.resumeFromReplayAnchor({state:{loop:1,clock:'14:15',npc_states:{xiaoning:{trust:50}}}, loop_failure_outcome:{confirmed_facts:[],_timeline_carry:[],_inference_carry:[]}}, {anchorId:'test',loopNo:1,clock:'14:06',location:'connector_2_3',apRemaining:6}, {mode:'preposition'}))"` 返回正确状态。

---

### Step 5: Engine — NPC Memory Echo（`engine.js`）

在 `engine.js` 中新增（`carryTimelineToNextLoop` 之后，约第 704 行）：

```js
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function buildNpcMemoryEchoes(prevState, loopOutcome) {
  var echoes = [];
  var ns = (prevState && prevState.npc_states) || {};

  // 小宁 trust >= 45 → trust_residue
  if (ns.xiaoning && ns.xiaoning.trust >= 45) {
    echoes.push({
      echoId: 'echo_xiaoning_trust_l' + (prevState.loop || 1),
      npcId: 'xiaoning',
      sourceLoop: prevState.loop || 1,
      sourceEventIds: [],
      kind: 'trust_residue',
      intensity: 35,
      valence: 'positive',
      visibleToPlayer: true,
      canAffectDialogue: true,
      canAffectNpcState: true,
      modifiers: { trustDelta: 5, fearDelta: -3, openingVariant: 'xiaoning_dejavu_soft' },
      performanceHint: '温柔迟疑，似曾相识，但说不清原因'
    });
  }

  // 灰衣 suspicion >= 50 → suspicion_residue
  if (ns.gray_passenger && ns.gray_passenger.suspicion >= 50) {
    echoes.push({
      echoId: 'echo_gray_suspicion_l' + (prevState.loop || 1),
      npcId: 'gray_passenger',
      sourceLoop: prevState.loop || 1,
      sourceEventIds: [],
      kind: 'suspicion_residue',
      intensity: 50,
      valence: 'negative',
      visibleToPlayer: true,
      canAffectDialogue: true,
      canAffectNpcState: true,
      modifiers: { suspicionDelta: 8, composureDelta: -5, openingVariant: 'gray_remembers_pressure' },
      performanceHint: '更快警觉，目光锐利，但不解释原因'
    });
  }

  // 赵乘警 trust >= 30 且玩家曾报告过异常 → emotional_residue
  if (ns.zhao_police && ns.zhao_police.trust >= 30 && prevState.flags && prevState.flags.zhao_checked_floor) {
    echoes.push({
      echoId: 'echo_zhao_emotional_l' + (prevState.loop || 1),
      npcId: 'zhao_police',
      sourceLoop: prevState.loop || 1,
      sourceEventIds: [],
      kind: 'emotional_residue',
      intensity: 30,
      valence: 'mixed',
      visibleToPlayer: true,
      canAffectDialogue: true,
      canAffectNpcState: true,
      modifiers: { trustDelta: 3, openingVariant: 'zhao_senses_readiness' },
      performanceHint: '觉得玩家像是早有准备，微妙审视'
    });
  }

  return echoes;
}

function applyNpcMemoryEchoes(state, echoes) {
  state.npc_memory_echoes = echoes;
  for (var i = 0; i < echoes.length; i++) {
    var echo = echoes[i];
    var ns = state.npc_states[echo.npcId];
    if (!ns) continue;
    if (echo.canAffectNpcState) {
      ns.trust = clamp((ns.trust || 0) + (echo.modifiers.trustDelta || 0), -100, 100);
      ns.fear = clamp((ns.fear || 0) + (echo.modifiers.fearDelta || 0), 0, 100);
      ns.suspicion = clamp((ns.suspicion || 0) + (echo.modifiers.suspicionDelta || 0), 0, 100);
      ns.composure = clamp((ns.composure || 0) + (echo.modifiers.composureDelta || 0), 0, 100);
    }
    ns.memory_echo = {
      kind: echo.kind,
      intensity: echo.intensity,
      openingVariant: echo.modifiers.openingVariant || null,
      performanceHint: echo.performanceHint || null
    };
  }
}
```

在 `module.exports` 中新增导出：`buildNpcMemoryEchoes`、`applyNpcMemoryEchoes`。

**验证**: `node -e "var e=require('./engine'); console.log(e.buildNpcMemoryEchoes({loop:1,npc_states:{xiaoning:{trust:50}}},null))"` 输出 echo 数组。

---

### Step 6: Engine — 修改 nextLoop()（`engine.js`）

在 `nextLoop()` 函数的 `return` 之前（约第 1180 行后，`return { state: s, opening: opening...}` 之前），插入 Echo 应用：

```js
  // 新增：应用 NPC Memory Echo（通用路径，所有进入下一轮都走这里）
  var echoes = buildNpcMemoryEchoes(prevState, previous && previous.loop_failure_outcome);
  applyNpcMemoryEchoes(s, echoes);

  if (echoes.length > 0) {
    opening += '\n\n你感觉车厢里的气氛和上一次不太一样。';
  }
```

**验证**: `node -e "var e=require('./engine'); var r=e.nextLoop({state:{loop:1,npc_states:{xiaoning:{trust:50}},player_timeline:{entries:[],inferences:[]}},loop_failure_outcome:{confirmed_facts:[],_timeline_carry:[],_inference_carry:[]}}); console.log(r.state.npc_memory_echoes)"` 输出 echo 数组。

---

### Step 7: Engine — 修改 startDialogue()（`engine.js`）

在 `startDialogue()` 函数中（约第 850 行），将：

```js
messages: [{ type: 'npc', npc_id: npcId, text: npc.opening }],
```

替换为：

```js
messages: [{ type: 'npc', npc_id: npcId, text: resolveNpcOpening(npcId, npc, s) }],
```

新增辅助函数（在 `startDialogue` 之前）：

```js
function resolveNpcOpening(npcId, npc, state) {
  var ns = state.npc_states[npcId] || {};
  if (ns.memory_echo && ns.memory_echo.openingVariant) {
    var profile = npc.memory_echo_profile;
    if (profile && profile.opening_variants && profile.opening_variants[ns.memory_echo.openingVariant]) {
      return profile.opening_variants[ns.memory_echo.openingVariant];
    }
  }
  return npc.opening;
}
```

**验证**: 有 echo 的 NPC 开场白使用 variant；无 echo 的 NPC 使用默认开场。

---

### Step 8: NPC character JSON — memory_echo_profile

**文件**: `materials/runtime/characters/xiaoning.json`

在现有 JSON 中新增 `memory_echo_profile` 字段：

```json
"memory_echo_profile": {
  "susceptibility": 0.75,
  "allowed_effects": ["trust_residue", "fear_residue", "deja_vu"],
  "forbidden_reveals": ["bomb_location", "player_identity", "loop_mechanic"],
  "max_trust_delta_per_loop": 8,
  "max_fear_delta_per_loop": 10,
  "opening_variants": {
    "xiaoning_dejavu_soft": "小宁抬起头看你，眼神里有一瞬间的恍惚。她轻声说：「你……我是不是在哪里见过你？」"
  }
}
```

**文件**: `materials/runtime/characters/gray_passenger.json`

```json
"memory_echo_profile": {
  "susceptibility": 0.6,
  "allowed_effects": ["suspicion_residue", "fear_residue"],
  "forbidden_reveals": ["bomb_location", "player_identity", "loop_mechanic"],
  "max_suspicion_delta_per_loop": 10,
  "opening_variants": {
    "gray_remembers_pressure": "灰衣乘客的目光在你身上停了一瞬。他没有说话，但你感觉到他比上一次更快地警觉了起来。"
  }
}
```

**文件**: `materials/runtime/characters/zhao_police.json`

```json
"memory_echo_profile": {
  "susceptibility": 0.5,
  "allowed_effects": ["emotional_residue", "trust_residue"],
  "forbidden_reveals": ["bomb_location", "player_identity", "loop_mechanic"],
  "max_trust_delta_per_loop": 5,
  "opening_variants": {
    "zhao_senses_readiness": "赵乘警看了你一眼，微微皱眉。「你看起来……比上次从容多了。」"
  }
}
```

**验证**: `node -e "var e=require('./engine'); e.loadContent(); console.log(e.NPCS.xiaoning.memory_echo_profile)"` 输出 profile。

---

### Step 9: server.js — /api/replay/resume 端点

在 `server.js` 的 `/api/loop/next` 路由之后（约第 84 行），新增：

```js
app.post('/api/replay/resume', (req, res) => {
  const { previous, anchor, policy } = req.body || {};
  if (!previous || !previous.state) return res.status(400).json({ error: 'missing_previous_state' });
  if (!anchor || !anchor.clock) return res.status(400).json({ error: 'missing_anchor' });
  try {
    res.json(engine.resumeFromReplayAnchor(previous, anchor, policy || { mode: 'preposition' }));
  } catch (e) {
    console.error('[LT] /api/replay/resume error:', e);
    res.status(500).json({ error: 'replay_resume_failed', message: e.message });
  }
});
```

**验证**: `curl -X POST http://127.0.0.1:3030/api/replay/resume -H 'Content-Type: application/json' -d '{"previous":{"state":{"loop":1,"clock":"14:15","npc_states":{"xiaoning":{"trust":50}},"player_timeline":{"entries":[],"inferences":[]}},"loop_failure_outcome":{"confirmed_facts":[],"_timeline_carry":[],"_inference_carry":[]}},"anchor":{"anchorId":"test","loopNo":1,"clock":"14:06","location":"connector_2_3","apRemaining":6},"policy":{"mode":"preposition"}}'` 返回正确状态。

---

### Step 10: LLM Prompt — echo 段落（`llm/prompt.js`）

在 `buildNpcPrompt()` 函数末尾（return 之前），插入：

```js
var ns = (state.npc_states && state.npc_states[npcId]) || {};
var echo = ns.memory_echo;
if (echo) {
  prompt += '\n\n【轮回残响】\n';
  prompt += '你并不清楚上一轮发生了什么，也不能说"我记得上一轮"。\n';
  prompt += '但你对玩家产生了某种无法解释的感觉：\n';
  prompt += '- 类型：' + echo.kind + '\n';
  prompt += '- 强度：' + echo.intensity + '/100\n';
  prompt += '- 表演方向：' + (echo.performanceHint || '微妙的情绪偏移') + '\n\n';
  prompt += '你只能把它表现为语气、迟疑、警惕、熟悉感或情绪变化。\n';
  prompt += '你不能因此透露自己不可能知道的事实。\n';
  prompt += '你不能说"上一轮""循环""我记得你"。\n';
  prompt += '你只能说"我是不是在哪里见过你""你刚才的眼神让我不太舒服"\n';
  prompt += '"不知道为什么，我觉得你不像坏人"。\n';
}
```

---

### Step 11: LLM Echo Guard（`llm/providers.js`）

在 `cleanLlmReply()` 之后新增：

```js
function guardLlmEchoReply(reply, npcId, state) {
  if (!reply) return reply;
  var ns = (state && state.npc_states && state.npc_states[npcId]) || {};
  if (!ns.memory_echo) return reply;

  var forbidden = ['上一轮', '循环', '轮回', '我记得你', '上次你', '你又来了'];
  for (var i = 0; i < forbidden.length; i++) {
    if (reply.indexOf(forbidden[i]) >= 0) return null;
  }

  var forbiddenReveals = [
    { key: 'bomb_location', keywords: ['炸弹', '爆炸物', '炸弹位置'] },
    { key: 'player_identity', keywords: ['你是间谍', '你是特工', '情报员'] },
    { key: 'loop_mechanic', keywords: ['时间循环', '你被困在', '循环里'] }
  ];
  for (var j = 0; j < forbiddenReveals.length; j++) {
    var fr = forbiddenReveals[j];
    for (var k = 0; k < fr.keywords.length; k++) {
      if (reply.indexOf(fr.keywords[k]) >= 0) return null;
    }
  }

  return reply;
}
```

更新 `module.exports`：
```js
module.exports = { generateMockReply, generateDeepSeekReply, cleanLlmReply, guardLlmEchoReply };
```

**在 server.js 中接入**：`/api/dialogue/message` 和 `/api/llm/npc-reply` 的 LLM 回复管线中，在 `cleanLlmReply()` 之后调用 `guardLlmEchoReply()`。若返回 `null`，回退到 Mock 回复。

---

### Step 12: 前端 — 事件记录接入（`app.js`）

在 `handleResponse()` 函数中（第 472 行），在 `saveState()` 之后插入：

```js
if (res.state) {
  state = res.state; saveState();
  // 新增：事件记录
  RuntimeRecorder.recordEvent('ACTION_COMMITTED', prevStateForCard, null, res, state);
  // ... 现有音频逻辑 ...
}
```

在 `handleObserveResponse()` 函数中（第 367 行），末尾插入：

```js
RuntimeRecorder.recordEvent('OBSERVATION_RESOLVED', null, null, res, state);
```

在 `failLoop()` 函数中（第 405 行），在 `handleResponse` 之后插入：

```js
RuntimeRecorder.recordEvent('LOOP_FAILED', state, null, res, state);
```

在 `nextLoop()` 函数中（第 410 行），在 `state = res.state` 之后补 `saveState()` + 事件记录：

```js
if (res?.state) {
  state = res.state;
  saveState(); // bugfix: 当前遗漏
  RuntimeRecorder.recordEvent('LOOP_STARTED', null, null, res, state);
}
```

**验证**: 执行一次行动后，IndexedDB 中有对应 event + snapshot + anchor。

---

### Step 13: 前端 — renderFailureOutcome 扩展（`app.js`）

在 `renderFailureOutcome()` 函数中（第 515 行），在"下一轮建议"之后、"进入第 N 轮"按钮之前，插入 ReplayAnchorPicker 区域：

```js
// 新增：ReplayAnchorPicker
var anchorsHtml = '<div class="lt-subtitle">下一轮接入点</div>';
anchorsHtml += '<div class="lt-replay-anchors" id="replay-anchors-container">';
anchorsHtml += '<div class="lt-anchor-card lt-anchor-selected" data-anchor-id="restart">14:00 从头开始</div>';
anchorsHtml += '<div id="replay-anchors-loading">加载中...</div>';
anchorsHtml += '</div>';
```

在 `ng.classList.add('lt-show')` 之后，异步加载 anchors：

```js
if (RuntimeDB.isReady()) {
  var prevLoop = out.loop || state.loop;
  RuntimeDB.getAnchorsByLoop(prevLoop).then(function(anchors) {
    var container = document.getElementById('replay-anchors-loading');
    if (!container) return;
    container.innerHTML = '';
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      if (!a.replayable) continue;
      var card = document.createElement('div');
      card.className = 'lt-anchor-card';
      card.dataset.anchorId = a.anchorId;
      card.innerHTML = '<div class="lt-anchor-label">' + esc(a.label) + '</div>'
                     + '<div class="lt-anchor-summary">' + esc(a.summary) + '</div>';
      card.addEventListener('click', function() {
        document.querySelectorAll('.lt-anchor-card').forEach(function(c) { c.classList.remove('lt-anchor-selected'); });
        this.classList.add('lt-anchor-selected');
      });
      container.appendChild(card);
    }
    if (!container.children.length) container.innerHTML = '<div class="lt-anchor-empty">无可用接入点</div>';
  });
} else {
  var loading = document.getElementById('replay-anchors-loading');
  if (loading) loading.innerHTML = '<div class="lt-anchor-empty">历史记录不可用，将从 14:00 开始</div>';
}
```

修改"进入第 N 轮"按钮的点击处理：

```js
btnNextLoop.addEventListener('click', async function() {
  var selected = document.querySelector('.lt-anchor-card.lt-anchor-selected');
  var anchorId = selected ? selected.dataset.anchorId : 'restart';

  if (anchorId === 'restart') {
    nextLoop(); // 普通 nextLoop
  } else {
    // 预定位接入
    var anchor = await RuntimeDB.getAnchorById(anchorId);
    if (anchor) {
      var res = await api('/replay/resume', {
        previous: { state: state, loop_failure_outcome: lastFailure },
        anchor: anchor,
        policy: { mode: 'preposition' }
      });
      if (res?.state) {
        state = res.state;
        saveState();
        lastFailure = null;
        var ng = document.getElementById('overlay-ng');
        if (ng) ng.classList.remove('lt-show');
        if (res.opening) eventFeed.appendMessage('system', res.opening);
        focusWatchBar.stopWatch();
        toast('进入第 ' + state.loop + ' 轮');
        gameShell.setState(state);
      }
    }
  }
});
```

**验证**: 失败结算卡显示接入点；选择非 14:00 锚点后点击"进入下一轮"调用 `/api/replay/resume`。

---

### Step 14: 前端 — ReplayAnchorPicker 样式（`style.css`）

新增：

```css
.lt-replay-anchors { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.lt-anchor-card {
  background: rgba(58, 58, 58, 0.6); border: 1px solid #444; border-radius: 8px;
  padding: 10px 12px; cursor: pointer; min-width: 140px; transition: border-color 150ms ease;
}
.lt-anchor-card:hover { border-color: var(--lt-gold, #c9a96e); }
.lt-anchor-card.lt-anchor-selected { border-color: var(--lt-gold, #c9a96e); background: rgba(201, 169, 110, 0.1); }
.lt-anchor-label { font-size: 13px; font-weight: 500; color: #e0e0e0; }
.lt-anchor-summary { font-size: 11px; color: #888; margin-top: 4px; }
.lt-anchor-empty { font-size: 12px; color: #666; padding: 8px; }
```

---

### Step 15: 前端 — index.html 引入新文件

在 `index.html` 的 `<script>` 标签列表中，在 `app.js` 之前引入：

```html
<script src="runtime-db.js"></script>
<script src="runtime-recorder.js"></script>
```

---

## 5. 测试计划

### 5.1 单元测试

**`tests/replay_resume_test.js`**:

```js
var assert = require('assert');
var engine = require('../engine');

// 测试 1: 从 14:06 接入，loop + 1
var result = engine.resumeFromReplayAnchor(
  { state: { loop: 1, npc_states: { xiaoning: { trust: 20 } }, player_timeline: { entries: [], inferences: [] } }, loop_failure_outcome: { confirmed_facts: [], _timeline_carry: [], _inference_carry: [] } },
  { anchorId: 'test', loopNo: 1, clock: '14:06', location: 'connector_2_3', apRemaining: 6 },
  { mode: 'preposition' }
);
assert.strictEqual(result.state.loop, 2);
assert.strictEqual(result.state.clock, '14:06');
assert.strictEqual(result.state.location, 'connector_2_3');
assert.strictEqual(result.state.dialogue_session, null);
assert.strictEqual(result.state.active_npc, null);
assert.strictEqual(result.state.mode, 'explore');

// 测试 2: AP 计算 — 14:06 距 14:00 为 6 分钟，ceil(6/5)=2，AP=10-2=8
assert.strictEqual(result.state.ap_remaining, 8);

// 测试 3: 14:00 从头开始不走 resumeFromReplayAnchor，但 calculatePrepositionAP 应返回满 AP
assert.strictEqual(engine.calculatePrepositionAP({ clock: '14:00' }, { mode: 'preposition' }), 10);

// 测试 4: replay 标记
assert.strictEqual(result.state.replay.mode, 'preposition');
assert.strictEqual(result.state.replay.source_loop, 1);

console.log('✓ replay_resume_test passed');
```

**`tests/npc_memory_echo_test.js`**:

```js
var assert = require('assert');
var engine = require('../engine');

// 测试 1: 小宁 trust >= 45 生成 trust_residue
var echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { xiaoning: { trust: 50 } } }, null);
assert.strictEqual(echoes.length, 1);
assert.strictEqual(echoes[0].npcId, 'xiaoning');
assert.strictEqual(echoes[0].kind, 'trust_residue');
assert.strictEqual(echoes[0].modifiers.trustDelta, 5);

// 测试 2: 灰衣 suspicion >= 50 生成 suspicion_residue
echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { gray_passenger: { suspicion: 60 } } }, null);
assert.strictEqual(echoes.length, 1);
assert.strictEqual(echoes[0].kind, 'suspicion_residue');

// 测试 3: 无阈值不生成 echo
echoes = engine.buildNpcMemoryEchoes({ loop: 1, npc_states: { xiaoning: { trust: 20 } } }, null);
assert.strictEqual(echoes.length, 0);

// 测试 4: nextLoop 应用 echo
var result = engine.nextLoop({ state: { loop: 1, npc_states: { xiaoning: { trust: 50 } }, player_timeline: { entries: [], inferences: [] } }, loop_failure_outcome: { confirmed_facts: [], _timeline_carry: [], _inference_carry: [] } });
assert.ok(result.state.npc_memory_echoes);
assert.strictEqual(result.state.npc_memory_echoes.length, 1);

// 测试 5: Echo 不改变 canConvinceZhao
// (需要构造完整 state 验证，此处简化)
assert.ok(!result.state.npc_memory_echoes.some(function(e) { return e.kind === 'clue_unlock'; }));

console.log('✓ npc_memory_echo_test passed');
```

**`tests/llm_echo_guard_test.js`**:

```js
var assert = require('assert');
var providers = require('../llm/providers');

// 测试 1: 无 echo 时跳过
assert.strictEqual(providers.guardLlmEchoReply('你好', 'xiaoning', { npc_states: { xiaoning: {} } }), '你好');

// 测试 2: 有 echo + 正常回复 → 通过
assert.strictEqual(providers.guardLlmEchoReply('我是不是在哪里见过你？', 'xiaoning', { npc_states: { xiaoning: { memory_echo: { kind: 'trust_residue' } } } }), '我是不是在哪里见过你？');

// 测试 3: 有 echo + 禁词"上一轮" → null
assert.strictEqual(providers.guardLlmEchoReply('上一轮你跟我说过...', 'xiaoning', { npc_states: { xiaoning: { memory_echo: { kind: 'trust_residue' } } } }), null);

// 测试 4: 有 echo + 禁词"循环" → null
assert.strictEqual(providers.guardLlmEchoReply('你被困在时间循环里', 'xiaoning', { npc_states: { xiaoning: { memory_echo: { kind: 'trust_residue' } } } }), null);

console.log('✓ llm_echo_guard_test passed');
```

### 5.2 E2E 测试

**`tests/e2e/replay-flow.spec.js`**:

```js
const { test, expect } = require('@playwright/test');

test.describe('LoopTrain v0.12.0 Replay Echo', () => {
  test('失败后显示接入点选择器', async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('#intro-start-btn', { timeout: 10000 });
    await page.click('#intro-start-btn');
    await page.waitForSelector('.lt-scene-card', { timeout: 5000 });
    // 触发失败
    await page.click('.lt-action-btn[data-template="__FORCE_FAIL__"]');
    await page.waitForSelector('.lt-ng-card', { timeout: 5000 });
    // 验证接入点区域存在
    await expect(page.locator('.lt-replay-anchors')).toBeVisible();
  });

  test('选择 14:00 从头开始正常进入下一轮', async ({ page }) => {
    // ... 完整流程 ...
  });
});
```

### 5.3 回归测试

- 运行现有 `tests/smoke_test.js`
- 运行现有 `tests/ui-stage.test.js`
- 运行现有 `tests/assistant-hint.test.js`
- 运行现有 4 个 E2E spec

---

## 6. 回滚方案

若实施过程中出现严重问题：

1. **回退分支**: `git checkout master`
2. **保留文件**: 新创建的 `runtime-db.js`、`runtime-recorder.js`、`replay-anchor-picker.js` 不影响现有功能（未被引用时）
3. **Engine 回滚**: `git checkout looptrain/standalone/engine.js` 恢复原始逻辑
4. **存档兼容**: 旧 localStorage 存档（schema v1）因版本不匹配会触发重置，不影响游戏可玩性
5. **验证回滚**: `bash scripts/verify_slt.sh` 确认恢复

---

## 7. 完成检查清单

### 实施前

- [ ] 确认分支 `playtest/v0.12.0-replay-echo` 已创建
- [ ] 备份当前 `engine.js`、`app.js`、`server.js`
- [ ] 确认 `npm run check` 当前通过

### 实施中

- [ ] 每完成一个 Step 运行 `npm run check`
- [ ] Phase 2 完成后运行 `node tests/smoke_test.js` 确认 Engine 不回归
- [ ] Phase 3 完成后手动测试 LLM 对话（Mock 模式）
- [ ] Phase 4 完成后浏览器手动验证失败结算 UI

### 实施后

- [ ] 运行 `npm test`（所有测试通过）
- [ ] 运行 `npm run test:e2e`（E2E 通过）
- [ ] 运行 `bash scripts/verify_slt.sh`
- [ ] 人工走查：第一轮失败 → 选择 14:06 接入 → 验证 clock/location/AP/memory
- [ ] 人工走查：小宁 trust >= 45 → 下一轮开场白变化
- [ ] 人工走查：原始成功路径仍然可用
- [ ] 验证 IndexedDB 不可用时游戏正常（Chrome 隐私模式测试）

---

## 8. 相关资源

- `00-idea.md` — 原始构想
- `10-spec.md` — 设计规格（含验收标准）
- `looptrain/standalone/AGENT.md` — Agent 工作协议
- `docs/project/GAME_DESIGN.md` — 游戏设计总览

---

*本计划是实施阶段的执行蓝图。如实际进度与计划偏差超过 20%，需更新本文件并说明原因。*
