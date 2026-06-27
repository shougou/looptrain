# Idea: 时间线回放与 NPC 记忆污染（Echo 残响）系统

## 背景

当前 LoopTrain 试玩版（v0.11.0）在循环失败后的体验是：失败结算卡展示失败原因、本轮确认信息和带入下一轮的记忆，然后玩家点击“进入第 N 轮”，系统从 14:00 重置所有状态（AP、clock、location、dialogue_session、active_npc、NPC 初始状态），但继承 `known_clues`、`carried_memory`、可带入的 `player_timeline.entries`（转为 `source_type: 'memory'`、`current_loop_verified: false`、`counts_as_current_evidence: false`），以及 `player_timeline.inferences`。

这个流程存在两个体验问题：

1. **重复劳动感**：玩家需要重新走一遍上一轮已经证明为无效的探索路径（例如重复观察小宁、重复检查座位下方）。每次循环的“开始阶段”高度相似，导致多轮后的体验趋于机械。
2. **NPC 无生命感**：NPC 在每一轮都以完全相同的初始状态出现（小宁开场：“你……也听见了吗？”），尽管玩家已经和她进行过 3 轮深入对话。NPC 没有表现出任何“被多轮交互所影响”的直觉或情绪残响。

时间循环叙事的核心张力是：只有玩家记得，世界不记得。但如果世界真的**完全**不记得，玩家会快速厌倦重复。设计的目标不是让 NPC 获得完整记忆（这会破坏核心谜题结构），而是让 NPC 在玩家的多轮行动后产生 **Echo（残响）**——一种无法解释的感觉、似曾相识的情绪、或微妙的直觉偏移。这让玩家感到“这个世界确实被我触碰过”，同时不泄露关键谜题信息。

## 目标

1. **时间线回放（Timeline Replay）**：一轮循环失败/结束后，玩家可以浏览上一轮的行动时间线，选择其中一个时间点（或行动节点）作为“接入点”，以新轮次的身份从该时间点附近继续调查，而不是从 14:00 从头开始。

2. **NPC 记忆污染（NPC Memory Echo）**：NPC 在玩家进行了多轮循环、并且玩家与 NPC 建立了某种深度交互（信任、恐惧、怀疑达到阈值）后，会在下一轮开场时表现出**情绪残响**。这种残响不是完整记忆，而是类似“既视感”或“莫名的熟悉/警惕感”。NPC 会因此改变初始对话语气、初始情绪数值，甚至解锁新的对话选项，但 NPC 自己**不会解释为什么**，也不会说出他不可能知道的事实。

3. **保持 Engine 是唯一裁判**：所有状态改变（包括回放接入后的 AP 扣减、NPC 情绪变化、线索验证状态）必须由 Engine 计算，不能由 LLM 或前端自行决定。

4. **保持记忆≠证据的哲学**：从回放接入点带入上一轮的时间线信息，默认是“记忆”而非“本轮已验证证据”。玩家仍需要在本轮中重新执行关键行动来“激活”这些记忆为有效证据。

## 非目标

1. **不做完整的“视频回放”或“世界状态精确重演”**：不是让上一轮从 14:00 到 14:06 的每一步自动播放一遍。而是“选择接入点 → 生成新轮次状态 → 从该时间点开始手动继续”。

2. **不做 LLM 的自由发挥污染**：NPC 的情绪变化不能由 LLM 根据上下文自行“编造”。必须有 Engine 生成的结构化 `memory_echo` 数据，LLM 只负责根据这个数据调整表演语气。

3. **不破坏现有成功路径**：试玩版当前的“观察小宁 → 对话获得线索 → 检查座位下方 → 说服赵乘警”成功路径必须仍然可用。回放功能应该让这条路径**更快到达**，而不是替代它。

4. **不做跨循环的永久存档共享**：MVP 阶段不要求把玩家的多轮历史上传到服务器或分享给其他玩家。浏览器端 IndexedDB 即可。

## 初步想法

### 时间线回放（Timeline Replay）

#### 核心概念：Replay Anchor（回放锚点）

在每一轮循环中，系统在关键行动边界自动生成“回放锚点”：

- 每次观察行动结束后（`handleObserveResponse`）
- 每次对话结束后（`endDialogue`）
- 每次移动/位置变化后
- 玩家获得关键线索后
- 失败结算前

锚点数据结构：

```ts
type ReplayAnchor = {
  anchorId: string;          // 唯一标识
  runId: string;
  loopNo: number;            // 来源轮次
  
  clock: string;             // 14:04
  location: string;          // carriage_2 / connector_2_3
  apRemaining: number;     // 当时剩余 AP
  
  label: string;             // UI 展示标签："14:04 · 灰衣经过二号车厢"
  summary: string;           // 简短描述："你在这里观察到灰衣进入三号车厢方向"
  
  actionType: 'observe' | 'dialogue' | 'move' | 'inference' | 'failure';
  
  snapshotId: string;        // 对应完整 state 快照（仅用于调试和 Phase 2 strict_replay，MVP preposition 模式禁止直接 apply 此 snapshot）
  eventSeq: number;          // 在事件流中的序号
  
  runtimeVersion: string;    // 对应 SLT 版本号（如 v0.11.0-newbie-ui-unlock）
  storyVersion: string;      // 对应剧情内容版本（如 demo-0.8-handeng）
  contentHash?: string;      // 可选：时间线事件数据的 hash，用于内容变更检测
  
  replayable: boolean;       // 是否允许作为接入点（storyVersion 不一致时自动设为 false）
  risk: 'safe' | 'dialogue_boundary' | 'unsafe'; // 接入风险等级
};
```

#### 接入模式：预定位（Preposition）

玩家选择锚点后，系统**不是**复刻上一轮的所有操作，而是生成一个全新的轮次状态：

```js
state.loop = previous.loop + 1;
state.clock = anchor.clock;
state.location = anchor.location;
state.ap_remaining = calculatePrepositionAP(anchor);

// 上一轮时间线转为记忆，不是证据
state.player_timeline.entries = carryTimelineAsMemory(previous);
state.player_timeline.entries.forEach(e => {
  e.current_loop_verified = false;
  e.counts_as_current_evidence = false;
});

state.replay = {
  mode: 'preposition',
  source_loop: anchor.loopNo,
  anchor_id: anchor.anchorId,
  resumed_at: anchor.clock
};
```

AP 计算策略（默认）：

```js
function calculatePrepositionAP(anchor) {
  const minutesFromStart = timeToMinutes(anchor.clock) - timeToMinutes('14:00');
  
  // 14:00 从头开始，不扣预定位 AP
  if (minutesFromStart <= 0) {
    return START_STATE.ap_remaining;
  }
  
  // 从 14:00 到接入点的分钟数，每 5 分钟扣 1 AP，最少 1，最多 3
  const prepositionCost = Math.max(1, Math.min(3, Math.ceil(minutesFromStart / 5)));
  return Math.max(1, START_STATE.ap_remaining - prepositionCost);
}
```

注意： `[14:00 从头开始]` 是特殊入口，直接调用普通 `nextLoop()`，不走 `resumeFromReplayAnchor()`。因此也不会触发预定位 AP 扣减。其他时间点走预定位接入，才按上述策略扣减。执行 `resumeFromReplayAnchor` 时，必须同时设置 `s.dialogue_session = null` 和 `s.active_npc = null`，确保不继承上一轮未完成的对话上下文。

叙事解释：

> 你已经知道上一轮 14:06 连接处会发生异常，于是这一次醒来后没有再重复无效询问，而是直接提前守到了那里。

**snapshot 使用限制**：`snapshotId` 仅用于调试、回看和 Phase 2 的 `strict_replay`，不得在 MVP preposition 模式中直接 apply 上一轮 snapshot。MVP 接入点只读取 anchor 的 `clock`、`location`、`label`、`summary`、`sourceLoop` 等元信息，再由 Engine 基于 `nextLoop()` 生成新轮次状态。直接 apply 旧 snapshot 会破坏 `memory≠evidence` 的哲学，导致上一轮已验证线索被错误地继承为本轮证据。

#### 失败结算 UI 扩展

失败结算卡增加“时间线接入点”区域：

```text
循环失败

你没能在爆炸前证明异常。

带入下一轮的记忆
- 小宁听见过地板下方声音
- 灰衣乘客 14:04 经过二号车厢
- 灰衣乘客与三号车厢异常有关

下一轮接入点
[14:00 从头开始]           [14:02 小宁从三号车厢方向回来]
[14:04 灰衣经过二号车厢]   [14:06 灰衣进入三号车厢方向]
[14:08 三号车厢金属碰撞声]

进入第 3 轮
```

每个接入点 hover/点击后展示：

```text
14:06 · 连接处
上一轮你在这里观察到：灰衣进入三号车厢方向。
本轮接入后：该信息仍只是记忆，不算本轮证据。
建议：立即守点观察，重新验证。
```

#### 存储层：IndexedDB 事件流

前端增加 `RuntimeDB`（IndexedDB）：

```ts
stores:
  meta          // 游戏元数据
  runs          // 运行记录
  loops         // 轮次记录
  events        // 事件流（RuntimeEvent）
  snapshots     // 状态快照
  replayAnchors // 回放锚点
  branches      // 分支记录（Phase 2）
```

每次行动后写入事件 + 快照 + 锚点。`localStorage` 只保留当前 active state 和轻量 meta，完整历史交给 IndexedDB。

当前 `saveState()` 是天然切入点：在 `handleResponse()`、`handleObserveResponse()`、`nextLoop()`、`failLoop()` 后统一调用事件记录。

### NPC 记忆污染（NPC Memory Echo）

#### 核心概念：Memory Echo（记忆残响）

NPC 不是“记得上一轮”，而是产生 **无法解释的残响**：

- **既视感（déjà vu）**：NPC 觉得玩家“似曾相识”，但说不清原因
- **情绪残响（emotional residue）**：上一轮建立的高信任/高恐惧，会以微妙的直觉形式延续
- **路线扰动（route disturbance）**：对玩家行为模式产生隐约预判（高阶，Phase 2）

#### 数据结构

```ts
type NpcMemoryEcho = {
  echoId: string;
  npcId: string;
  sourceLoop: number;        // 产生于哪一轮
  sourceEventIds: string[]; // 来源于哪些事件
  
  kind: 'deja_vu' | 'emotional_residue' | 'suspicion_residue' | 'trust_residue' | 'fear_residue' | 'route_disturbance';
  intensity: number;         // 0~100
  valence: 'positive' | 'negative' | 'mixed';
  
  visibleToPlayer: boolean; // 是否影响玩家可见的 NPC 表现
  canAffectDialogue: boolean; // 是否影响对话建议选项
  canAffectNpcState: boolean; // 是否影响 trust/fear/suspicion 数值
  
  modifiers: {
    trustDelta?: number;     // 初始信任偏移
    fearDelta?: number;      // 初始恐惧偏移
    suspicionDelta?: number; // 初始怀疑偏移
    composureDelta?: number; // 初始镇定偏移
    openingVariant?: string; // 开场白变体 ID
    suggestionVariant?: string; // 对话建议变体 ID
  };
  
  expiresAfterLoops?: number; // 几轮后消失（MVP 可暂不实现）
};
```

#### NPC 污染配置（JSON 素材）

每个 NPC 在 `materials/runtime/characters/` 中增加 `memory_echo_profile`：

```json
{
  "id": "xiaoning",
  "memory_echo_profile": {
    "susceptibility": 0.75,
    "allowed_effects": ["trust_residue", "fear_residue", "deja_vu"],
    "forbidden_reveals": ["bomb_location", "player_identity", "loop_mechanic"],
    "max_trust_delta_per_loop": 8,
    "max_fear_delta_per_loop": 10
  }
}
```

#### 污染生成规则（Engine 层）

所有进入下一轮的路径（`nextLoop()` 正常进入、或 `resumeFromReplayAnchor()` 预定位接入）都统一走 `buildNpcMemoryEchoes()` + `applyNpcMemoryEchoes()`。Memory Echo 是“下一轮状态生成”的通用步骤，不是 Replay 专属能力。

```js
function buildNpcMemoryEchoes(prevState, loopOutcome) {
  const echoes = [];
  
  // 小宁信任度 >= 45，产生信任残响
  if (prevState.npc_states.xiaoning?.trust >= 45) {
    echoes.push({
      npcId: 'xiaoning',
      kind: 'trust_residue',
      intensity: 35,
      modifiers: {
        trustDelta: 5,
        fearDelta: -3,
        openingVariant: 'xiaoning_dejavu_soft'
      }
    });
  }
  
  // 灰衣怀疑度 >= 50，产生警惕残响
  if (prevState.npc_states.gray_passenger?.suspicion >= 50) {
    echoes.push({
      npcId: 'gray_passenger',
      kind: 'suspicion_residue',
      intensity: 50,
      modifiers: {
        suspicionDelta: 8,
        composureDelta: -5,
        openingVariant: 'gray_remembers_pressure'
      }
    });
  }
  
  return echoes;
}
```

应用规则：

```js
function applyNpcMemoryEchoes(state, echoes) {
  state.npc_memory_echoes = echoes;
  
  for (const echo of echoes) {
    const npcState = state.npc_states[echo.npcId];
    if (!npcState) continue;
    
    npcState.trust = clamp((npcState.trust || 0) + (echo.modifiers.trustDelta || 0), -100, 100);
    npcState.fear = clamp((npcState.fear || 0) + (echo.modifiers.fearDelta || 0), 0, 100);
    npcState.suspicion = clamp((npcState.suspicion || 0) + (echo.modifiers.suspicionDelta || 0), 0, 100);
    npcState.composure = clamp((npcState.composure || 0) + (echo.modifiers.composureDelta || 0), 0, 100);
    
    npcState.memory_echo = {
      kind: echo.kind,
      intensity: echo.intensity,
      openingVariant: echo.modifiers.openingVariant
    };
  }
}
```

#### 对 LLM Prompt 的影响

`buildNpcPrompt()` 增加 `memory_echo` 段落：

```js
const echo = getNpcMemoryEcho(state, npcId);

const echoText = echo
  ? `
【轮回残响】
你并不清楚上一轮发生了什么，也不能说“我记得上一轮”。
但你对玩家产生了某种无法解释的感觉：
- 类型：${echo.kind}
- 强度：${echo.intensity}/100
- 表演方向：${echo.performanceHint}

你只能把它表现为语气、迟疑、警惕、熟悉感或情绪变化。
你不能因此透露自己不可能知道的事实。
你不能说“上一轮”“循环”“我记得你”。
你只能说“我是不是在哪里见过你”“你刚才的眼神让我不太舒服”
“不知道为什么，我觉得你不像坏人”。
`
  : '';
```

#### 对 NPC 体验的影响（MVP 范围）

Memory Echo 必须同时影响两个入口：

1. **Engine 层 `startDialogue()` / opening resolver**：决定 NPC 初始开场白、初始建议项、初始 trust/fear/suspicion 数值偏移。即使 `LLM_DISABLED` 或 Mock 模式下，Memory Echo 也必须在 Engine 的 deterministic dialogue fallback 中生效。
2. **LLM Prompt 层 `buildNpcPrompt()`**：仅用于后续自由对话时的语气表演，由 LLM 根据 `memory_echo` 数据调整回复风格，但不得改变 Engine 已计算的状态。

第一版只影响三类表现：

1. **开场语气**：小宁更容易相信你（温柔迟疑）；灰衣更快警觉（目光锐利）；赵乘警觉得你“像是早有准备”（微妙审视）。
2. **初始情绪数值**：trust、fear、suspicion 小幅变化（±5~8）。
3. **对话建议**：解锁“你是不是也觉得这一幕发生过？”等轻量话题（仅当 intensity >= 40）。

**不**影响：
- NPC 行动路线（灰衣不会因为被多轮观察就改变路线——这需要 timeline_variant 机制，Phase 2）
- 成功/失败条件（赵乘警不会因为 echo 就直接检查地板）
- 线索解锁（echo 本身不直接给线索）

**Memory Echo 是“下一轮进入”的通用能力，不是 Replay 专属**。无论玩家从 14:00 正常进入下一轮，还是选择 Replay Anchor 预定位接入，都必须应用同一套 `buildNpcMemoryEchoes()` + `applyNpcMemoryEchoes()`。

### 后端 Engine 新增接口

```js
// server.js 新增
app.post('/api/replay/resume', (req, res) => {
  const { previous, anchor, policy } = req.body || {};
  res.json(engine.resumeFromReplayAnchor(previous, anchor, policy));
});
```

其中 `previous` 固定结构为：

```ts
type PreviousLoopContext = {
  state: LegacyStandaloneState;
  loop_failure_outcome?: LoopFailureOutcome;
};
```

Engine 新增函数：

```js
function resumeFromReplayAnchor(previous, anchor, policy) {
  // 1. 生成基础新轮次状态（同 nextLoop，previous 结构统一）
  const next = nextLoop(previous);
  const s = normalize(next.state);
  
  // 2. 应用接入点状态
  s.clock = anchor.clock;
  s.location = anchor.location || START_STATE.location;
  s.ap_remaining = calculatePrepositionAP(anchor, policy);
  s.flags.intro_seen = true; // 跳过开场
  s.dialogue_session = null; // 不继承上一轮对话
  s.active_npc = null;
  s.mode = 'explore';
  
  // 3. 标记回放模式
  s.replay = {
    mode: policy?.mode || 'preposition',
    source_loop: anchor.loopNo,
    anchor_id: anchor.anchorId,
    resumed_at: anchor.clock
  };
  
  // 4. 应用 NPC Memory Echo（通用路径，与正常 nextLoop 共用）
  applyNpcMemoryEchoes(s, buildNpcMemoryEchoes(previous.state, previous.loop_failure_outcome));
  
  return {
    state: s,
    opening: buildReplayOpening(s, anchor), // 叙事包装文本
    replay_resume_outcome: {
      anchor,
      inherited_memory_count: s.player_timeline.entries.length,
      note: '上一轮记忆已带入，但仍需本轮重新验证关键证据。'
    },
    suggestions: suggestions(s),
    goal: currentGoal(s)
  };
}
```

### 前端改动点

1. **新增 `runtime-db.js` / `runtime-recorder.js`**：IndexedDB 封装 + 事件记录
2. **修改 `app.js`**：在 `submitInput()`、`handleResponse()`、`handleObserveResponse()`、`nextLoop()`、`failLoop()` 后调用 `recordEvent()`；补充 `nextLoop()` 在 `state = res.state` 后调用 `saveState()`（当前遗漏，刷新后可能丢失刚进入的新轮次状态）
3. **修改 `renderFailureOutcome()` / `ArchiveSheet`**：展示时间线接入点 UI
4. **新增 `ReplayAnchorPicker` 组件**：时间线选择器（可复用 `timeline` 组件风格）
5. **修改 `buildNpcPrompt()`**：接入 `memory_echo` 数据，作为 LLM 自由对话时的语气表演指令

### 测试重点

1. **从 14:06 接入后**：
   - `loop` + 1
   - `clock` / `location` 正确
   - 继承的 timeline 是 memory，不是 evidence
   - AP 扣减符合 policy
   - 不继承 `dialogue_session`

2. **NPC Memory Echo**：
   - 小宁 trust residue 只小幅改变 opening / trust / fear
   - 灰衣 suspicion residue 只影响警觉，不直接改变成功条件
   - 赵乘警不会因为 echo 直接检查地板
   - LLM prompt 不允许说“我记得上一轮”

3. **IndexedDB**：
   - 事件流正确记录
   - 快照可恢复
   - 刷新页面后历史不丢失

4. **Memory Echo 不生成线索**：
   - Memory Echo 本身不得触发 `CLUE_UNLOCKED`、`KNOWLEDGE_CONFIRMED`、`player_timeline.entries` 新增 evidence
   - Memory Echo 不得改变 `canConvinceZhao()` 的判断结果（成功条件核心，依赖 physical anomaly / timeline conflict / suspect route / actionable location 等证据评分）
   - Echo 只能影响 NPC 表演、初始情绪数值和对话建议

5. **LLM Echo Guard**：
   - Memory Echo 场景下，LLM 回复必须经过 echo guard
   - 禁止出现：上一轮、循环、轮回、我记得你、上次你、你又来了
   - 禁止出现 NPC `forbidden_reveals` 中定义的事实（如 bomb_location、player_identity、loop_mechanic）
   - 若命中禁词，丢弃 LLM 回复，回退到 Engine deterministic dialogue variant

### 补充规则与边界

#### 事件去重与锚点稳定生成

`ReplayAnchor` 必须基于 `loopNo + eventSeq + actionType + clock + location` 生成稳定 `anchorId`。重复记录同一个 `eventSeq` 时不得创建重复 anchor。事件记录函数 `recordEvent()` 内部应检查 `events` store 中是否已存在同 `eventId`（由 `loopNo + eventSeq + actionType` 计算），存在则跳过写入。

#### storyVersion 绑定与失效规则

当 `storyVersion`（如 `demo-0.8-handeng`）变化时，旧 `replayAnchors` 默认不可作为接入点（`replayable = false`），仅可作为历史记录查看。`ReplayAnchor` 必须携带 `runtimeVersion` 和 `storyVersion` 字段。IndexedDB 初始化时检查当前 `storyVersion` 与历史 anchors 的兼容性，不兼容时标记为不可 replay。

#### IndexedDB 降级策略

如果浏览器 IndexedDB 初始化失败（隐私模式、存储异常、Safari 限制），游戏主流程必须继续运行。仅禁用“历史回放接入点”和“多轮历史查看”能力。`localStorage` active state 仍然作为最低可用存档。`RuntimeDB` 初始化应封装为异步，失败时返回 `null`，调用方检查 `if (!db) fallbackToLocalStorageOnly()`。

#### runId 生成策略

MVP 中 `runId` 由前端在首次创建存档时生成（`run_${timestamp}_${random}`），并同时写入 `lt:save:meta` 和 IndexedDB `runs` 表。legacy `START_STATE` 没有 `runId` 字段，可在新状态生成时临时挂载 `state.run_id` 或 `state.runtime.runId`，但不得影响 Engine 判定逻辑。`runId` 用于关联 events、snapshots、anchors。

## Agent 实施铁律

1. **不得把 Replay Anchor 对应的 snapshot 直接 apply 到新轮次状态**。MVP preposition 模式只能读取 anchor 的 `clock`、`location`、`label`、`summary` 等元信息，再由 Engine 基于 `nextLoop()` 生成新轮次状态。

2. **不得让上一轮 memory 自动变成本轮 evidence**。所有从上一轮继承的 `player_timeline.entries` 必须保持 `source_type='memory'`、`current_loop_verified=false`、`counts_as_current_evidence=false`，除非玩家在本轮重新执行对应验证行动。

3. **不得让 LLM 直接修改 state、AP、clock、location、known_clues、player_timeline、npc_states、success/failure**。LLM 只能生成 NPC 文本；所有状态变化必须由 Engine 计算。

4. **NPC Memory Echo 不等于 NPC 记得上一轮**。NPC 不得说“上一轮”“循环”“我记得你”“你又来了”等显式轮回表达。Echo 只能表现为迟疑、熟悉感、警觉、情绪偏移。

5. **Memory Echo 不得直接解锁线索，不得直接改变成功条件，不得让赵乘警绕过证据检查直接行动**。

6. **Replay 功能不得破坏当前试玩版成功路径**。原始 14:00 开始、观察、对话、检查、说服赵乘警的路径必须仍然可用。

7. **IndexedDB 是历史事件与快照存储，不得替代 Engine 裁判**。IndexedDB 不可用时，游戏主流程必须继续运行，只禁用历史回放能力。

8. **所有新增能力必须兼容当前 storyVersion**。storyVersion 不一致时，旧 Replay Anchor 默认不可作为接入点。

## 讨论记录

- 2026-06-27：用户提出核心需求——循环结束后不是简单重新开始，而是可以选时间线接入点重新进入；NPC 在多轮循环后应有被记忆污染的表现。讨论确认不做完整世界状态重演（视频回放），而是做预定位接入 + 状态继承。NPC 污染不交给 LLM 自由发挥，由 Engine 生成结构化 echo 数据。决定采用 IndexedDB 存储事件流和快照，localStorage 仅保留当前 active state。
- 2026-06-27：评审发现以下语义偏移风险并修正：
  - 背景描述：补充 `nextLoop()` 当前继承的完整内容（`player_timeline.entries` 转 memory、`inferences` 继承），避免 agent 重复实现 carry 逻辑。
  - snapshot 限制：明确 `snapshotId` 不得直接 apply 到新轮次，仅用于调试和 Phase 2 strict_replay。
  - AP 计算：修正 `14:00` 从头开始也扣 1 AP 的 bug，明确 `[14:00 从头开始]` 走普通 `nextLoop()` 不扣预定位 AP。
  - 参数结构：统一 `previous` 参数为 `PreviousLoopContext`（`{ state, loop_failure_outcome }`），与 `nextLoop()` 签名一致。
  - NPC Echo 入口：明确 Echo 必须同时影响 Engine 层 `startDialogue()` / opening resolver 和 LLM Prompt 层 `buildNpcPrompt()`，即使 LLM 禁用也必须在 deterministic fallback 中生效。
  - Memory Echo 通用性：明确 Echo 是“下一轮进入”的通用能力，不是 Replay 专属。
  - 前端函数名：修正 `submitAction()` 为 `submitInput()`，补充 `nextLoop()` 遗漏 `saveState()` 的修复要求。
  - 新增缺失规则：LLM Echo Guard 禁词校验、IndexedDB 降级策略、storyVersion 绑定与失效、事件去重、runId 生成策略、Memory Echo 不得触发线索解锁/成功条件变更。
  - 新增 `Agent 实施铁律` 章节，作为 agent 开发的硬性约束。
