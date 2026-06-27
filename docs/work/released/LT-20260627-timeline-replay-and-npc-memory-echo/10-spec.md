# 10-spec.md — 时间线回放与 NPC 记忆残响系统设计规格

**Work Item**: LT-20260627-timeline-replay-and-npc-memory-echo
**版本级别**: minor
**版本号**: v0.12.0 · Replay Echo（时间线回放与残响）
**发布阶段**: Playtest
**Story Version**: c01-trial-0.3
**Save Schema Version**: 2
**基于**: 00-idea.md + 评审意见修正

---

## 1. 目标（追溯 00-idea.md）

### 1.1 时间线回放（Timeline Replay）

循环失败后，玩家不再只能从 14:00 从头开始，而是可以浏览上一轮的行动时间线，选择一个"回放锚点"作为接入点。系统基于 `nextLoop()` 生成新轮次状态，但将 `clock`、`location` 设为锚点对应值，按策略扣减 AP。上一轮时间线以"记忆"形式继承，不算本轮证据。

### 1.2 NPC 记忆残响（NPC Memory Echo）

NPC 在多轮交互后（trust/fear/suspicion 达到阈值），下一轮开场时产生"残响"——不是完整记忆，而是既视感、情绪偏移、莫名的熟悉/警惕。Echo 必须同时影响 Engine 层（`startDialogue()` / opening resolver）和 LLM Prompt 层（`buildNpcPrompt()`）。即使 LLM 禁用，Engine 的 deterministic fallback 也必须生效。

### 1.3 核心原则（不可违反）

1. Engine 是唯一裁判，LLM 只能生成 NPC 表演文本
2. 记忆 ≠ 证据——继承的 timeline entries 必须保持 `source_type='memory'`、`current_loop_verified=false`、`counts_as_current_evidence=false`
3. Echo 不得直接解锁线索、不得改变 `canConvinceZhao()` 结果、不得让赵乘警绕过证据检查
4. Memory Echo 是"下一轮进入"的通用能力，不是 Replay 专属——`nextLoop()` 和 `resumeFromReplayAnchor()` 都必须应用

---

## 2. 非目标

- 不做完整的"视频回放"或"世界状态精确重演"
- 不做 LLM 自由发挥的 NPC 污染（必须由 Engine 生成结构化 echo 数据）
- 不做 NPC 行动路线变化（灰衣不会因为被多轮观察就改变路线——需要 timeline_variant 机制，留待后续版本）
- 不做 strict_replay 模式（自动重放上一轮操作序列，留待 Phase 2）
- 不做跨循环存档上传/分享
- 不做 expiresAfterLoops 机制（残响自动消退，留待后续版本）

---

## 3. 版本号体系（本次确立）

废弃 `LT_RUNTIME_VERSION = 'v0.11.0-newbie-ui-unlock'` 旧命名。采用四层版本字段：

```js
const LT_APP_VERSION = '0.12.0';
const LT_RELEASE_CHANNEL = 'playtest';
const LT_RELEASE_NAME = 'Replay Echo';
const LT_STORY_VERSION = 'c01-trial-0.3';
const LT_SAVE_SCHEMA_VERSION = 2;
const LT_MIN_COMPATIBLE_SCHEMA_VERSION = 2;
```

| 字段 | 用途 | 变更时机 |
|------|------|---------|
| `LT_APP_VERSION` | 代码/引擎/UI 版本 | 新系统/minor/patch |
| `LT_RELEASE_CHANNEL` | 发布阶段 | playtest → alpha → beta → release |
| `LT_RELEASE_NAME` | 版本代号（devlog/README 展示） | 每次 minor |
| `LT_STORY_VERSION` | 剧情内容版本 | 剧情/线索/NPC 内容变更 |
| `LT_SAVE_SCHEMA_VERSION` | 存档结构版本 | 存档结构破坏性变更 |

**存档版本升级规则**：`LT_SAVE_SCHEMA_VERSION` 从 1 升到 2（因新增 IndexedDB 事件流、ReplayAnchor、Memory Echo 结构）。旧 `localStorage` 存档（schema v1）可迁移为初始 snapshot，不强制完全丢弃。

**storyVersion 绑定**：`ReplayAnchor` 必须携带 `storyVersion`。当 `storyVersion` 不一致时，旧 anchor 的 `replayable` 自动设为 `false`，仅可查看不可接入。

---

## 4. 数据结构设计

### 4.1 ReplayAnchor

```ts
type ReplayAnchor = {
  anchorId: string;          // 稳定 ID: loopNo + eventSeq + actionType + clock + location 的 hash
  runId: string;             // 运行 ID（前端首次存档时生成）
  loopNo: number;            // 来源轮次

  clock: string;             // "14:04"
  location: string;          // "carriage_2" / "connector_2_3"
  apRemaining: number;       // 当时剩余 AP

  label: string;             // UI 标签："14:04 · 灰衣经过二号车厢"
  summary: string;           // 简短描述："你在这里观察到灰衣进入三号车厢方向"

  actionType: 'observe' | 'dialogue' | 'move' | 'inference' | 'failure';

  snapshotId: string;        // 对应完整 state 快照 ID
  eventSeq: number;          // 事件流序号

  runtimeVersion: string;    // 如 "0.12.0"
  storyVersion: string;      // 如 "c01-trial-0.3"

  replayable: boolean;       // storyVersion 不一致时 false
  risk: 'safe' | 'dialogue_boundary' | 'unsafe';
};
```

**snapshot 使用限制**：`snapshotId` 仅用于调试、回看和后续 strict_replay。Playtest preposition 模式禁止直接 apply 旧 snapshot。接入点只读取 anchor 的 `clock`、`location`、`label`、`summary`、`sourceLoop` 等元信息，由 Engine 基于 `nextLoop()` 生成新轮次状态。

### 4.2 NpcMemoryEcho

```ts
type NpcMemoryEcho = {
  echoId: string;
  npcId: string;
  sourceLoop: number;
  sourceEventIds: string[];

  kind: 'deja_vu' | 'emotional_residue' | 'suspicion_residue'
      | 'trust_residue' | 'fear_residue' | 'route_disturbance';

  intensity: number;         // 0~100
  valence: 'positive' | 'negative' | 'mixed';

  visibleToPlayer: boolean;
  canAffectDialogue: boolean;
  canAffectNpcState: boolean;

  modifiers: {
    trustDelta?: number;     // ±5~8
    fearDelta?: number;
    suspicionDelta?: number;
    composureDelta?: number;
    openingVariant?: string;  // 开场白变体 ID
    suggestionVariant?: string;
  };

  performanceHint?: string;  // 给 LLM 的表演方向提示
};
```

### 4.3 NPC memory_echo_profile（JSON 素材）

每个 NPC 在 `materials/runtime/characters/*.json` 中新增：

```json
{
  "memory_echo_profile": {
    "susceptibility": 0.75,
    "allowed_effects": ["trust_residue", "fear_residue", "deja_vu"],
    "forbidden_reveals": ["bomb_location", "player_identity", "loop_mechanic"],
    "max_trust_delta_per_loop": 8,
    "max_fear_delta_per_loop": 10,
    "max_suspicion_delta_per_loop": 10,
    "opening_variants": {
      "xiaoning_dejavu_soft": "小宁抬起头看你，眼神里有一瞬间的恍惚，像是想起了什么又放下了。她轻声说：「你……我是不是在哪里见过你？」",
      "gray_remembers_pressure": "灰衣乘客的目光在你身上停了一瞬。他没有说话，但你感觉到他比上一轮更快地警觉了起来。"
    }
  }
}
```

三个 NPC 的 Echo 阈值规则：

| NPC | 触发条件 | Echo 类型 | intensity |
|-----|---------|----------|-----------|
| 小宁 | `trust >= 45` | `trust_residue` | 35 |
| 灰衣 | `suspicion >= 50` | `suspicion_residue` | 50 |
| 赵乘警 | `trust >= 30` 且玩家曾报告过异常 | `emotional_residue` | 30 |

### 4.4 RuntimeEvent（IndexedDB 事件流）

```ts
type RuntimeEvent = {
  eventId: string;           // 稳定 ID: loopNo + eventSeq + actionType
  runId: string;
  loopId: string;
  seq: number;

  type:
    | 'ACTION_COMMITTED'
    | 'OBSERVATION_RESOLVED'
    | 'DIALOGUE_STARTED'
    | 'DIALOGUE_MESSAGE_RESOLVED'
    | 'DIALOGUE_ENDED'
    | 'LOOP_FAILED'
    | 'LOOP_STARTED'
    | 'REPLAY_ANCHOR_CREATED'
    | 'REPLAY_RESUME_STARTED'
    | 'NPC_MEMORY_ECHO_CREATED'
    | 'NPC_MEMORY_ECHO_APPLIED';

  clockBefore: string;
  clockAfter: string;
  apBefore: number;
  apAfter: number;
  locationBefore: string;
  locationAfter: string;

  input?: unknown;
  engineResult?: unknown;
  stateHash: string;
  createdAt: string;         // ISO 8601
};
```

**事件去重**：`recordEvent()` 内部检查 `eventId` 是否已存在，存在则跳过。

### 4.5 PreviousLoopContext（统一参数结构）

```ts
type PreviousLoopContext = {
  state: LegacyStandaloneState;
  loop_failure_outcome?: {
    loop: number;
    failed_at: string;
    failure_type: string;
    failure_reason: string;
    confirmed_facts: Array<{ id: string; text: string; carry_to_next_loop: boolean; source_type?: string }>;
    _timeline_carry: TimelineEntry[];
    _inference_carry: string[];
  };
};

type ReplayResumePolicy = {
  mode: 'preposition';
  apPolicy?: 'preposition_default' | 'strict_previous' | 'free_debug';
};
```

---

## 5. IndexedDB 存储层设计

### 5.1 数据库结构

```ts
Database: LoopTrainRuntimeDB (version 2)

Stores:
  meta            // { key, value } — runId, storyVersion, appVersion
  runs            // { runId, createdAt, storyVersion, appVersion }
  loops           // { loopId, runId, loopNo, startedAt, endedAt }
  events          // { eventId, runId, loopId, seq, type, ... }
  snapshots       // { snapshotId, runId, loopId, eventSeq, state, stateHash, createdAt }
  replayAnchors   // { anchorId, runId, loopNo, clock, location, ... }
```

### 5.2 降级策略

IndexedDB 初始化失败（隐私模式、存储异常、Safari 限制）时：
- 游戏主流程继续运行
- 仅禁用"历史回放接入点"和"多轮历史查看"
- `localStorage` active state 作为最低可用存档
- `RuntimeDB.init()` 异步封装，失败返回 `null`
- 调用方检查 `if (!db) fallbackToLocalStorageOnly()`

### 5.3 runId 生成策略

前端首次创建存档时生成 `runId`（`run_${timestamp}_${random}`），写入 `lt:save:meta` 和 IndexedDB `runs` 表。legacy `START_STATE` 无 `runId`，可在新状态生成时临时挂载 `state.run_id`，但不得影响 Engine 判定逻辑。

---

## 6. Engine 层规格

### 6.1 resumeFromReplayAnchor(previous, anchor, policy)

```js
function resumeFromReplayAnchor(previous, anchor, policy) {
  // 1. 生成基础新轮次状态（复用 nextLoop）
  var next = nextLoop(previous);
  var s = normalize(next.state);

  // 2. 应用接入点状态
  s.clock = anchor.clock;
  s.location = anchor.location || START_STATE.location;
  s.ap_remaining = calculatePrepositionAP(anchor, policy);
  s.flags.intro_seen = true;
  s.dialogue_session = null;
  s.active_npc = null;
  s.mode = 'explore';

  // 3. 标记回放模式
  s.replay = {
    mode: policy && policy.mode ? policy.mode : 'preposition',
    source_loop: anchor.loopNo,
    anchor_id: anchor.anchorId,
    resumed_at: anchor.clock
  };

  // 4. 应用 NPC Memory Echo（通用路径）
  var echoes = buildNpcMemoryEchoes(previous.state, previous.loop_failure_outcome);
  applyNpcMemoryEchoes(s, echoes);

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

### 6.2 calculatePrepositionAP(anchor, policy)

```js
function calculatePrepositionAP(anchor, policy) {
  if (policy && policy.apPolicy === 'free_debug') return START_STATE.ap_remaining;
  if (policy && policy.apPolicy === 'strict_previous') return anchor.apRemaining;

  // 默认 preposition_default
  var minutesFromStart = timeToMinutes(anchor.clock) - timeToMinutes(START_STATE.clock);

  // 14:00 从头开始不扣预定位 AP（但此路径不走 resumeFromReplayAnchor）
  if (minutesFromStart <= 0) return START_STATE.ap_remaining;

  // 每 5 分钟扣 1 AP，最少 1，最多 3
  var cost = Math.max(1, Math.min(3, Math.ceil(minutesFromStart / 5)));
  return Math.max(1, START_STATE.ap_remaining - cost);
}
```

### 6.3 buildNpcMemoryEchoes(prevState, loopOutcome)

```js
function buildNpcMemoryEchoes(prevState, loopOutcome) {
  var echoes = [];
  var ns = prevState.npc_states || {};

  // 小宁 trust >= 45 → trust_residue
  if (ns.xiaoning && ns.xiaoning.trust >= 45) {
    echoes.push({
      echoId: 'echo_xiaoning_trust_l' + (prevState.loop || 1),
      npcId: 'xiaoning',
      sourceLoop: prevState.loop || 1,
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
```

### 6.4 applyNpcMemoryEchoes(state, echoes)

```js
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

### 6.5 nextLoop() 修改

`nextLoop()` 必须在现有继承逻辑后调用 `applyNpcMemoryEchoes()`：

```js
function nextLoop(previous) {
  // ... 现有继承逻辑保持不变 ...

  // 新增：应用 NPC Memory Echo
  var echoes = buildNpcMemoryEchoes(prevState, previous && previous.loop_failure_outcome);
  applyNpcMemoryEchoes(s, echoes);

  // 开场文本增加 Echo 提示
  if (echoes.length > 0) {
    opening += '\n\n你感觉车厢里的气氛和上一次不太一样。';
  }

  return { state: s, opening: opening, suggestions: suggestions(s), goal: currentGoal(s) };
}
```

### 6.6 startDialogue() 修改

`startDialogue()` 必须检查 `npcState.memory_echo`，使用 `openingVariant` 替代默认开场白：

```js
function startDialogue(state, npcId) {
  // ... 现有逻辑 ...
  var npc = NPCS[npcId];
  var ns = s.npc_states[npcId] || {};

  // Memory Echo: 使用 openingVariant 替代默认开场
  var openingText = npc.opening;
  if (ns.memory_echo && ns.memory_echo.openingVariant) {
    var profile = (npc.memory_echo_profile && npc.memory_echo_profile.opening_variants)
      ? npc.memory_echo_profile.opening_variants[ns.memory_echo.openingVariant]
      : null;
    if (profile) openingText = profile;
  }

  // ... 设置 dialogue_session ...
  return {
    state: s,
    ui: { mode: 'dialogue', portrait: npc.portrait, placeholder: '对' + npc.name + '说些什么……' },
    messages: [{ type: 'npc', npc_id: npcId, text: openingText }],
    suggestions: dialogueSuggestions(s),
    goal: currentGoal(s),
  };
}
```

### 6.7 state.replay 字段

```ts
// 新增到 LegacyStandaloneState
interface ReplayState {
  mode: 'preposition';
  source_loop: number;
  anchor_id: string;
  resumed_at: string;     // clock
}

// state.replay 在正常 nextLoop 中为 null/undefined
// 在 resumeFromReplayAnchor 中设置
```

### 6.8 state.npc_memory_echoes 字段

```ts
// 新增到 LegacyStandaloneState
state.npc_memory_echoes: NpcMemoryEcho[];  // 当前轮次应用的 echoes
state.npc_states[npcId].memory_echo: {
  kind: string;
  intensity: number;
  openingVariant: string | null;
  performanceHint: string | null;
};
```

---

## 7. API 层规格

### 7.1 新增端点：POST /api/replay/resume

请求：
```json
{
  "previous": {
    "state": { /* LegacyStandaloneState */ },
    "loop_failure_outcome": { /* 来自 failLoop 返回 */ }
  },
  "anchor": {
    "anchorId": "anchor_l2_14_06_connector_2_3",
    "loopNo": 2,
    "clock": "14:06",
    "location": "connector_2_3",
    "apRemaining": 6,
    "label": "14:06 · 灰衣进入三号车厢方向",
    "summary": "你在这里观察到灰衣进入三号车厢方向",
    "actionType": "observe",
    "storyVersion": "c01-trial-0.3"
  },
  "policy": {
    "mode": "preposition",
    "apPolicy": "preposition_default"
  }
}
```

响应：
```json
{
  "state": {
    "loop": 3,
    "clock": "14:06",
    "location": "connector_2_3",
    "ap_remaining": 7,
    "mode": "explore",
    "dialogue_session": null,
    "active_npc": null,
    "replay": {
      "mode": "preposition",
      "source_loop": 2,
      "anchor_id": "anchor_l2_14_06_connector_2_3",
      "resumed_at": "14:06"
    },
    "npc_memory_echoes": [/* ... */],
    "player_timeline": {
      "entries": [/* memory entries, current_loop_verified=false */],
      "inferences": [/* inherited */]
    }
  },
  "opening": "你猛地睁开眼。\n\n连接处，14:06。\n\n你已经知道上一轮这里会发生异常...",
  "replay_resume_outcome": {
    "anchor": {/* */},
    "inherited_memory_count": 5,
    "note": "上一轮记忆已带入，但仍需本轮重新验证关键证据。"
  },
  "suggestions": [/* */],
  "goal": {/* */}
}
```

### 7.2 修改现有端点

**POST /api/loop/next**：响应中增加 `npc_memory_echoes` 字段（Echo 通过 `nextLoop()` 内部应用）。

**GET /api/health**：`version` 字段改为 `LT_APP_VERSION`（`"0.12.0"`），新增 `release_channel`、`release_name`、`story_version`、`save_schema_version` 字段。

---

## 8. LLM Prompt 层规格

### 8.1 buildNpcPrompt() 修改

`buildNpcPrompt()` 增加 `memory_echo` 段落（仅当 `npcState.memory_echo` 存在时）：

```js
function buildNpcPrompt(npcId, playerText, state) {
  // ... 现有逻辑 ...

  var ns = state.npc_states[npcId] || {};
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

  return prompt;
}
```

### 8.2 LLM Echo Guard

新增 `guardLlmEchoReply(reply, npcId, state)` 函数，在 `cleanLlmReply()` 之后执行：

```js
function guardLlmEchoReply(reply, npcId, state) {
  var ns = state.npc_states[npcId] || {};
  if (!ns.memory_echo) return reply;  // 无 echo 时跳过

  var profile = (NPCS[npcId] && NPCS[npcId].memory_echo_profile) || {};
  var forbidden = ['上一轮', '循环', '轮回', '我记得你', '上次你', '你又来了'];
  var forbiddenReveals = profile.forbidden_reveals || [];

  // 检查禁词
  for (var i = 0; i < forbidden.length; i++) {
    if (reply.indexOf(forbidden[i]) >= 0) return null;
  }

  // 检查 forbidden_reveals（根据 profile 中的关键词列表）
  // bomb_location: "炸弹" "爆炸物" "炸弹位置"
  // player_identity: "你是间谍" "你是特工" "情报"
  // loop_mechanic: "时间循环" "你被困在" "循环"
  var revealKeywords = {
    bomb_location: ['炸弹', '爆炸物', '炸弹位置'],
    player_identity: ['你是间谍', '你是特工', '情报员'],
    loop_mechanic: ['时间循环', '你被困在', '循环里']
  };
  for (var j = 0; j < forbiddenReveals.length; j++) {
    var keywords = revealKeywords[forbiddenReveals[j]] || [];
    for (var k = 0; k < keywords.length; k++) {
      if (reply.indexOf(keywords[k]) >= 0) return null;
    }
  }

  return reply;
}
```

**回退策略**：若 `guardLlmEchoReply()` 返回 `null`，丢弃 LLM 回复，回退到 Engine deterministic dialogue variant（使用 `openingVariant` 对应的预设回复）。

---

## 9. UI 状态设计

### 9.1 失败结算卡扩展

失败结算卡在现有"带入下一轮的记忆"和"进入第 N 轮"之间，新增"下一轮接入点"区域：

```text
循环失败

你没能在爆炸前证明异常。

带入下一轮的记忆
- 小宁听见过地板下方声音
- 灰衣乘客 14:04 经过二号车厢

下一轮接入点                              ← 新增
[14:00 从头开始]         [14:02 小宁返回]
[14:04 灰衣经过]         [14:06 灰衣进入三号]
[14:08 金属碰撞声]

进入第 3 轮
```

### 9.2 ReplayAnchorPicker 组件

| 属性 | 值 |
|------|-----|
| 位置 | 失败结算卡内，"带入记忆"和"进入下一轮"之间 |
| 样式 | 横向流式布局，每个锚点为可点击卡片 |
| 默认选中 | `[14:00 从头开始]` |
| 点击行为 | 高亮选中，展示详情面板 |
| 确认行为 | 点击"进入第 N 轮"时，根据选中锚点决定调用 `/api/loop/next` 或 `/api/replay/resume` |

锚点卡片内容：
```text
14:06 · 连接处
上一轮你在这里观察到：灰衣进入三号车厢方向。
本轮接入后：该信息仍只是记忆，不算本轮证据。
```

### 9.3 NPC 开场 Echo 表现

当 NPC 有 `memory_echo` 时，开场白使用 `openingVariant` 对应的预设文本。对话气泡上方可显示微弱的视觉提示（如轻微的光晕或波纹效果），暗示 NPC 状态与往常不同。

### 9.4 IndexedDB 不可用时的 UI

当 `RuntimeDB.init()` 返回 `null` 时：
- 失败结算卡不显示"下一轮接入点"区域
- 只显示 `[14:00 从头开始]` + "进入第 N 轮"按钮
- 控制台输出 warning：`RuntimeDB unavailable, replay disabled`

---

## 10. 兼容性与存档影响

### 10.1 存档版本升级

| 项 | v1 (旧) | v2 (新) |
|----|---------|---------|
| 存储位置 | localStorage only | localStorage (active state) + IndexedDB (历史) |
| schema version | 1 | 2 |
| state.replay | 不存在 | 新增字段 |
| state.npc_memory_echoes | 不存在 | 新增字段 |
| state.npc_states[id].memory_echo | 不存在 | 新增字段 |

### 10.2 旧存档迁移

- `LT_SAVE_SCHEMA_VERSION = 2`，`LT_MIN_COMPATIBLE_SCHEMA_VERSION = 2`
- 旧 schema v1 存档触发 breaking change 检测，自动重置
- 重置后生成新 `runId`，写入 `lt:save:meta`
- 不做 v1 → v2 数据迁移（试玩阶段，存档可丢弃）

### 10.3 storyVersion 兼容

- 当前 `LT_STORY_VERSION` 从 `'demo-0.8-handeng'` 改为 `'c01-trial-0.3'`
- 旧 ReplayAnchor 的 `storyVersion` 不匹配 → `replayable = false`
- IndexedDB 初始化时批量检查并标记

### 10.4 现有成功路径保护

- 原始 14:00 开始 → 观察 → 对话 → 检查 → 说服赵乘警路径必须仍然可用
- `canConvinceZhao()` 逻辑不变
- `evaluateEvidence()` 逻辑不变
- Memory Echo 不影响证据评分

---

## 11. 涉及文件变更

### 11.1 修改文件

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `looptrain/standalone/engine.js` | 修改 | 新增 `resumeFromReplayAnchor`、`calculatePrepositionAP`、`buildNpcMemoryEchoes`、`applyNpcMemoryEchoes`、`buildReplayOpening`；修改 `nextLoop`（加 Echo）、`startDialogue`（加 openingVariant） |
| `looptrain/standalone/server.js` | 修改 | 新增 `/api/replay/resume`；修改 `/api/health` 版本字段；修改 `/api/loop/next` 响应加 echo 字段 |
| `looptrain/standalone/public/app.js` | 修改 | 版本常量更新；`submitInput()`/`handleResponse()`/`handleObserveResponse()` 加 `recordEvent()`；`nextLoop()` 补 `saveState()`；失败结算加 ReplayAnchorPicker |
| `looptrain/standalone/public/style.css` | 修改 | ReplayAnchorPicker 样式、Echo 视觉提示 |
| `looptrain/standalone/llm/prompt.js` | 修改 | `buildNpcPrompt()` 加 echo 段落 |
| `looptrain/standalone/llm/providers.js` | 修改 | 新增 `guardLlmEchoReply()`；LLM 回复管线增加 echo guard |
| `looptrain/materials/runtime/characters/xiaoning.json` | 修改 | 新增 `memory_echo_profile` |
| `looptrain/materials/runtime/characters/gray_passenger.json` | 修改 | 新增 `memory_echo_profile` |
| `looptrain/materials/runtime/characters/zhao_police.json` | 修改 | 新增 `memory_echo_profile` |

### 11.2 新增文件

| 文件 | 说明 |
|------|------|
| `looptrain/standalone/public/runtime-db.js` | IndexedDB 封装（init, read, write, 降级） |
| `looptrain/standalone/public/runtime-recorder.js` | 事件记录器（recordEvent, buildReplayAnchor, buildSnapshot） |
| `looptrain/standalone/public/components/replay-anchor-picker.js` | ReplayAnchorPicker UI 组件 |

### 11.3 测试文件

| 文件 | 说明 |
|------|------|
| `looptrain/standalone/tests/replay_resume_test.js` | `resumeFromReplayAnchor` + AP 计算 + memory 继承测试 |
| `looptrain/standalone/tests/npc_memory_echo_test.js` | Echo 生成 + 应用 + 不影响成功条件测试 |
| `looptrain/standalone/tests/llm_echo_guard_test.js` | LLM Echo Guard 禁词检测测试 |
| `looptrain/standalone/tests/e2e/replay-flow.spec.js` | 回放流程 E2E 测试 |

---

## 12. 验收标准

### AC-1: 版本号体系

- [ ] `app.js` 定义 `LT_APP_VERSION`、`LT_RELEASE_CHANNEL`、`LT_RELEASE_NAME`、`LT_STORY_VERSION`、`LT_SAVE_SCHEMA_VERSION`、`LT_MIN_COMPATIBLE_SCHEMA_VERSION`
- [ ] `server.js` `/api/health` 返回新版本字段
- [ ] 旧的 `LT_RUNTIME_VERSION` 不再使用

### AC-2: Engine — resumeFromReplayAnchor

- [ ] 从 14:06 接入后 `loop` + 1
- [ ] `clock` = "14:06"，`location` = "connector_2_3"
- [ ] 继承的 timeline entries 全部 `source_type='memory'`、`current_loop_verified=false`、`counts_as_current_evidence=false`
- [ ] AP = 10 - ceil(6/5) = 10 - 2 = 8（14:06 距 14:00 为 6 分钟，ceil(6/5)=2）
- [ ] `dialogue_session = null`，`active_npc = null`，`mode = 'explore'`
- [ ] `state.replay` 正确设置
- [ ] `[14:00 从头开始]` 走普通 `nextLoop()`，不扣预定位 AP

### AC-3: Engine — NPC Memory Echo

- [ ] 小宁 `trust >= 45` 时生成 `trust_residue`，`trustDelta = 5`
- [ ] 灰衣 `suspicion >= 50` 时生成 `suspicion_residue`，`suspicionDelta = 8`
- [ ] 赵乘警 `trust >= 30` 且 `zhao_checked_floor = true` 时生成 `emotional_residue`
- [ ] `nextLoop()` 和 `resumeFromReplayAnchor()` 都应用 Echo
- [ ] Echo 不触发 `CLUE_UNLOCKED`、不改变 `canConvinceZhao()` 结果
- [ ] `startDialogue()` 使用 `openingVariant` 替代默认开场白

### AC-4: Engine — snapshot 不直接 apply

- [ ] `resumeFromReplayAnchor` 不读取 `snapshotId` 对应的完整 state
- [ ] 只读取 anchor 的 `clock`、`location`、`loopNo` 等元信息

### AC-5: API 层

- [ ] `POST /api/replay/resume` 正确返回新轮次状态
- [ ] `previous` 参数结构为 `{ state, loop_failure_outcome }`
- [ ] `GET /api/health` 返回新版本字段

### AC-6: IndexedDB

- [ ] 事件流正确记录到 IndexedDB
- [ ] 快照可写入和读取
- [ ] ReplayAnchor 可写入和读取
- [ ] IndexedDB 不可用时游戏主流程继续运行
- [ ] `storyVersion` 不匹配的 anchor `replayable = false`

### AC-7: LLM Echo Guard

- [ ] `buildNpcPrompt()` 在有 echo 时增加残响段落
- [ ] `guardLlmEchoReply()` 检测到禁词时返回 null
- [ ] 禁词命中后回退到 Engine deterministic variant
- [ ] 无 echo 时 `guardLlmEchoReply` 跳过（不影响正常对话）

### AC-8: UI

- [ ] 失败结算卡显示"下一轮接入点"区域
- [ ] ReplayAnchorPicker 展示上一轮 anchors
- [ ] 选中非 14:00 锚点后点击"进入第 N 轮"调用 `/api/replay/resume`
- [ ] 选中 14:00 锚点调用 `/api/loop/next`
- [ ] IndexedDB 不可用时不显示接入点区域

### AC-9: 现有路径保护

- [ ] 现有 6 个引擎测试全部通过
- [ ] 现有 4 个 Playwright E2E 测试全部通过
- [ ] 原始成功路径（观察 → 对话 → 检查 → 说服赵乘警）仍然可用

### AC-10: 前端 bugfix

- [ ] `nextLoop()` 在 `state = res.state` 后调用 `saveState()`（修复当前遗漏）

---

## 13. 风险与缓解

| 风险 | 程度 | 缓解 |
|------|------|------|
| LLM 说出"上一轮""循环"等禁词 | HIGH | `guardLlmEchoReply()` 强制检测 + 回退 deterministic variant |
| IndexedDB 在移动端不可用 | MEDIUM | 降级策略：游戏主流程继续，只禁用回放 |
| 旧存档 schema v1 不兼容 | LOW | 试玩阶段可重置，breaking change 检测自动处理 |
| Echo 数值偏移导致成功路径过快 | MEDIUM | Echo 只影响 trust/fear/suspicion ±5~8，不影响证据评分和 `canConvinceZhao()` |
| ReplayAnchor 生成过多导致 UI 拥挤 | LOW | 只展示关键行动边界锚点（observe/dialogue/move/inference/failure） |
| storyVersion 变化后旧 anchor 全部失效 | LOW | 设计预期行为，UI 显示"版本不兼容"提示 |

---

## 14. Agent 实施铁律（从 00-idea.md 继承）

1. 不得把 Replay Anchor 对应的 snapshot 直接 apply 到新轮次状态
2. 不得让上一轮 memory 自动变成本轮 evidence
3. 不得让 LLM 直接修改 state、AP、clock、location、known_clues、player_timeline、npc_states、success/failure
4. NPC Memory Echo 不等于 NPC 记得上一轮——NPC 不得说"上一轮""循环""我记得你""你又来了"
5. Memory Echo 不得直接解锁线索，不得直接改变成功条件，不得让赵乘警绕过证据检查直接行动
6. Replay 功能不得破坏当前试玩版成功路径
7. IndexedDB 是历史事件与快照存储，不得替代 Engine 裁判
8. 所有新增能力必须兼容当前 storyVersion

---

*本规格是 00-idea.md 的细化展开。如实施过程中发现规格不可行，需回退到 idea 阶段重新评估。*
