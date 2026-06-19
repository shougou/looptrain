---
title: "LoopTrain v0.6 Runtime 开发总结：从 flat snapshot 到分层记忆系统"
date: "2026-06-19T17:00:00+08:00"
version: "v0.6-runtime"
status: "current"
lastVerified: "2026-06-19"
scope: "Runtime architecture"
spoilerLevel: "internal"
tags:
  - 技术实现
  - 架构重构
  - TypeScript
  - 事件溯源
  - 开发原则
summary: "v0.6 将 LoopTrain 从 v0.5 的 flat snapshot state 升级为分层 TypeScript Runtime 架构，建立 MemoryRuntime Core、Deterministic Assistant 流水线，沉淀 7 条后续开发指导原则。"
---

## 一、v0.6 改了什么

v0.6 的核心目标：**把 v0.5 的 flat snapshot state 升级为分层 TypeScript Runtime 架构**。

### 从 flat snapshot 到分层记忆系统

v0.5 的游戏状态是扁平 JSON，不同生命周期的数据混在一起，不能回答"玩家是怎么知道的"。

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

### Deterministic Assistant 流水线

新增"询问助手"系统，8 步确定性流水线：ClientState → CompanionViewBuilder → VisibilityFilter → IntentClassifier → PolicyEngine → ActionPlanner → FallbackTemplateEngine → OutputValidator → ResponseRenderer → UI。核心约束：Assistant 只读 CompanionView（安全投影），不接触 hidden truth。

### Slice 2：MemoryRuntime ↔ Assistant 对接

CompanionViewBuilder 从 MemoryRuntime 事件流提取真实 loopCount、failureCount、visibleNpcIds、confirmedClueIds、activeBeliefs 等。ActionPlanner 评分基于真实 Knowledge/Belief。

### 模块清单

61 个 TypeScript 文件，20 个模块：shared、ids、engine、memory、companion-view、assistant、content、policy、knowledge、belief、relationship、timeline、archive、profile、snapshot、storage、migration、reset、prompt、tests。

---

## 二、为什么这么做

**v0.5 state 不是记忆系统。** flat snapshot 能做存档，不能做记忆。系统不知道线索是怎么来的、什么时候来的、可信度如何。

**LLM 安全需要 CompanionView。** LLM 不能接触 raw state。防剧透不是在 prompt 里说"别说"，而是从数据源头上不让它知道。v0.6 的 CompanionView 是 LLM 唯一入口：hiddenTruthAccessible 始终 false。

**铁律需要代码执行。** Engine 是唯一裁判 → MemoryEvent 只能由 LegacyEngineAdapter 产生。LLM 只做表达 → LLMProvider 只返回文本。Assistant 只看 View → 唯一输入是 CompanionView。Belief ≠ Knowledge → 两个独立 Store。

---

## 三、设计思路与实现路径

**Strangler Pattern 渐进迁移**：不重写整个游戏。新代码在 `src/runtime/`，通过 LegacyEngineAdapter 桥接现有 engine.js。

**Slice 化开发**：3 个 Slice（类型骨架 → MemoryRuntime Core → CompanionView 集成），每个 Slice 后 `build:runtime → test:runtime → test:standalone` 全部通过。

**代码审查驱动**：三轮正式审查，5 CRITICAL + 7 HIGH 全部修复，零回归。

**类型系统作为设计工具**：MemoryEventType 29 种 union type 编译期保证，Result<T,E> Rust 风格 discriminated union，hiddenTruthAccessible: false 字面量类型级不变式。

---

## 四、后续开发指导原则

1. **Engine 是唯一裁判**：所有状态修改必须通过 Engine → Adapter → MemoryRuntime。LLM 输出只影响 visibleText。
2. **陌生人原则**：防剧透不是让 LLM "别说"，而是从数据源头不让它知道。CompanionView 是 LLM 唯一输入。
3. **每个 Slice 独立可验证**：`npm run test:standalone` 必须始终通过。
4. **类型系统先行**：接口定义 → 类型检查 → 骨架实现 → 完整实现。
5. **CompanionView 是唯一数据契约**：Assistant 等模块只能通过 CompanionView 获取 game state。
6. **内容与代码分离**：游戏内容通过 RuntimeContentLoader 从 materials/runtime/ 加载。
7. **代码审查是开发流程的一部分**：每个主要 Slice 完成后必须审查。

---

## 五、关键指标

| 指标 | 数值 |
|------|------|
| TypeScript 源文件 | 61 files, 20 modules |
| 代码行数 | ~3,300 lines |
| 编译 | 0 errors (strict mode) |
| 测试 | 8/8 pass |
| CRITICAL 修复 | 5 → 0 |
| HIGH 修复 | 7 → 0 |
