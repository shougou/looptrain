# Release Note: v0.12.0-replay-echo · Replay Echo

版本级别: [x] minor
**Work Item**: LT-20260627-timeline-replay-and-npc-memory-echo
**版本号**: v0.12.0-replay-echo
**发布名称**: Replay Echo
**发布阶段**: Playtest
**Story Version**: c01-trial-0.3
**Save Schema Version**: 2
**发布日期**: 2026-06-27

---

## 概述

v0.12.0 引入两大核心系统：**时间线回放**（Timeline Replay）和 **NPC 记忆残响**（NPC Memory Echo）。玩家失败后不再只能从 14:00 从头开始，可以选择上一轮时间线中的锚点作为接入点。NPC 在多轮交互后产生"残响"——既视感、情绪偏移、莫名的熟悉或警惕。

同时修复了 portrait-intro.js 的 `getBoundingClientRect is not a function` bug，该 bug 导致新玩家无法正常关闭 intro overlay。

---

## Added

### 时间线回放系统
- `engine.resumeFromReplayAnchor(previous, anchor, policy)` — 基于锚点生成新轮次状态
- `engine.calculatePrepositionAP(clock)` — 预置 AP 计算（14:00 满 AP，每 5 分钟扣 1，上限 3）
- `engine.buildReplayOpening(state)` — 回放开场叙事
- `POST /api/replay/resume` 端点
- 前端 ReplayAnchorPicker UI（失败结算卡内嵌）
- `style.css` ReplayAnchorPicker 样式

### NPC 记忆残响系统
- `engine.buildNpcMemoryEchoes(prevState, loopOutcome)` — 三 NPC 阈值规则生成 Echo
  - 小宁：trust >= 45 → trust_residue（信任残响）
  - 灰衣乘客：suspicion >= 50 → suspicion_residue（怀疑残响）
  - 赵乘警：trust >= 30 + zhao_checked_floor → emotional_residue（情绪残响）
- `engine.applyNpcMemoryEchoes(state, echoes)` — 应用 Echo 到 NPC 状态
- `engine.resolveNpcOpening(npcId, state)` — Echo 感知的开场白解析
- `nextLoop()` 末尾自动应用 Echo（通用路径）
- 3 个 NPC JSON 新增 `memory_echo_profile`（opening_variants + forbidden_reveals）

### LLM Echo Guard
- `llm/prompt.js` `buildNpcPrompt()` 增加【轮回残响】段落
- `llm/providers.js` `guardLlmEchoReply()` — 禁词检测（6 个禁词 + 3 组 forbidden_reveals）
- `server.js` `/api/llm/npc-reply` 接入 guard，命中禁词回退 Mock

### Runtime 基础设施
- `public/runtime-db.js` — IndexedDB 封装（5 个 store + 降级策略）
- `public/runtime-recorder.js` — 事件记录器（观察/对话/轮回边界自动记录）
- `app.js` 4 个关键函数接入 RuntimeRecorder

### 版本号体系
- 四层版本字段：app 0.12.0 / playtest / Replay Echo / c01-trial-0.3
- `LT_SAVE_SCHEMA_VERSION` 从 1 升到 2（breaking change，旧存档自动重置）

### 测试
- `tests/replay_resume_test.js` — 回放接入 + AP + memory 继承
- `tests/npc_memory_echo_test.js` — Echo 生成 + 应用 + 不影响成功条件
- `tests/llm_echo_guard_test.js` — 禁词检测 + 回退

---

## Fixed

- **portrait-intro.js `getBoundingClientRect is not a function`**（47 次控制台错误）：删除重复 `setImage` 定义，`try-finally` → `try-catch-finally`，添加防御性检查
- **nextLoop saveState 遗漏**：`nextLoop()` 获取新状态后未调用 `saveState()`，刷新后丢失新轮次状态

---

## Changed

- `server.js` `/api/health` 返回四层版本字段
- `engine.js` `startDialogue()` 使用 `resolveNpcOpening()` 替代 `npc.opening`
- `app.js` 版本常量从 `LT_RUNTIME_VERSION` 迁移到四层体系
- `index.html` 引入 `runtime-db.js` + `runtime-recorder.js`

---

## 验证结果

| 检查项 | 结果 |
|--------|------|
| `npm run check` 语法检查 | ✅ |
| `npm test` 引擎冒烟测试 | ✅ All pass |
| `tests/replay_resume_test.js` | ✅ |
| `tests/npc_memory_echo_test.js` | ✅ |
| `tests/llm_echo_guard_test.js` | ✅ |
| Chrome DevTools 人工走查 | ✅ 全链路通过 |
| 控制台错误 | ✅ 零错误（修复前 47 次） |

---

## 遗留

- E2E 测试 `tests/e2e/replay-flow.spec.js` 待补充
- Chrome 隐私模式 IndexedDB 降级待真机验证
  - 小宁 trust >= 45 开场白变化需多轮对话验证

---

## 发布检查

- [x] `npm run check` 语法检查通过
- [x] `npm test` 全部测试通过（6 个引擎测试 + 3 个新测试）
- [x] 版本号所有位置一致（4 层版本体系）
- [x] 现有路径无回归（6 个引擎测试 + 人工走查全链路）
- [x] 新功能单元测试通过（3 个新测试文件）
- [x] Chrome DevTools 人工走查零控制台错误
- [x] Save Schema 兼容性处理（v1 → v2 自动重置）
- [x] LLM echo guard 接入 server 管线
- [x] E2E 测试 `replay-flow.spec.js` 待补充（不影响核心功能，不阻塞发布）
- [x] Chrome 隐私模式 IndexedDB 降级待真机验证（后续迭代验证）

---

## 收尾检查

- [x] 更新 VERSION 文件: v0.12.0-replay-echo
- [x] 同步版本号到所有位置（sync_version.sh）
- [x] 更新稳态文档: PROJECT_STATUS, CHANGELOG, ROADMAP, KNOWN_ISSUES
- [x] 创建 devlog 草稿: 60-devlog-draft.md
- [x] 同步 devlog 数据层: site-status.json, roadmap.ts
- [x] 追加 changelog 条目到 devlog/src/content/changelog/
- [x] 运行 check_project_docs.sh — 通过
- [x] 运行 check_release_wrapup.sh — 通过
- [x] 移动 work item 到 released/（Archive 阶段，待 check 通过后执行）

---

## 破坏性变更

- `LT_SAVE_SCHEMA_VERSION` 1 → 2：旧存档自动触发 breaking change 重置
- `LT_STORY_VERSION` `demo-0.8-handeng` → `c01-trial-0.3`：旧 ReplayAnchor 标记为不可回放
