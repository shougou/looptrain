---
title: "Narrative State Runtime：LoopTrain 的记忆系统设计"
date: "2026-06-15T00:00:00+08:00"
version: "v0.6-memory-runtime"
status: "planning"
tags:
  - 状态管理
  - Memory Runtime
  - Narrative Runtime
  - Prompt Builder
  - AI Native
summary: "把玩家状态从聊天记录和临时 Session 中抽离出来，设计成面向循环叙事的 Narrative State Runtime。"
---

## 背景

当前 SLT 的玩家状态是 `engine.js` 里的 `START_STATE`，包含 `loop`、`clock`、`ap_remaining`、`known_clues`、`carried_memory`、`npc_states`、`flags`、`dialogue_session` 等字段。前端 `app.js` 将其序列化到 `localStorage`（key 为 `looptrain.standalone.v1`），刷新时恢复。

这套机制支撑了 v0.5 闭环，但有一个根本问题：**它是一个快照存档，不是一个记忆系统。** 它把 `dialogue_session`（纯临时对象）和 `known_clues`（跨循环知识）塞进同一个 JSON，不区分可遗忘和应永久保留、推断和已确认。循环多了之后，扁平快照既无法帮 Prompt Builder 生成准确上下文，也没法让玩家翻看"我到底经历了什么"。

## 当前问题

五个结构性问题：**(1)** 状态语义混在一起——数值状态、知识状态、关系状态、临时标签的生命周期完全不同，却被塞进一个 key 下一个 JSON。**(2)** 没有知识层——`known_clues` 只是线索 ID 列表，不区分 confirmed 和 inferred，Prompt Builder 只能靠 `includes()` 判断。**(3)** 没有信念层——玩家对 NPC 可能形成错误推断，循环叙事最有趣的部分在当前系统里完全不可记录。**(4)** Reset 只有一种——`nextLoop` 从 `loop_failure_outcome.confirmed_facts` 提取承继项写入 `carried_memory` 再重置其余字段，无法实现"仅重试当前循环"或"完全清空记忆"。**(5)** Prompt Builder 直接拼装零碎状态，知识变多后越来越脆弱。

## 设计目标

LoopTrain 需要一套专门面向循环叙事的状态管理模型。我不叫它"用户状态管理"，而叫它 **Narrative State Runtime**。

核心命题：

> **LoopTrain 不应该保存玩家说过什么，而应该保存玩家经历了什么、理解了什么、相信了什么，以及这些认知是如何在一次次循环中逐渐改变的。**

Runtime 的目标：用结构化状态替换聊天记录作为唯一真相来源；按生命周期分层管理；让 Prompt Builder 只读结构化状态；支持多种粒度的 Reset；让 Archive 成为一等公民。

## 状态分层

Narrative State Runtime 拆成七个逻辑层：

```
Player
│
├── Event Log    ── 系统发生的所有事实（只追加，不可变）
├── Timeline     ── 玩家视角经历（按循环组织，可读）
├── Knowledge    ── 玩家已确认知道什么
├── Belief       ── 玩家当前相信什么（可能是错的）
├── Relationship ── 玩家与 NPC 的关系状态
├── Archive      ── 每次循环的永久记录
└── Profile      ── 玩家身份元信息
```

核心设计的精简结构如下：

```yaml
player: { id, identity: { revealed, codename, contact }, current_loop, current_save }

event_log:
  - { id, loop, clock, type, target, source }
  # type: clue_discovered | dialogue_started | action_committed | loop_failed

knowledge:
  train_explosion_imminent: true
  spy_identity: false        # false 意味"玩家还不知道"
  button_meaning: false
  # 支持版本快照: knowledge_versions: [{ loop: 1, knowledge: {...} }]

belief:
  zhao_police: { is_enemy: { value: true, confidence: 0.8 } }
  xiaoning: { knows_more_than_she_says: { value: true, confidence: 0.7 } }
  # Belief ≠ Knowledge：前者是推断的，后者是确认的

relationships:
  xiaoning: { trust: 70, fear: 40, unlocked_actions: [] }
  zhao_police: { trust: 10, suspicion: 20, unlocked_actions: [check_floor_with_evidence] }

timeline:
  - { loop: 1, result: dead, summary: "...", key_events: [...], new_knowledge: [...] }
  - { loop: 2, result: dead, summary: "...", key_events: [...], new_knowledge: [...] }

archive:
  # player-visible: "Loop #1 死亡 ✓爆炸 ✗未发现异常"
  # /memory 界面，可随时翻阅，Developer 也可用其 Debug
```

各层边界清晰：Event Log 记录系统事实（Replay 可完全重放），Timeline 是面向玩家的可读经历，Knowledge 是 confirmed 的（Prompt Builder 用它做剧透控制——`spy_identity: false` 比 Prompt 指令约束更稳定），Belief 是 inferred 的（高 confidence 的错误信念被推翻时冲击力最大），Relationship 承载当前 `npc_states` 的能力并扩展 `unlocked_actions` 门控，Archive 是"走过的路"的永久记录。

## 与当前 SLT 的关系

这不是替换，是增量架构演进。当前 `engine.js` 的 `normalize()`、`failLoop()`、`nextLoop()` 已经是 Runtime 雏形。v0.6 把它们系统化：把标志位变成结构化对象，把隐式知识变成显式 Knowledge 层，把 Prompt 拼装变成从结构化状态读取。

**铁律不变：Engine 是唯一裁判，LLM 只读取状态生成 NPC 表演文本。** Runtime 让 Engine 管得更清楚，不引入新的控制源。

当前字段对齐：`START_STATE` → 拆进 Profile / Knowledge / Relationship / Flags；`known_clues` → Knowledge 层按 confirmed/inferred 区分；`carried_memory` → Knowledge + Timeline 的循环边界；`npc_states` → Relationship 层；`flags` → 引擎内部 Flag 与叙事层状态分离；`dialogue_session` → 明确标记为临时对象不持久化；`looptrain.standalone.v1` → 升级为分层持久化。

## Prompt Builder 边界

v0.6 之后，Builder 的输入变为：

```
Knowledge (confirmed) + Belief (inferred, with confidence)
  + Relationship (trust/fear thresholds)
  + Scene (location, NPCs, clock)
  + Timeline (relevant previous loops)
  → Builder → Prompt
```

LLM 不再接触聊天历史或 `dialogue_session`。剧透控制从"Prompt 里叮嘱"变成"Knowledge 层对应 key 为 false"。LLM Bridge 也因输入全为结构化 JSON 而简化。

## Reset / Archive 设计

v0.6 支持四种 Reset：**Soft Reset**——保留 Knowledge、Belief、Relationship，只重置 `clock`、`ap_remaining`、`dialogue_session`，玩家记得一切；**Chapter Reset**——保留 Meta Knowledge，重置 Episode Knowledge、Belief、Relationship；**Forget**——清空所有 Knowledge 和 Belief，只保留 Profile 和 Archive；**Developer Reset**——完全清空含 Archive，仅开发用。

Archive 在所有 Reset 中不被删除。删档不等于删除记忆档案。

## v0.6 实施顺序

v0.6 只做 Memory Runtime，不加 NPC、不加剧情、不做 UI。

1. 建立 Player Runtime 基础结构（围绕 `player` 组织）
2. 建立 Knowledge 层（从 `known_clues`/`carried_memory` 迁移，区分 confirmed/inferred，支持版本快照）
3. 建立 Belief 层（定义 `confidence` 更新规则，由 Engine 驱动）
4. 建立 Event Log（Engine 关键路径插入事件记录，先写 Event 再改状态）
5. 建立 Timeline 层（从 Event Log 自动生成可读摘要）
6. 重构 Prompt Builder（切换为结构化读取，不再依赖聊天历史）
7. 实现四种 Reset 模式
8. 持久化升级为分层存储（区分临时会话与永久记忆）

## 设计判断

**不一步到位上 Knowledge Graph**：图结构的实现成本远高于分层 JSON。v0.6 先得到正确稳定的数据模型，将来引入图推理是自然升级。**不在 v0.6 做 Archive 界面**：先建数据层，界面作为 v0.7 UI 工作。**不让 LLM 更新 Belief**：Engine 是唯一裁判，confidence 更新规则由 Engine 驱动，保证叙事一致性不依赖 LLM 性能波动。

## 后续计划

- **v0.7 Narrative Runtime**：剧情内容结构化（DSL 替代 Markdown Prompt），Builder 动态生成 Prompt
- **v0.8 World Runtime**：场景交互对象状态管理
- **v0.9 Loop Runtime**：Checkpoint、Rollback、Replay、跨循环世界状态变更
- **v1.0 Narrative OS**：可运行任意循环叙事的通用 Runtime

## 备注

- Narrative State Runtime 是设计方向，不是软件模块名。代码中分散在 Engine、memory 模块和 Prompt Builder 之间。
- `todos/UserState.md` 是主要参考来源。
- 本文为 planning 状态，具体 JSON schema 和 API 变更在正式开发时确定。
