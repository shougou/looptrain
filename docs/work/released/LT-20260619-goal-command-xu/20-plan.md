# v0.7 行动目标系统 + 指令系统 + 许知微 综合设计方案

**版本**: v1.1-final  
**日期**: 2026-06-19  
**状态**: ✅ 已确认  
**复杂度**: Large

---

## 零、已确认决议

| # | 决议 | 结论 |
|---|------|------|
| 1 | Goal Engine 架构 | A（模块化）为主，B（engine.js 薄适配），不做 C |
| 2 | 目标 scope 行为 | 建议性，多目标并行，玩家自选次序；未完成顺延到下一轮；不设永久失败 |
| 3 | 目标定义来源 | `materials/runtime/goals/` JSON 加载，像 NPC 一样外置维护 |
| 4 | 许知微交付时机 | 与 Goal Engine + 指令系统同版本交付 |
| 5 | 许知微主动引导 | 玩家进入游戏后主动发起对话，提示行动目标，介绍指令 |
| 6 | "重置本轮" engine 支持 | 新增 `resetLoop()` 函数，与 `resetGame()` 区分 |
| 7 | "查看任务"临时方案 | Phase B 对接 currentGoal() 单目标；Phase A 完成后再升级为多目标 |

---

## 一、Goal Engine 模块

### 1.1 文件结构

```
src/runtime/goal/
  GoalTypes.ts          # GoalDefinition, GoalInstanceState, GoalEngineResult
  GoalEngine.ts         # 主入口：evaluate() → GoalEngineResult
  GoalEvaluator.ts      # DSL 判定引擎
  GoalFeedback.ts       # 完成反馈文本生成

materials/runtime/goals/
  trial-001-goals.json  # 试玩版目标定义（声明式 JSON）
```

### 1.2 CompletionCondition DSL

只认四类结构化对象：

```ts
type GoalCondition =
  | { all: GoalCondition[] } | { any: GoalCondition[] } | { not: GoalCondition }
  | { eventOccurred: { type: string; npcId?: string; topic?: string } }
  | { clueKnown: string }
  | { factConfirmed: string }
  | { stateEquals: { key: string; value: unknown } }
```

### 1.3 判定规则

- 动作发生 ≠ 目标完成。目标完成 = clue/fact/state 达成
- 多目标并行，未完成顺延到下一轮
- `newlyCompleted` 只触发一次反馈
- 未完成时 `missingCondition` 可解释

### 1.4 GoalEngine API

```ts
class GoalEngine {
  constructor(definitions: GoalDefinition[])
  evaluate(runtimeState: RuntimeState, events: MemoryEvent[], knownClues: string[]): GoalEngineResult
}

type GoalEngineResult = {
  activeGoals: GoalInstanceState[]
  completedGoals: GoalInstanceState[]
  newlyCompleted: GoalInstanceState[]
  feedback: GoalFeedback[]
}
```

---

## 二、指令系统

### 2.1 指令清单（12 条）

| # | 指令 | 类别 | 可用条件 |
|---|------|------|---------|
| 1 | 查看线索 | information | always |
| 2 | 查看人物 | information | always |
| 3 | 查看状态 | information | always |
| 4 | 查看任务 | information | always |
| 5 | 查看记忆 | memory | has_carryover |
| 6 | 查看时间线 | memory | loop_gt_1 |
| 7 | 查看推测 | memory | has_beliefs |
| 8 | 结束对话 | action | in_dialogue |
| 9 | 进入下一轮 | action | after_failure |
| 10 | 重置本轮 | action | always |
| 11 | 重置游戏 | action | always（需二次确认） |
| 12 | 询问许知微 | interaction | always |

### 2.2 文件

```
materials/runtime/commands/command-registry.json
src/runtime/command/CommandRegistry.ts
src/runtime/command/CommandMatcher.ts
```

### 2.3 架构

```
CommandRegistry (JSON) → CommandMatcher → app.js 执行
                                 ↗ 许知微解释（不执行）
```

所有指令统一在 `command-registry.json` 中配置和维护。

---

## 三、许知微集成

### 3.1 职责

| 能做 | 不能做 |
|------|--------|
| 解释指令用途、展示可用指令 | 执行指令 |
| 主动引导新手（三轮内） | 替玩家决策 |
| 复述目标进度、生成自然语言反馈 | 判定目标完成、写入状态 |

### 3.2 主动引导行为

- 玩家进入游戏 → 许知微主动发起对话，提示当前行动目标，介绍指令系统
- 首次获得线索 → 提示"查看线索"指令
- 首次进入第 2 轮 → 提示"查看记忆"指令
- 连续 3 次无效行动 → 提示"帮助"指令
- 目标完成 → 正反馈卡片

### 3.3 内容文件

```
materials/runtime/characters/xu-zhiwei.json
materials/runtime/dialogues/xu-zhiwei-dialogue.json
```

---

## 四、engine.js 改动

### 4.1 新增：`resetLoop()`

```js
function resetLoop(state) {
  // 重置当前轮状态，保留跨循环记忆
  return {
    loop: state.loop + 1,
    clock: '08:45',
    ap_remaining: 10,
    location: 'carriage_7',
    active_npc: null,
    dialogue_session: null,
    known_clues: state.known_clues,        // 保留
    carried_memory: state.carried_memory,   // 保留
    npc_states: state.npc_states,           // 保留
  }
}
```

### 4.2 改造：`currentGoal()`

从返回字符串 → 返回结构化对象：

```js
function currentGoal(state) {
  return {
    goals: goalEngine ? goalEngine.evaluate(state).activeGoals : [{ title: currentGoalText(state) }]
  }
}
```

Goal Engine 未就绪时回退到现有 `currentGoalText()`。

### 4.3 指令执行统一入口

```js
function executeCommand(commandId, state) {
  switch(commandId) {
    case 'reset_loop': return resetLoop(state);
    case 'reset_game': return resetGame(state);
    case 'end_dialogue': return endDialogue(state);
    // ...
  }
}
```

---

## 五、UX/UI — 三轮渐进学习

### 5.1 底部栏（第 1-3 轮完整状态）

```
┌──────────────────────────────────────┐
│  📋 说服赵乘警检查地板                 │  ← 目标栏
│  ─────────────────────────────────── │
│  🔍线索  👤人物  🧠记忆  ⚡更多        │  ← 指令栏
│  [________________________] [发送]    │
└──────────────────────────────────────┘
```

第 4 轮+收起为 `📋 目标 ⚡▼`

### 5.2 目标完成正反馈

```
┌──────────────────────────────────┐
│  ✅ 目标完成  你确认了小宁目击异常   │
│  🧠 该信息已加入下一轮记忆          │
│  📋 新目标：继续收集证据            │
└──────────────────────────────────┘
```

### 5.3 三轮引导节奏

| 轮次 | 目标栏 | 指令栏 | 许知微 |
|:---:|------|------|------|
| 1 | 闪烁高亮 | 全部可见+新指令闪烁 | 主动发起对话，介绍目标+指令 |
| 2 | 常显 | 常显 | 停滞时轻提示 |
| 3 | 常显 | 末次常显 | "你很熟练了" |
| 4+ | 常显 | ⚡收起 | 静默 |

---

## 六、明确实施步骤

### Step 1：Goal Engine 核心（可独立测试）

1. `GoalTypes.ts` — 类型定义
2. `GoalEvaluator.ts` — DSL 判定引擎（纯函数，不依赖 IO）
3. `GoalFeedback.ts` — 反馈文本生成
4. `GoalEngine.ts` — 主入口
5. `materials/runtime/goals/trial-001-goals.json` — 试玩版目标定义
6. `npm run build:runtime` 编译通过
7. 编写 `tests/goal_engine.test.ts` — 独立测试 evaluator DSL

### Step 2：engine.js 适配

8. engine.js 新增 `resetLoop()` 函数
9. engine.js `currentGoal()` 改为调用 GoalEngine（Goal 就绪时）或回退到现有文本（未就绪时）
10. engine.js 新增 `executeCommand()` 统一入口
11. `npm run test:standalone` 6/6 通过（确保引擎不变性）

### Step 3：指令系统

12. 创建 `materials/runtime/commands/command-registry.json`（12 条指令）
13. 创建 `src/runtime/command/CommandRegistry.ts` + `CommandMatcher.ts`
14. app.js `handleCommand()` 重构为使用 CommandMatcher
15. 指令"查看任务"临时对接 `currentGoal()`（单目标）
16. `npm run build:runtime` 编译通过

### Step 4：许知微内容 + 对话

17. 创建 `xu-zhiwei.json` 角色 Profile
18. 创建 `xu-zhiwei-dialogue.json` 对话模板（含 `tutorial_hint` 意图）
19. 许知微主动引导逻辑（进入游戏 → 发起对话）

### Step 5：UX/UI 集成

20. 底部栏新增目标栏（常驻）
21. 底部栏新增指令栏（渐进显示/收起）
22. 目标完成正反馈卡片
23. 许知微对话面板（从"询问助手"按钮触发）
24. `npm run build:runtime` + `npm run test:standalone` 全部通过

### Step 6：多目标升级（Goal Engine 就绪后）

25. "查看任务"指令从 `currentGoal()` 单目标升级为 GoalEngine 多目标
26. 目标栏支持多目标展示

---

## 七、验证

```bash
npm run build:runtime    # TS 编译（0 errors）
npm run test:runtime     # Runtime 测试（goal_engine 新测试）
npm run test:standalone  # 引擎测试（6/6 pass）
node --check engine.js   # JS 语法
```

## 八、来自 testplay.md 的设计约束（v0.8 内容前置要求）

v0.7 不实现游戏内容，但架构必须能承载 testplay 的全部设计意图：

### 8.1 Action Type 注册

CommandRegistry 必须支持以下 8 种标准 Action，作为指令系统的能力基础：

```ts
type ActionType =
  | "OBSERVE"          // 观察环境/对象
  | "ASK_NPC"          // 询问 NPC（带 topic）
  | "MOVE_TO"          // 移动到目标位置
  | "INSPECT_OBJECT"   // 检查特定物体
  | "FOLLOW_NPC"       // 跟踪 NPC
  | "PERSUADE_NPC"     // 说服 NPC 执行行动
  | "ASK_ASSISTANT"    // 询问许知微
  | "REVIEW_MEMORY"    // 回顾记忆
```

### 8.2 Goal DSL 扩展

为支持 testplay 的 8 个目标定义，GoalCondition 需扩展：

| 扩展 | 用途 | 示例 |
|------|------|------|
| `eventOccurred.result` | 匹配事件结果 | `{ type: "PERSUADE_NPC", npcId: "conductor", result: "success" }` |
| `loopRange: [min, max]` | 目标仅在特定轮次激活 | `loopRange: [1, 1]` |
| `derivedFrom: Condition[]` | 派生线索自动生成 | 3 条线索满足 → 生成派生线索 |

### 8.3 UI 数据结构预留

前端目标栏需预留以下字段，供 v0.8 填充具体内容：

```ts
type GoalViewModel = {
  id: string
  title: string
  status: 'pending' | 'active' | 'completed'
  progress: { done: number; total: number }
  knownInfo: string[]      // v0.8: 本轮已知信息
  suggestedActions: string[] // v0.8: 建议行动按钮
}
```

### 8.4 世界时间线事件接口

engine 预留接口，v0.8 填入具体编排：

```ts
type WorldTimelineEvent = {
  time: string        // "14:02"
  type: string
  description: string
  triggersGoal?: string
}
```

### 8.5 结算文本接口

MemoryRuntime 预留 `settlement` 字段：

```ts
type LoopSettlement = {
  loopNo: number
  outcome: 'success' | 'failure'
  newClues: string[]
  nextLoopAdvice: string
  xuSummary: string   // 许知微复盘文本
}
```

---

## 九、v0.7 / v0.8 分工

| 范围 | v0.7 | v0.8 |
|------|:---:|:---:|
| GoalEngine 架构 + DSL | ✅ | |
| CommandRegistry + CommandMatcher | ✅ | |
| engine.js 改动 | ✅ | |
| 许知微集成 | ✅ | |
| UX/UI 框架 | ✅ | |
| 故事重写 | | ✅ |
| NPC 重新设计 | | ✅ |
| 场景重设计 | | ✅ |
| 8 个目标内容 | | ✅ |
| 8 条线索内容 | | ✅ |
| 三轮结算文本 | | ✅ |
| 开场字幕 + 试玩结尾 | | ✅ |
| Action/Label/Template 内容 | | ✅ |

---

## 十、风险

| 风险 | 缓解 |
|------|------|
| Goal Engine 与 engine.js 状态不同步 | Goal Engine 只读 MemoryRuntime |
| 指令栏占用手机空间 | 第 4 轮收起为图标 |
| "查看任务"临时方案升级时断裂 | Step 2 预留多目标接口，Step 6 平滑切换 |
