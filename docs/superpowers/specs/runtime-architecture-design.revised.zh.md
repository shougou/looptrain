# LoopTrain Runtime Architecture Design 中文版

**Status:** Frozen implementation baseline for Slice 0  
**Date:** 2026-06-16  
**Scope:** LoopTrain Standalone Runtime 架构、Memory Runtime 边界、CompanionView、Deterministic Assistant Runtime、LLM expression boundary、实施切片与验收标准  
**Repository root:** `11_looptrain/`  
**Canonical spec path:** `docs/runtime-architecture-design.md`  
**Slice 0 primary source path:** `looptrain/standalone/src/runtime/`  
**Current runnable app:** `looptrain/standalone/`  
**Spoiler level:** 内部工程设计。不得作为公开角色材料发布。

---

## 0. Normative Reading Rules

本文档是实现规格，不是头脑风暴记录。

以下词语具有规范含义：

```text
MUST       必须满足的强制要求
MUST NOT   禁止行为
SHOULD     强烈建议，除非有明确理由
MAY        可选行为
```

当不同章节发生冲突时，以以下优先级为准：

```text
Section 4 Frozen Implementation Decisions 和 Section 16 Slice 0 Entry Checklist
  > Section 15 Development Slices
  > API/interface contracts
  > architecture explanation
  > examples
```

Slice 0 阶段，所有仓库路径均以仓库根目录为基准：

```text
11_looptrain/
```

Slice 0 阶段，仓库根目录下的 `src/runtime/` **不启用**。它只是长期迁移目标。

---

## 1. Executive Summary

LoopTrain 必须从当前 standalone SLT 实现，演进为分层 Runtime 架构。

当前可运行游戏位于：

```text
looptrain/standalone/
  server.js
  engine.js
  public/app.js
  llm/
  tests/
```

可复用游戏材料位于：

```text
looptrain/materials/
```

迁移必须采用 strangler pattern，不能一次性大重写：

```text
current looptrain/standalone/engine.js
  ↓
LegacyEngineAdapter
  ↓
new runtime ports and modules
```

目标分层 Runtime：

```text
Memory Runtime
  ↓
CompanionView v1
  ↓
Deterministic Assistant Runtime
  ↓
LLM Expression Layer
  ↓
Cross-loop / Archive / Settlement enhancement
  ↓
later: Companion Action Runtime
```

项目核心铁律：

```text
Engine judges.
Memory records.
CompanionView filters.
Assistant guides.
ActionPlanner recommends.
Settlement explains.
LLM phrases.
Validator gates.
Player decides.
```

第一阶段实现重点不是让许知微自由聊天。

第一阶段实现重点是：

```text
make the runtime prove what 许知微 is allowed to know and say.
```

即：Runtime 必须能证明许知微当前允许知道什么、允许说什么。

---

## 2. Current Project Baseline

### 2.1 Repository layout

仓库根目录为：

```text
11_looptrain/
```

关键路径：

```text
11_looptrain/
├── docs/
│   └── runtime-architecture-design.md
├── looptrain/
│   ├── standalone/
│   │   ├── package.json
│   │   ├── server.js
│   │   ├── engine.js
│   │   ├── public/
│   │   │   ├── index.html
│   │   │   ├── app.js
│   │   │   └── style.css
│   │   ├── llm/
│   │   │   ├── providers.js
│   │   │   └── prompt.js
│   │   └── tests/
│   │       └── smoke_test.js
│   ├── materials/
│   │   └── looptrain/
│   └── tests/
└── scripts/
    ├── start_slt.sh
    └── verify_slt.sh
```

### 2.2 Current standalone runtime

当前 SLT 运行系统主要由以下文件构成：

```text
looptrain/standalone/server.js        # Express backend, API routes, static serving, LLM bridge route
looptrain/standalone/engine.js        # LoopTrain judge engine: AP/time/clues/dialogue/loop rules
looptrain/standalone/public/app.js    # Vanilla JS browser frontend and UI state
looptrain/standalone/llm/providers.js # DeepSeek provider + mock reply + cleanup
looptrain/standalone/llm/prompt.js    # NPC prompt construction
```

当前状态模型是一个 flat snapshot，通常包含：

```text
loop
clock
ap_remaining
known_clues
carried_memory
npc_states
flags
dialogue_session
```

该模型能支撑 v0.5 playable loop，但不是完整 Memory Runtime。它混合了不同生命周期的数据：

- immediate engine state；
- confirmed player knowledge；
- carried-over loop memory；
- NPC relationship state；
- temporary dialogue state；
- internal flags。

新 Runtime 必须拆分这些职责。

---

## 3. Non-Negotiable Runtime Laws

以下 Runtime Laws 适用于所有实现。任何代码、prompt、模板、UI 逻辑都不得违反。

### Law 1: Engine owns facts

只有 Game Engine / Settlement Runtime 可以创建 authoritative facts。

LLM、Assistant Runtime、Companion Runtime、UI、storage layer 都不能创建或修改事实。

facts 包括：

```text
AP
time
clue unlock state
action success/failure
NPC state
scene state
loop outcome
relationship changes
available interaction targets
```

### Law 2: LLM owns expression only

LLM 只能在安全 envelope 内生成自然语言表达。

LLM 禁止：

```text
write Knowledge
write Belief
trigger actions
create recommended actions
summarize settlement as authoritative fact
reveal hidden truth
modify AP/time/clue state/NPC state/relationship state/loop outcome
```

### Law 3: Assistant reads only CompanionView

Assistant Runtime 不得读取：

```text
raw Memory Runtime state
raw Engine state
IndexedDB stores
hidden truth documents
raw Event Log
full script truth
```

Assistant Runtime 唯一 state input 是：

```text
CompanionView
```

### Law 4: Recommended actions only come from ActionPlanner

Assistant 输出可以展示 recommended actions，但这些 actions 必须来自：

```text
ActionRegistry -> ActionPlanner -> OutputValidator -> ResponseRenderer
```

LLM 和 templates 都不能发明 action IDs。

### Law 5: Settlement only comes from Settlement Runtime

Dialogue settlement 和 loop settlement 必须来自 structured Engine / Settlement output。

Assistant 通过 `AssistantSettlementReader` 读取 settlement。

LLM 不得总结 raw dialogue history 并把总结当成 authoritative fact。

### Law 6: Belief is not Knowledge

Knowledge 是 confirmed fact。Belief 是 inferred，可以错误。

Assistant 可以提到 Belief，但必须使用 uncertainty language。

允许：

```text
“这还不是证据，但它值得验证。”
```

禁止：

```text
“这就证明他是凶手。”
```

### Law 7: Output is untrusted until validated

所有输出在进入 UI 前都必须通过 Validator。

这包括 deterministic templates 和 LLM output。

### Law 8: LLM can be disabled

Runtime 必须在以下配置下仍然可用：

```text
LT_LLM_PROVIDER=disabled
```

### Law 9: Player agency remains final

Assistant 可以推荐候选行动，但不得执行行动，也不得把某个答案表达为唯一正确答案。

v1 中，点击 recommended action 只能填充输入框，不得自动执行。

---

## 4. Frozen Implementation Decisions

本节为 Slice 0 冻结实现决策。若与其他章节冲突，以本节为准。

### 4.1 Runtime source path

Slice 0 Runtime TypeScript 源码必须放在：

```text
looptrain/standalone/src/runtime/
```

禁止在 Slice 0 使用仓库根目录：

```text
src/runtime/
```

根目录 `src/runtime/` 仅作为长期目标，必须在 package boundary 文档明确后才能启用。

### 4.2 Compiled output path

Slice 0 编译输出：

```text
looptrain/standalone/dist/runtime/
```

入口文件：

```text
looptrain/standalone/dist/runtime/index.js
```

`server.js` 必须通过 CommonJS 引入：

```js
const runtime = require('./dist/runtime');
```

不得直接 require TypeScript 源码。

### 4.3 Module format

Slice 0 模块格式固定为：

```text
CommonJS
```

不得切换为 ESM。

### 4.4 TypeScript config

TypeScript 配置文件：

```text
looptrain/standalone/tsconfig.runtime.json
```

最低配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "rootDir": "./src/runtime",
    "outDir": "./dist/runtime",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/runtime/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.5 package.json ownership

TypeScript、build scripts、test scripts、runtime dependencies 均归属：

```text
looptrain/standalone/package.json
```

必须包含：

```json
{
  "scripts": {
    "build:runtime": "tsc -p tsconfig.runtime.json",
    "test:runtime": "npm run build:runtime && node --test \"dist/runtime/**/*.test.js\"",
    "test:standalone": "node tests/smoke_test.js",
    "test": "npm run test:runtime && npm run test:standalone"
  }
}
```

### 4.6 Slice 0 runtime execution location

Slice 0 只实现 server-side Runtime Host 和 deterministic Assistant Runtime skeleton。

```text
Slice 0 server-side:
  LegacyEngineAdapter
  AssistantController
  CompanionViewBuilder
  ActionRegistry
  ActionPlanner
  FallbackTemplateEngine
  OutputValidator
  LLMProvider interface
```

完整 browser TypeScript MemoryRuntime / IndexedDB 实现不属于 Slice 0。

Slice 0 browser 侧只做：

```text
public/app.js 调用 /api/assistant/ask
展示 AssistantPanel
点击推荐行动填充输入框
维护现有 browser state / legacy snapshot
```

### 4.7 MemoryRuntime canonical location

长期设计中，MemoryRuntime canonical location 是：

```text
browser
```

IndexedDB 只能由 browser-side MemoryRuntime 访问。

但 Slice 0 不实现完整 browser MemoryRuntime。Slice 0 使用 `RuntimeClientState` 作为 server 与 browser 之间的 request-scoped state contract。

### 4.8 RuntimeClientState is mandatory

所有 server Runtime API 必须接收：

```ts
export interface RuntimeClientState {
  playerId: string;
  runId: string;
  chapterId: string;
  episodeId: string;
  loopId: string;
  sceneId: string;
  snapshotId: string | null;
  lastEventId: string | null;
  eventSeq: number;
  eventsSinceSnapshot: MemoryEvent[];
}
```

`AssistantAskRequest` 必须包含 `clientState`。

### 4.9 Event protocol

事件类型统一使用：

```text
UPPER_SNAKE_CASE
```

server-side `LegacyEngineAdapter` 返回 `MemoryEventDraft[]`，不得返回完整 `MemoryEvent[]`。

正式 `MemoryEvent` 由 browser append 时生成：

```text
eventId
eventSeq
prevEventId
createdAt
```

### 4.10 Content path

Legacy content 继续读取：

```text
looptrain/materials/looptrain/
```

Runtime content 新增路径：

```text
looptrain/materials/runtime/
```

不得使用不存在的：

```text
looptrain/standalone/materials/
```

### 4.11 CompanionViewBuilder module ownership

CompanionViewBuilder 不属于 Assistant 内部模块。

路径必须为：

```text
looptrain/standalone/src/runtime/companion-view/
```

Assistant Runtime 只能依赖 CompanionView，不能绕过它读 raw state。

### 4.12 LLM config

新 Runtime 统一使用：

```text
LT_LLM_PROVIDER=disabled | mock | deepseek
```

兼容 legacy：

```text
LLM_ENABLED=false -> LT_LLM_PROVIDER=disabled
LLM_ENABLED=true  -> LT_LLM_PROVIDER=deepseek, if LT_LLM_PROVIDER not set
```

默认值：

```text
LT_LLM_PROVIDER=disabled
```

---

## 5. Slice 0 Directory Structure

Slice 0 必须创建以下目录：

```text
looptrain/standalone/src/runtime/
  index.ts

  shared/
    ids.ts
    time.ts
    errors.ts
    result.ts

  ids/
    RuntimeId.ts
    RuntimeIdGenerator.ts

  engine/
    EngineResult.ts
    LegacyEngineAdapter.ts
    MemoryEventDraft.ts

  memory/
    MemoryEvent.ts
    RuntimeClientState.ts
    SerializedMemoryState.ts

  companion-view/
    CompanionView.ts
    CompanionViewBuilder.ts
    CompanionViewPolicy.ts
    CompanionVisibilityFilter.ts
    CompanionSpoilerGuard.ts

  assistant/
    index.ts
    AssistantController.ts
    AssistantTypes.ts
    IntentClassifier.ts
    AssistantPolicyEngine.ts
    ActionRegistry.ts
    ActionPlanner.ts
    AssistantSettlementReader.ts
    PromptBuilder.ts
    LLMProvider.ts
    DeepSeekLLMProvider.ts
    MockLLMProvider.ts
    DisabledLLMProvider.ts
    OutputValidator.ts
    ResponseRenderer.ts
    FallbackTemplateEngine.ts
    AssistantAuditLogger.ts

  content/
    RuntimeContentLoader.ts
    ContentPathPolicy.ts

  policy/
    SpoilerPolicy.ts
    ForbiddenRevealPolicy.ts

  tests/
    *.test.ts
```

编译后输出到：

```text
looptrain/standalone/dist/runtime/
```

---

## 6. Runtime API Bridge

当前 Express server 为：

```text
looptrain/standalone/server.js
```

Slice 0 必须扩展 server.js，不得替换 server.js。

### 6.1 Required routes

Slice 0 至少新增：

```text
POST /api/assistant/ask
GET  /api/assistant/state
```

可选新增：

```text
POST /api/runtime/action/commit
POST /api/runtime/dialogue/end
POST /api/runtime/loop/fail
POST /api/runtime/loop/next
```

### 6.2 POST /api/assistant/ask

请求：

```ts
export interface AssistantAskRequest {
  clientState: RuntimeClientState;
  trigger: AssistantTrigger;
  playerText?: string;
  locale: 'zh-CN';
  clientNow: string;
  debug?: boolean;
}
```

响应：

```ts
export interface AssistantAskResult {
  responseId: string;
  mode: AssistantResponseMode;

  assistant: {
    id: 'xu_zhiwei';
    displayName: '许知微';
  };

  visibleText: string;
  recommendedActions: RenderableAssistantAction[];
  clueReferences: RenderableClueReference[];
  beliefReferences: RenderableBeliefReference[];
  settlement?: RenderableSettlement;
  ui: AssistantUIHints;
  audit: AssistantAuditSummary;
}
```

### 6.3 GET /api/assistant/state

用于 UI 初始化“询问助手”按钮状态。

响应：

```ts
export interface AssistantInitialStateResult {
  buttonVisible: boolean;
  buttonLabel: '询问助手';
  buttonEmphasis: 'high' | 'normal' | 'low' | 'hidden';
  assistantKnownToPlayer: boolean;
  firstContactAvailable: boolean;
}
```

首轮初次接触前：

```text
buttonVisible = true
buttonLabel = '询问助手'
buttonEmphasis = high
assistantKnownToPlayer = false
firstContactAvailable = true
```

---

## 7. ID Scheme

所有 ID 必须由 `RuntimeIdGenerator` 统一生成或校验。

路径：

```text
looptrain/standalone/src/runtime/ids/RuntimeIdGenerator.ts
```

### 7.1 General rule

所有 ID 必须满足：

```text
^[a-z][a-z0-9_-]*$
```

禁止使用：

```text
空格
中文
冒号
斜杠
反斜杠
URL
随机自然语言
```

### 7.2 playerId

生成时机：玩家首次进入 standalone 页面。

生成位置：browser。

格式：

```text
player_${uuidv4}
```

持久化：

```text
legacy localStorage / future IndexedDB meta store
```

### 7.3 runId

生成时机：New Game / Reset Run / Start Trial。

格式：

```text
run_${uuidv4}
```

生命周期：一次完整 playthrough。

### 7.4 chapterId

Slice 0 固定为：

```text
chapter-01
```

content-authored，不得运行时随机生成。

### 7.5 episodeId

Slice 0 固定为：

```text
trial-001
```

legacy `trial_001` 映射为：

```text
episodeId = trial-001
chapterId = chapter-01
```

### 7.6 sceneId

content-authored stable ID。

示例：

```text
scene-carriage-03
scene-carriage-joint-03
scene-dining-car
```

### 7.7 loopId

格式：

```text
loop_${loopIndexPadded}_${runShortId}
```

示例：

```text
loop_0001_550e8400
```

### 7.8 eventId

正式 MemoryEvent append 时由 browser 生成。

格式：

```text
evt_${eventSeqPadded}_${random8}
```

server 不得生成正式 eventId。

### 7.9 snapshotId

格式：

```text
snap_${snapshotSeqPadded}_${runShortId}
```

### 7.10 viewId

CompanionViewBuilder 生成。

规则：

```text
viewId = "view_" + sha256(
  runId + "|" +
  loopId + "|" +
  sceneId + "|" +
  lastEventId + "|" +
  policyVersion + "|" +
  companionViewBuilderVersion
).slice(0, 16)
```

同输入必须生成同 viewId。

---

## 8. Memory Event Protocol

### 8.1 MemoryEventType

统一事件类型：

```ts
export type MemoryEventType =
  | 'LOOP_STARTED'
  | 'ACTION_COMMITTED'
  | 'AP_SPENT'
  | 'TIME_ADVANCED'
  | 'SCENE_CHANGED'
  | 'SCENE_ENTERED'
  | 'DIALOGUE_STARTED'
  | 'DIALOGUE_ENDED'
  | 'DIALOGUE_OUTCOME_RECORDED'
  | 'CLUE_UNLOCKED'
  | 'KNOWLEDGE_CONFIRMED'
  | 'BELIEF_CREATED'
  | 'BELIEF_UPDATED'
  | 'BELIEF_CONTRADICTED'
  | 'BELIEF_CONFIRMED'
  | 'RELATIONSHIP_UPDATED'
  | 'NPC_STATE_UPDATED'
  | 'GOAL_UPDATED'
  | 'ACTION_UNLOCKED'
  | 'LOOP_FAILED'
  | 'LOOP_OUTCOME_RECORDED'
  | 'GOAL_FAILED'
  | 'CARRYOVER_MEMORY_RECORDED'
  | 'FAIL_REASON_RECORDED'
  | 'TIME_RESET'
  | 'AP_RESET'
  | 'CARRYOVER_MEMORY_APPLIED'
  | 'SNAPSHOT_WRITTEN'
  | 'RESET_APPLIED';
```

### 8.2 MemoryEventDraft

server 返回 draft：

```ts
export interface MemoryEventDraft<TPayload = unknown> {
  type: MemoryEventType;
  runId: string;
  loopId: string;
  chapterId: string;
  episodeId: string;
  sceneId: string;
  payload: TPayload;
}
```

### 8.3 MemoryEvent

browser append 后形成正式事件：

```ts
export interface MemoryEvent<TPayload = unknown> {
  eventId: string;
  eventSeq: number;
  type: MemoryEventType;
  runId: string;
  loopId: string;
  chapterId: string;
  episodeId: string;
  sceneId: string;
  prevEventId: string | null;
  createdAt: string;
  payload: TPayload;
}
```

`createdAt` 必须是 ISO-8601 UTC 字符串。

### 8.4 Append rule

```text
server 负责判断发生了什么。
browser MemoryRuntime / legacy state bridge 负责生成正式 MemoryEvent 并持久化。
```

---

## 9. LegacyEngineAdapter Contract

路径：

```text
looptrain/standalone/src/runtime/engine/LegacyEngineAdapter.ts
```

LegacyEngineAdapter 是 server Engine 与 MemoryRuntime 的唯一桥接层。

它不直接写 IndexedDB，也不持久化 MemoryRuntime。

### 9.1 Interface

```ts
export interface LegacyEngineAdapter {
  commitAction(input: CommitActionInput): Promise<CommitActionOutput>;
  endDialogue(input: EndDialogueInput): Promise<EndDialogueOutput>;
  failLoop(input: FailLoopInput): Promise<FailLoopOutput>;
  nextLoop(input: NextLoopInput): Promise<NextLoopOutput>;
}
```

### 9.2 commitAction

```ts
export interface CommitActionInput {
  clientState: RuntimeClientState;
  actionId: string;
  playerText?: string;
  selectedActionRef?: string;
}

export interface CommitActionOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}
```

必须始终产生：

```text
ACTION_COMMITTED
```

可能产生：

```text
AP_SPENT
TIME_ADVANCED
SCENE_CHANGED
DIALOGUE_STARTED
CLUE_UNLOCKED
BELIEF_UPDATED
RELATIONSHIP_UPDATED
NPC_STATE_UPDATED
GOAL_UPDATED
ACTION_UNLOCKED
```

### 9.3 endDialogue

```ts
export interface EndDialogueInput {
  clientState: RuntimeClientState;
  dialogueId: string;
  npcId: string;
}

export interface EndDialogueOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}
```

必须始终产生：

```text
DIALOGUE_ENDED
```

有效对话结束时必须产生：

```text
DIALOGUE_OUTCOME_RECORDED
```

### 9.4 failLoop

```ts
export interface FailLoopInput {
  clientState: RuntimeClientState;
  failReasonCode: string;
}

export interface FailLoopOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}
```

必须产生：

```text
LOOP_FAILED
LOOP_OUTCOME_RECORDED
```

### 9.5 nextLoop

```ts
export interface NextLoopInput {
  clientState: RuntimeClientState;
}

export interface NextLoopOutput {
  engineResult: EngineResult;
  memoryEventDrafts: MemoryEventDraft[];
}
```

必须产生：

```text
LOOP_STARTED
TIME_RESET
AP_RESET
```

---

## 10. CompanionView v1

### 10.1 Purpose

CompanionView 是 Assistant Runtime / 许知微唯一可读 state view。

它回答：

```text
What is Xu Zhiwei allowed to know right now?
```

防剧透不依赖 prompt 约束，而是从源头上不把 hidden truth 放进 CompanionView。

### 10.2 Data flow

Slice 0：

```text
RuntimeClientState + current legacy engine visible state + runtime content policy
  ↓
CompanionViewBuilder
  ↓
CompanionView
  ↓
AssistantRuntime
```

长期：

```text
MemoryRuntime + GameEngine
  ↓
CompanionViewBuilder
  ↓
CompanionView
  ↓
AssistantRuntime / CompanionRuntime / 许知微
```

### 10.3 Schema

```ts
export interface CompanionView {
  viewId: string;
  schemaVersion: 1;

  player: CompanionPlayerView;
  run: CompanionRunView;
  scene: CompanionSceneView;

  knowledge: CompanionKnowledgeView;
  belief: CompanionBeliefView;
  timeline: CompanionTimelineView;
  archive: CompanionArchiveView;
  relationship: CompanionRelationshipView;

  policy: CompanionViewPolicy;
  provenance: CompanionViewProvenance;
}
```

### 10.4 CompanionViewPolicy

```ts
export interface CompanionViewPolicy {
  assistantPhase:
    | 'pre_contact'
    | 'onboarding'
    | 'guided'
    | 'normal'
    | 'minimal'
    | 'locked';

  guidanceLevel: 0 | 1 | 2 | 3;
  maxSpoilerLevel: 0 | 1 | 2 | 3 | 4 | 5;

  canReferenceBeliefs: boolean;
  canCompareLoops: boolean;
  canReferenceArchive: boolean;
  canRecommendActions: boolean;

  locale: 'zh-CN';
  hiddenTruthAccessible: false;
}
```

`hiddenTruthAccessible` 在 v1 必须始终为 `false`。

### 10.5 Filter rules

CompanionView 必须过滤：

```text
locked clue
hidden identity
future plot
NPC private thoughts
raw relationship scores
hidden branch conditions
full mystery solution
```

所有 ambiguous visibility 必须 deny by default。

### 10.6 Acceptance

CompanionView v1 完成标准：

```text
AssistantRuntime 只能用 CompanionView 回答“我们知道什么”。
ActionPlanner 只能用 CompanionView 推荐行动。
PromptBuilder 只能用 CompanionView 构造 prompt。
OutputValidator 只能用 CompanionView 校验 refs。
Hidden truth 不能通过 CompanionView 进入 LLM。
Debug/audit 不泄露 forbidden content。
```

---

## 11. Deterministic Assistant Runtime

### 11.1 Goal

第一版 Assistant Runtime 必须在 no LLM 模式下工作。

目标是解决：

```text
new players do not know how to start investigating
```

它通过许知微在剧情内给出引导，但不能变成外部攻略系统。

### 11.2 Flow

```text
Player clicks “询问助手”
  ↓
UI sends AssistantAskRequest with RuntimeClientState
  ↓
AssistantController
  ↓
CompanionViewBuilder.build()
  ↓
IntentClassifier
  ↓
AssistantPolicyEngine
  ↓
ActionPlanner
  ↓
AssistantSettlementReader if needed
  ↓
FallbackTemplateEngine
  ↓
OutputValidator
  ↓
ResponseRenderer
  ↓
UI renders text + action buttons
```

### 11.3 Assistant triggers

```ts
export type AssistantTrigger =
  | 'ASK_ASSISTANT_BUTTON'
  | 'ASSISTANT_FREE_TEXT'
  | 'PLAYER_STALLED'
  | 'NEW_CLUE_ACQUIRED'
  | 'LOOP_STARTED'
  | 'DIALOGUE_SETTLEMENT'
  | 'LOOP_SETTLEMENT';
```

### 11.4 IntentClassifier

```ts
export type AssistantIntent =
  | 'ASK_NEXT_ACTION'
  | 'ASK_SCENE_EXPLAIN'
  | 'ASK_CLUE_SUMMARY'
  | 'ASK_LOOP_SUMMARY'
  | 'ASK_IDENTITY'
  | 'ASK_TRUTH'
  | 'ASK_RULE'
  | 'CASUAL_CHAT'
  | 'INVALID_OR_ATTACK';
```

规则优先级：

```text
ASK_ASSISTANT_BUTTON with no text -> ASK_NEXT_ACTION
prompt injection text -> INVALID_OR_ATTACK
truth / culprit / bomb / full answer -> ASK_TRUTH
“我该怎么办” -> ASK_NEXT_ACTION
“这里是哪” -> ASK_SCENE_EXPLAIN
“现在知道什么” -> ASK_CLUE_SUMMARY
“上一轮为什么失败” -> ASK_LOOP_SUMMARY
“你是谁 / 我是谁” -> ASK_IDENTITY
otherwise -> CASUAL_CHAT
```

### 11.5 AssistantPolicyEngine

```ts
export interface AssistantPolicy {
  assistantPhase:
    | 'pre_contact'
    | 'onboarding'
    | 'guided'
    | 'normal'
    | 'minimal'
    | 'locked';

  guidanceLevel: 0 | 1 | 2 | 3;
  maxSpoilerLevel: 0 | 1 | 2 | 3 | 4 | 5;

  canRecommendActions: boolean;
  canCompareLoops: boolean;
  canReferenceBeliefs: boolean;
  canReferenceArchive: boolean;

  canTriggerActions: false;
  maxActionCount: number;
  llmProvider: 'disabled' | 'mock' | 'deepseek';
}
```

默认 progression：

| Condition | phase | guidance | spoiler | button |
|---|---:|---:|---:|---|
| first loop before first contact | `pre_contact` | 3 | 0 | high |
| loop 1 after first contact | `onboarding` | 3 | 1 | high |
| loop 2 | `guided` | 2 | 1 | normal |
| loop 3 | `guided` | 2 | 2 | normal |
| loop 4+ | `normal` | 1 | 2 | low |
| player mastered | `minimal` | 0 | 2 | low |

Repeated failure adjustment：

```text
same goal failed twice -> guidanceLevel at least 2
same goal failed three times -> maxSpoilerLevel may temporarily become 3
never open spoilerLevel 4/5 in normal gameplay
```

---

## 12. ActionRegistry and ActionPlanner

### 12.1 ActionRegistry path

ActionRegistry 内容文件路径：

```text
looptrain/materials/runtime/chapters/chapter-01/actions/action-registry.json
```

Runtime loader：

```text
looptrain/standalone/src/runtime/content/RuntimeContentLoader.ts
```

### 12.2 ActionDefinition

```ts
export interface ActionDefinition {
  actionId: string;

  type:
    | 'dialogue'
    | 'observe'
    | 'move'
    | 'present_clue'
    | 'review'
    | 'wait';

  targetId?: string;

  label: string;
  inputTemplate: string;

  requiredSceneIds?: string[];
  requiredClueIds?: string[];
  requiredNpcVisibleIds?: string[];
  requiredLocationReachableIds?: string[];

  forbiddenFlags?: string[];

  phaseAllowed: AssistantPhase[];
  spoilerLevel: 0 | 1 | 2 | 3 | 4 | 5;
  riskLevel: 'low' | 'medium' | 'high';
  priorityBase: number;
  tags?: string[];
}
```

### 12.3 Filter rules

ActionPlanner 只能从 ActionRegistry 选择 0-3 个行动。

过滤条件：

```text
action.phaseAllowed includes policy.assistantPhase
action.spoilerLevel <= policy.maxSpoilerLevel
requiredSceneIds includes view.scene.sceneId or empty
requiredClueIds all in view.knowledge.confirmedVisible
requiredNpcVisibleIds all in view.scene.visibleNpcIds
requiredLocationReachableIds all in view.scene.reachableLocationIds
forbiddenFlags not active
```

### 12.4 Scoring

```text
score = priorityBase
+ current goal match bonus
+ unresolved conflict bonus
+ newly acquired clue bonus
+ onboarding tutorial bonus
+ intent match bonus
- repeated action penalty
- high risk penalty
- near spoiler threshold penalty
```

Suggested values：

| Factor | Score |
|---|---:|
| Current goal directly related | +40 |
| Resolves unresolved conflict | +30 |
| Uses newly acquired clue | +20 |
| Teaches current tutorial grammar | +25 |
| Intent directly matches action type | +20 |
| Repeated in same loop | -30 |
| Repeated in previous loop with no new info | -15 |
| High risk | -20 |
| SpoilerLevel equals max threshold | -10 |

### 12.5 Rendering rule

按钮 label 来自：

```text
ActionRegistry.label
```

点击填充文本来自：

```text
ActionRegistry.inputTemplate
```

LLM 不得生成 action button label 或 inputTemplate。

---

## 13. OutputValidator and Renderer

### 13.1 AssistantResponse

```ts
export interface AssistantResponse {
  mode: AssistantResponseMode;

  visibleText: string;

  actionRefs: string[];
  clueRefs: string[];
  beliefRefs: string[];

  settlementRef?: string;

  spoilerLevel: 0 | 1 | 2 | 3 | 4 | 5;
  confidence: 'low' | 'medium' | 'high';

  stateEffects: [];
}
```

`stateEffects` 必须永远为空。

### 13.2 Validators

所有输出必须经过：

```text
SchemaValidator
ActionValidator
ClueValidator
BeliefValidator
SettlementValidator
SpoilerValidator
ToneValidator
StateEffectValidator
```

### 13.3 Forbidden tone

禁止语气：

```text
你必须
唯一正确
正确答案是
系统提示
任务已自动完成
真凶就是
直接去抓
```

允许语气：

```text
可以先
我建议
这还不是证据
也许值得确认
现在能确认的是
```

### 13.4 ResponseRenderer

```ts
export interface RenderableAssistantAction {
  actionId: string;
  label: string;
  inputTemplate: string;
  type: ActionDefinition['type'];
  riskLevel: ActionDefinition['riskLevel'];
}
```

v1 点击行为：

```text
fill input box, do not execute
```

---

## 14. LLM Expression Layer

### 14.1 Goal

LLM integration 只让许知微表达更自然。

LLM 可以改变：

```text
visibleText wording only
```

LLM 不得改变：

```text
actionRefs
clueRefs
beliefRefs
settlementRef
spoilerLevel
stateEffects
recommendedActions
facts
outcomes
```

### 14.2 LLMProvider interface

路径：

```text
looptrain/standalone/src/runtime/assistant/LLMProvider.ts
```

```ts
export interface LLMProvider {
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
}
```

### 14.3 LLMGenerateInput

```ts
export interface LLMGenerateInput {
  requestId: string;
  provider: 'deepseek' | 'mock' | 'disabled';
  model: string;

  mode:
    | 'awakening_first_contact'
    | 'assistant_advice'
    | 'scene_explain'
    | 'clue_summary'
    | 'dialogue_settlement'
    | 'loop_settlement'
    | 'anti_spoiler'
    | 'casual_chat';

  systemPrompt: string;
  userPrompt: string;

  schemaName: 'AssistantResponse';
  temperature: number;
  maxTokens: number;
  timeoutMs: number;

  metadata: {
    playerId: string;
    runId: string;
    loopId: string;
    chapterId: string;
    episodeId: string;
    sceneId: string;
    viewId: string;
  };
}
```

### 14.4 LLMGenerateResult

```ts
export interface LLMGenerateResult {
  requestId: string;
  provider: 'deepseek' | 'mock' | 'disabled';
  model: string;

  rawText: string;
  parsedJson: unknown | null;

  finishReason:
    | 'stop'
    | 'length'
    | 'timeout'
    | 'error'
    | 'disabled';

  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };

  latencyMs: number;

  error?: {
    code: string;
    message: string;
  };
}
```

### 14.5 DeepSeek provider wrapping rule

现有 DeepSeek 调用必须通过 `DeepSeekLLMProvider` 包装。

禁止：

```text
AssistantController -> DeepSeek API directly
```

允许：

```text
AssistantController
  -> PromptBuilder
  -> LLMProvider
  -> DeepSeekLLMProvider
```

`DeepSeekLLMProvider` 只负责：

```text
读取 server-side env 中的 API key
调用模型
返回 rawText / parsedJson
记录 latency / usage / error
```

业务校验只能由 `OutputValidator` 完成。

### 14.6 Disabled provider

必须实现 disabled provider。

当：

```text
LT_LLM_PROVIDER=disabled
```

Assistant Runtime 不调用任何 LLM，直接使用 `FallbackTemplateEngine`。

验收要求：

```text
LT_LLM_PROVIDER=disabled 时，“询问助手”仍然可用。
```

---

## 15. Content Path Policy

### 15.1 Legacy content

继续读取：

```text
looptrain/materials/looptrain/
```

Slice 0 不得删除或迁移 legacy content。

### 15.2 Runtime content

新增：

```text
looptrain/materials/runtime/
```

标准结构：

```text
looptrain/materials/runtime/
  characters/
    xu-zhiwei.profile.json

  chapters/
    chapter-01/
      chapter.json

      episodes/
        trial-001.json

      scenes/
        scene-carriage-03.json
        scene-carriage-joint-03.json

      actions/
        action-registry.json

      policies/
        assistant-policy.json
        spoiler-policy.json
        forbidden-reveals.json

      settlements/
        dialogue-outcomes.json
        loop-outcomes.json

  templates/
    fallback-templates.zh-CN.json
```

### 15.3 许知微 profile

路径：

```text
looptrain/materials/runtime/characters/xu-zhiwei.profile.json
```

该文件只能包含当前阶段允许公开的人设信息。

不得包含：

```text
许知微真实任务
后续章节真相
主角真实身份
最终谜底
```

### 15.4 ActionRegistry

路径：

```text
looptrain/materials/runtime/chapters/chapter-01/actions/action-registry.json
```

ActionPlanner 只能推荐此文件中注册且通过条件校验的 action。

---

## 16. UI Contract

### 16.1 AskAssistantButton

按钮 label：

```text
询问助手
```

行为：

```text
first loop: high emphasis
later loops: normal / low depending on policy
must not block main input
```

### 16.2 AssistantPanel

展示：

```text
许知微 dialogue
recommended action buttons
clue references
belief references
settlement info
```

不得展示：

```text
raw LLM output
raw prompt
raw MemoryState
raw EngineState
hidden truth
debug internals in production
```

### 16.3 RecommendedActionList

v1 点击行为：

```text
fill input box, do not execute
```

原因：

```text
Preserve player agency.
Teach valid input grammar.
Avoid assistant playing for the player.
Reduce misclick cost.
Keep Engine execution path unchanged.
```

---

## 17. Test Framework Decision

Slice 0 测试框架固定为：

```text
node:test
assert
```

不引入：

```text
vitest
jest
mocha
ts-node
tsx
```

测试源码放在：

```text
looptrain/standalone/src/runtime/tests/
```

TypeScript 测试先编译，再执行：

```text
node --test "dist/runtime/**/*.test.js"
```

`npm test` 必须覆盖：

```text
Runtime tests
standalone smoke test
```

---

## 18. Required Tests

### 18.1 Runtime host tests

```text
tsconfig.runtime.json exists
build:runtime succeeds
dist/runtime/index.js exists
server.js can require ./dist/runtime
```

### 18.2 CompanionView tests

必须验证：

```text
locked clue not in view
hidden identity not in view
future plot not in view
NPC private thoughts not in view
promoted belief not in belief view
raw relationship score not in view
debug=true does not leak hidden truth
forbidden clue dropped
spoilerLevel limit applied
view limits applied
```

### 18.3 Assistant Runtime tests

必须包含：

```text
IntentClassifier.test.ts
AssistantPolicyEngine.test.ts
ActionRegistry.test.ts
ActionPlanner.test.ts
FallbackTemplateEngine.test.ts
OutputValidator.test.ts
ResponseRenderer.test.ts
AssistantController.no-llm.test.ts
```

Golden cases：

```text
first_contact_empty_memory
loop1_after_xiaoning_sound
loop1_after_failed_questioning
loop2_with_archive
ask_truth_attack
dialogue_settlement_with_new_clue
loop_settlement_failed
```

### 18.4 LLM validation tests

注入错误输出：

```text
new action_id
locked clue reference
hidden identity reveal
stateEffects non-empty
command tone
non-JSON output
```

期望：

```text
reject and fallback
```

### 18.5 Gameplay acceptance

必须满足：

```text
New player understands “询问助手”.
First assistant click enables at least one valid action.
Player learns asking / observing / following up.
Loop failure recap gives a next-loop direction.
Assistant does not feel like it solves the case.
No LLM required for core assistant use.
```

---

## 19. Development Slices

### Slice 0: TypeScript Host + Deterministic Assistant Runtime Skeleton

Deliver：

```text
looptrain/standalone/tsconfig.runtime.json
looptrain/standalone/src/runtime/
looptrain/standalone/dist/runtime/
server.js require ./dist/runtime
LegacyEngineAdapter interface/stub
RuntimeClientState contract
MemoryEventDraft contract
CompanionViewBuilder deterministic skeleton
ActionRegistry loader
ActionPlanner
FallbackTemplateEngine
OutputValidator
ResponseRenderer
LLMProvider interface
DisabledLLMProvider
/api/assistant/ask
/api/assistant/state
public/app.js AskAssistantButton integration
```

Acceptance：

```text
Current standalone app still starts.
Existing smoke test still passes.
npm run build:runtime succeeds.
npm test runs runtime tests and standalone smoke test.
LLM_PROVIDER disabled path works.
First assistant click returns valid deterministic advice.
Recommended action click fills input box, does not execute.
```

### Slice 1: Browser MemoryRuntime host decision

Deliver：

```text
browser TypeScript loading strategy
IndexedDB adapter decision
MemoryRuntime browser API
legacy app.js integration plan
```

### Slice 2: IndexedDB Memory Runtime

Deliver：

```text
MemoryStorageSchema
IndexedDBMemoryStorage
EventLogStore
SnapshotStore
migration support
```

### Slice 3: Knowledge / Belief / Relationship

Deliver：

```text
Knowledge derivation
Belief records
Relationship records
Knowledge/Belief separation
```

### Slice 4: Timeline / Archive / Reset

Deliver：

```text
Timeline entries
Archive entries
soft/chapter/forget/developer reset
```

### Slice 5: Settlement Runtime

Deliver：

```text
DialogueSettlement
LoopSettlement
AssistantSettlementReader
```

### Slice 6: LLM Expression Layer

Deliver：

```text
PromptBuilder
DeepSeekLLMProvider
JSON output validation
prompt injection tests
fallback on invalid output
```

### Slice 7: UI enhancement

Deliver：

```text
AssistantPanel polish
RecommendedActionList polish
clue/belief reference rendering
optional future React migration plan
```

---

## 20. Slice 0 Entry Checklist

只有满足以下全部条件，才允许进入 Slice 0 功能开发：

```text
1. looptrain/standalone/src/runtime/ 已创建。
2. looptrain/standalone/tsconfig.runtime.json 已创建。
3. looptrain/standalone/package.json 包含 build:runtime/test:runtime/test。
4. Runtime module format 固定为 CommonJS。
5. server.js 使用 require('./dist/runtime')，不得 require TypeScript source。
6. Slice 0 明确不实现完整 browser TypeScript MemoryRuntime。
7. AssistantAskRequest 包含 RuntimeClientState。
8. LegacyEngineAdapter 返回 MemoryEventDraft[]，不返回 MemoryEvent[]。
9. MemoryEventType 统一为 UPPER_SNAKE_CASE。
10. Content path 统一为 looptrain/materials/runtime/。
11. Legacy content path 继续为 looptrain/materials/looptrain/。
12. CompanionViewBuilder 位于 runtime/companion-view/。
13. LLM 配置统一为 LT_LLM_PROVIDER。
14. LT_LLM_PROVIDER=disabled 时 Assistant 可用。
15. Test framework 固定为 node:test/assert。
16. npm test 覆盖 Runtime tests 和 standalone smoke test。
```

未满足任意一项，不得进入功能开发。

---

## 21. Final Architecture Principle

LoopTrain 不应该成为一个“LLM 持有真相”的游戏。

它应该成为一个 runtime-driven narrative system：

```text
Engine judges.
Memory records.
CompanionView filters.
Assistant guides.
ActionPlanner recommends.
Settlement explains.
LLM phrases.
Validator gates.
Player decides.
```

Slice 0 的目标不是完成完整 Memory Runtime，也不是让许知微自由聊天。

Slice 0 的目标是建立一个不会偏离设计意图的、可验证的 Runtime Host 和 Deterministic Assistant Runtime 闭环。

最终约束：

```text
许知微不能自由知道。
许知微不能自由推荐。
许知微不能自由结算。
许知微不能自由写状态。

她只能在 Runtime 允许的范围内，
用角色化语言，
表达已经由 Engine / CompanionView / ActionPlanner / Settlement 确认可以表达的内容。
```

