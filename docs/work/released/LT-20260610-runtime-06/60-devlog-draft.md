# LoopTrain v0.6 Runtime 开发总结

## 一、v0.6 改了什么

v0.6 的核心目标：**把 v0.5 的 flat snapshot state 升级为分层 TypeScript Runtime 架构**。

### 1.1 从 flat snapshot 到分层记忆系统

v0.5 的游戏状态是扁平 JSON：`loop / clock / ap_remaining / known_clues / carried_memory / npc_states / flags / dialogue_session`。不同生命周期的数据混在一起，不能回答"玩家是怎么知道的"。

v0.6 拆成结构化层：

```
MemoryRuntime
  ├── Event Log    → 发生了什么（不可变事件流）
  ├── Knowledge    → 确认了什么事实
  ├── Belief       → 在怀疑什么（未确认）
  ├── Timeline     → 每个循环发生了什么
  ├── Archive      → 跨循环保留的记忆
  ├── Relationship → NPC 关系状态
  └── Profile      → 玩家设置
```

Event Log 是源头，Knowledge/Belief 是从事件投影出来的视图。

### 1.2 Deterministic Assistant 流水线

新增"询问助手"系统，8 步确定性流水线：

```
ClientState → CompanionViewBuilder → VisibilityFilter → IntentClassifier
  → PolicyEngine → ActionPlanner → FallbackTemplateEngine
  → OutputValidator → ResponseRenderer → UI
```

核心约束：Assistant 只读 CompanionView（安全投影），不接触 hidden truth；LLM 禁用时 Fallback 仍可用。

### 1.3 Slice 2：MemoryRuntime ↔ Assistant 对接

`CompanionViewBuilder` 在 MemoryRuntime 存在时，从事件流提取真实 loopCount、failureCount、visibleNpcIds、confirmedClueIds、activeBeliefs 等。`ActionPlanner` 评分基于真实 Knowledge/Belief。

### 1.4 模块清单

| 模块 | 文件 | 说明 |
|------|:---:|------|
| shared/ | 4 | ID 别名、时间、错误类型、Result |
| ids/ | 2 | RuntimeId 值对象、ID 生成器 |
| engine/ | 3 | EngineResult、MemoryEventDraft、LegacyEngineAdapter |
| memory/ | 3 | MemoryEvent(29 类型)、ClientState、SerializedState |
| companion-view/ | 5 | CompanionView、Policy、Builder、Filter、SpoilerGuard |
| assistant/ | 12 | Controller、Classifier、PolicyEngine、ActionPlanner、LLM/Mock/Disabled、Validator、Renderer、Fallback |
| content/ | 2 | ContentLoader(已加固)、PathPolicy |
| policy/ | 2 | SpoilerPolicy、ForbiddenRevealPolicy |
| knowledge/ | 2 | Knowledge 记录 + Store |
| belief/ | 2 | Belief 记录 + Store |
| relationship/ | 2 | NPC 关系 + Store |
| timeline/ | 2 | 循环时间线 + Store |
| archive/ | 2 | 跨循环存档 + Store |
| profile/ | 2 | 玩家档案 + Store |
| snapshot/ | 1 | 聚合快照 |
| storage/ | 1 | 统一内存存储 |
| migration/ | 3 | Legacy state 迁移 |
| reset/ | 3 | 跨循环重置策略 |
| prompt/ | 2 | PromptMemoryContext 安全上下文 |
| tests/ | 2 | Slice 0 + Slice 1 验证 |
| **合计** | **61** | |

---

## 二、为什么这么做

### 2.1 v0.5 state 不是记忆系统

flat snapshot 能做存档，不能做记忆。系统不知道线索是怎么来的、什么时候来的、可信度如何。没有事件溯源，无法回答"玩家是怎么知道这个事实的"。

### 2.2 LLM 安全需要 CompanionView

LLM 不能接触 raw state。v0.5 的 flat snapshot 无过滤机制——LLM 如果能看到完整 state，就会泄露谜底。v0.6 的 CompanionView 是 LLM 唯一入口：`hiddenTruthAccessible` 始终 `false`，锁定线索不在 view 中。

**防剧透不是在 prompt 里说"别说"，而是从数据源头上不让它知道。**

### 2.3 铁律需要代码执行

v0.5 的规则是文档约定。v0.6 的规则是类型系统：

```
Engine 是唯一裁判   → MemoryEvent 只能由 LegacyEngineAdapter 产生
LLM 只做表达        → LLMProvider 只返回文本，不修改 state
Assistant 只看 View → AssistantController 唯一输入是 CompanionView
推荐来自 Planner    → ActionPlanner 只能推荐 ActionRegistry 中的 action
Belief ≠ Knowledge  → 两个独立 Store，类型系统区分
```

### 2.4 为后续功能建立基础设施

许知微 Companion Runtime 依赖 Knowledge+Belief+Timeline+CompanionView。浏览器 IndexedDB 依赖 MemoryEvent 序列化。LLM 接入依赖 PromptMemoryContext。

---

## 三、设计思路与实现路径

### 3.1 Strangler Pattern：渐进迁移

不重写整个游戏。新代码在 `src/runtime/`，通过 `LegacyEngineAdapter` 桥接现有 `engine.js`。原有测试每个 Slice 后继续通过。

### 3.2 Slice 化开发

| Slice | 输出 | 验证 |
|-------|------|------|
| Slice 0 | TypeScript 骨架 | tsc + 模块测试 |
| Slice 1 | MemoryRuntime Core | slice1 测试 + legacy 迁移 |
| Slice 2 | CompanionView 集成 | 全链路验证 |

每个 Slice 提交后：`build:runtime` → `test:runtime` → `test:standalone`。

### 3.3 代码审查驱动

三轮审查，累计 5 CRITICAL + 7 HIGH 全部修复，零回归。

### 3.4 类型系统作为设计工具

`MemoryEventType` 29 种 union type 编译期保证。`Result<T,E>` Rust 风格 discriminated union。`hiddenTruthAccessible: false` 字面量类型级不变式。`RuntimeId` 值对象正则校验。

---

## 四、后续开发指导原则

### 原则 1：Engine 是唯一裁判

所有状态修改必须通过 Engine → Adapter → MemoryRuntime。LLM 输出只影响 visibleText。Code review 第一个检查项：新代码有没有绕过 Engine？

### 原则 2：陌生人原则

防剧透不是让 LLM "别说"，而是从数据源头不让它知道。CompanionView 是 LLM 唯一输入。任何新 LLM 功能，第一步不是写 prompt，是确认数据入口。

### 原则 3：每个 Slice 独立可验证

`npm run test:standalone` 必须始终通过。测试失败则修复后再提交，不积压。

### 原则 4：类型系统先行

接口定义 → 类型检查 → 骨架实现 → 完整实现。跳过类型定义直接写实现必然产生 unsafe cast。

### 原则 5：CompanionView 是唯一数据契约

Assistant/ActionPlanner/FallbackTemplate/OutputValidator 都只能通过 CompanionView 获取 game state。需要新数据时先扩展 CompanionView schema。

### 原则 6：内容与代码分离

游戏内容通过 `RuntimeContentLoader` 从 `materials/runtime/` 加载。硬编码文本应迁移到外部文件。

### 原则 7：代码审查是开发流程的一部分

每个主要 Slice 完成后必须审查。CRITICAL 必须在下一 Slice 前修复。审查报告保留在 `.claude/reviews/`。

---

## 五、关键指标

| 指标 | 数值 |
|------|------|
| TypeScript 源文件 | 61 files, 20 modules |
| 代码行数 | ~3,300 lines |
| 运行时导出 | 57 named exports |
| 编译 | 0 errors (strict mode) |
| 测试 | 8/8 pass |
| CRITICAL 修复 | 5 → 0 |
| HIGH 修复 | 7 → 0 |
