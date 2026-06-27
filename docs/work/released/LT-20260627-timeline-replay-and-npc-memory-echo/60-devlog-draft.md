# Devlog Draft: v0.12.0 · Replay Echo

**Work Item**: LT-20260627-timeline-replay-and-npc-memory-echo
**Version**: v0.12.0
**Release**: Replay Echo
**Date**: 2026-06-27
**Story Version**: c01-trial-0.3

---

## 导语

v0.12.0 不只是一次功能更新，它改变了《寒灯初醒》的时间线感知方式。

在此之前，失败意味着回到 14:00，一切从零开始。玩家的记忆会继承（线索、知识），但游戏世界的叙事不会。每一轮都是同一个开头，赵乘警一样的开场白，灰衣乘客一样的冷淡，小宁一样的紧张。

v0.12.0 让 NPC 也开始"记住"——不是以数据形式，而是以**情感残响**的形式。小宁在第 N 轮看到你会感到莫名的熟悉。灰衣乘客会怀疑你的目的。赵乘警的情绪会因为你过去的行动而产生微妙偏移。

同时，时间线回放系统让玩家可以在失败后从上一轮的关键节点接入，不再从 14:00 从头开始。锚点的选择本身成为一种策略——从有更多信息的位置开始，但预置 AP 更少。

---

## 时间线回放：失败后的接入策略

**核心变化**：失败后，玩家在结算卡内看到一个"ReplayAnchorPicker"——上一轮所有时间线条目（观察、对话、事件）作为可选锚点。选择后，新轮次从该时间点开始，继承上下文状态（NPC 记忆、已发现线索、时间线条目），但时间重置为 14:00 + 偏移，AP 按 `calculatePrepositionAP()` 计算。

**设计意图**：
- 从关键观察点后开始（如"已观察到灰衣乘客放置了物品"），可以更快推进
- 从对话后开始（如"已与小宁对话获得信任"），可以保留 NPC 关系状态
- 但越靠后的锚点，预置 AP 越少（每 5 分钟扣 1，上限 3），迫使玩家在"继承信息"和"行动资源"之间权衡

**技术实现**：
- `engine.resumeFromReplayAnchor()` — 从锚点生成新轮次状态
- `engine.calculatePrepositionAP()` — 14:00 满 AP，每 5 分钟扣 1，上限 3
- IndexedDB 存储锚点（replayAnchors store）+ 降级策略（localStorage fallback）
- 前端 ReplayAnchorPicker UI（失败结算卡内嵌）

---

## NPC 记忆残响：当情感跨越时间线

**核心变化**：NPC 在多轮交互后产生"残响"（Echo）——基于上一轮的 threshold 规则，在下一轮开场白和 LLM 表演中体现情感残留。

**三 NPC 规则**：

| NPC | 阈值 | 残响类型 | 效果 |
|-----|------|----------|------|
| 小宁 | trust >= 45 | trust_residue | 开场白更亲近，提到"感觉你...好像很了解我" |
| 灰衣乘客 | suspicion >= 50 | suspicion_residue | 开场白更警惕，提到"你...不是第一次来吧" |
| 赵乘警 | trust >= 30 + zhao_checked_floor | emotional_residue | 开场白更情绪化，提到"上次你说的那个..." |

**技术实现**：
- `engine.buildNpcMemoryEchoes()` — 基于 prevState 和 loopOutcome 生成 Echo
- `engine.applyNpcMemoryEchoes()` — 将 Echo 应用到新轮次状态
- `engine.resolveNpcOpening()` — 根据 Echo 选择 opening 变体
- NPC JSON 新增 `memory_echo_profile`（opening_variants + forbidden_reveals）
- LLM prompt 注入【轮回残响】段落，禁词检测防止 LLM 直接说出"上轮"等 meta 语言

**设计意图**：
- 让轮回从"纯机制"变成"叙事张力"——玩家不是简单重复，而是在一个逐渐变质的循环中推进
- LLM 在生成 NPC 对话时，不需要知道轮回的完整历史，只需知道"这一 NPC 在当前轮次有某种情感偏移"——由系统注入，LLM 负责表演
- 禁词系统（6 个禁词 + 3 组 forbidden_reveals）确保 LLM 不会直接提及 meta 信息（"上次循环"、"你之前告诉过我"），保持叙事的内在一致性

---

## LLM Echo Guard：防止"打破第四面墙"

**核心问题**：LLM 在 NPC 对话中容易直接引用之前的对话内容（"你上次告诉我..."），这在玩家体验中是"打破第四面墙"——NPC 不应该知道轮回的存在。

**解决方案**：
1. **Prompt 注入**：在 LLM prompt 的【轮回残响】段落中，只描述 NPC 的当前情感状态（"你感到莫名的熟悉"），不描述历史事件
2. **禁词检测**：`guardLlmEchoReply()` 检测 6 个禁词（"上次"、"之前"、"还记得"、"你说过"、"上次循环"、"上一轮"）和 3 组 forbidden_reveals（跨轮线索、时间线事实、其他 NPC 跨轮对话），命中则回退 Mock 模式
3. **Server 管线接入**：`/api/llm/npc-reply` 在调用 LLM 后、返回前端前运行 guard

---

## 版本号体系：四层结构

v0.12.0 引入四层版本号：

| 层 | 字段 | 当前值 | 用途 |
|----|------|--------|------|
| App | `app` | 0.12.0 | 代码版本，SemVer |
| Channel | `channel` | playtest | 发布通道（dev/playtest/stable） |
| Release | `release` | Replay Echo | 功能代号，玩家可见 |
| Story | `story` | c01-trial-0.3 | 内容版本，控制存档兼容性 |

所有存档兼容性检查都基于 `app` + `story` + `saveSchemaVersion`。v0.12.0 将 Save Schema 从 1 升级到 2，旧存档自动触发 breaking change 重置。

---

## 修复：portrait-intro.js 崩溃

v0.12.0 修复了一个影响新玩家的严重 bug：`portrait-intro.js` 的 `getBoundingClientRect is not a function` 错误，在 Chrome DevTools 中产生了 47 次控制台报错。修复包括：
- 删除重复 `setImage` 定义（`setImage` 既是变量名又是函数名，导致函数名被覆盖为字符串值）
- `try-finally` → `try-catch-finally`（错误处理时关闭 overlay 的清理代码在 finally 中，但 catch 块丢失导致错误被吞）
- 添加防御性检查（`isOpen` 双重检查和 `stopAnimation()` 前检查状态）

---

## 验证

| 检查项 | 结果 |
|--------|------|
| `npm run check` 语法检查 | 通过 |
| `npm test` 引擎冒烟测试 | 6/6 通过 |
| `tests/replay_resume_test.js` | 通过 |
| `tests/npc_memory_echo_test.js` | 通过 |
| `tests/llm_echo_guard_test.js` | 通过 |
| Chrome DevTools 人工走查 | 全链路通过，零控制台错误 |

---

## 遗留

- E2E 测试 `replay-flow.spec.js` 待补充（需要完整的多轮失败-回放-接入-推进流程）
- Chrome 隐私模式 IndexedDB 降级策略（localStorage fallback）需真机验证
- 小宁 trust >= 45 的开场白变化（"感觉你...好像很了解我"）需多轮对话验证 LLM 实际表现

---

## 发布记录

- Release Note: [50-release-note.md](50-release-note.md)
- Review Report: [40-review.md](40-review.md)
- Implementation Log: [30-implementation-log.md](30-implementation-log.md)
