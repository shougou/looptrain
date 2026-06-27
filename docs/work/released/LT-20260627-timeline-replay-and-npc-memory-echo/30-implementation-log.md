# Implementation Log

> v0.12.0 · Replay Echo 实施日志

## 2026-06-27

### 已完成

**Phase 1: 版本号体系升级 + 基础设施**
- 废弃 `LT_RUNTIME_VERSION = 'v0.11.0-newbie-ui-unlock'` 旧命名
- 建立四层版本字段：`LT_APP_VERSION='0.12.0'`、`LT_RELEASE_CHANNEL='playtest'`、`LT_RELEASE_NAME='Replay Echo'`、`LT_STORY_VERSION='c01-trial-0.3'`、`LT_SAVE_SCHEMA_VERSION=2`
- 创建 `public/runtime-db.js`：IndexedDB 封装（5 个 store：meta/events/snapshots/replayAnchors/runs），含降级策略
- 创建 `public/runtime-recorder.js`：事件记录器，在行动边界自动生成 RuntimeEvent + Snapshot + ReplayAnchor

**Phase 2: Engine 核心逻辑**
- `engine.js` 新增 `clamp()`、`buildNpcMemoryEchoes()`（3 NPC 阈值规则：小宁 trust>=45、灰衣 suspicion>=50、赵乘警 trust>=30+zhao_checked_floor）、`applyNpcMemoryEchoes()`
- `engine.js` 新增 `resolveNpcOpening()`、`calculatePrepositionAP()`（14:00 不扣 AP，每 5 分钟扣 1 AP，上限 3）、`buildReplayOpening()`、`resumeFromReplayAnchor()`
- `engine.js` 修改 `nextLoop()`：末尾应用 Echo（通用路径，所有进入下一轮都走）
- `engine.js` 修改 `startDialogue()`：使用 `resolveNpcOpening()` 替代 `npc.opening`
- 3 个 NPC JSON 新增 `memory_echo_profile`（含 `opening_variants` 和 `forbidden_reveals`）
- `server.js` 新增 `POST /api/replay/resume` 端点

**Phase 3: LLM Echo Guard**
- `llm/prompt.js`：`buildNpcPrompt()` 增加【轮回残响】段落
- `llm/providers.js`：新增 `guardLlmEchoReply()` 禁词检测（6 个禁词 + 3 组 forbidden_reveals 关键词）
- `server.js`：`/api/llm/npc-reply` 路由接入 `guardLlmEchoReply()`，在 `cleanLlmReply()` 之后调用，返回 null 时回退到 Mock（mode: `mock_echo_guard`）

**Phase 4: 前端 UI 改造**
- `app.js`：`handleResponse`/`handleObserveResponse`/`failLoop`/`nextLoop` 加 `recordEvent()`
- `app.js`：`nextLoop()` 补 `saveState()` bugfix（当前遗漏，刷新后丢失新轮次状态）
- `app.js`：`renderFailureOutcome()` 扩展 ReplayAnchorPicker UI（异步加载 anchors + 选择 + 调用 /api/replay/resume）
- `index.html`：引入 `runtime-db.js` + `runtime-recorder.js`
- `style.css`：ReplayAnchorPicker 样式

**Phase 5: 测试**
- 新增 `tests/replay_resume_test.js`：回放接入 + AP 计算 + memory 继承测试
- 新增 `tests/npc_memory_echo_test.js`：Echo 生成 + 应用 + 不影响成功条件测试
- 新增 `tests/llm_echo_guard_test.js`：禁词检测 + 回退测试
- 现有 6 个测试全部通过，无回归

### 变更文件

**修改文件（10 个）**：
| 文件 | 变更行数 | 说明 |
|------|---------|------|
| `engine.js` | +143 | 新增 7 个函数、修改 nextLoop/startDialogue、更新 module.exports |
| `public/app.js` | +94 | 版本常量、事件记录接入、nextLoop bugfix、renderFailureOutcome 扩展 |
| `server.js` | +28 | /api/health 版本字段、/api/replay/resume 端点、启动日志 |
| `llm/prompt.js` | +16 | buildNpcPrompt echo 段落 |
| `llm/providers.js` | +27 | guardLlmEchoReply + module.exports |
| `public/style.css` | +11 | ReplayAnchorPicker 样式 |
| `public/index.html` | +8 | 引入 runtime-db.js + runtime-recorder.js |
| `materials/runtime/characters/xiaoning.json` | +12 | memory_echo_profile |
| `materials/runtime/characters/gray_passenger.json` | +11 | memory_echo_profile |
| `materials/runtime/characters/zhao_police.json` | +11 | memory_echo_profile |

**新增文件（5 个）**：
| 文件 | 行数 | 说明 |
|------|------|------|
| `public/runtime-db.js` | 137 | IndexedDB 封装 |
| `public/runtime-recorder.js` | 103 | 事件记录器 |
| `tests/replay_resume_test.js` | 40 | 回放接入测试 |
| `tests/npc_memory_echo_test.js` | 42 | Echo 测试 |
| `tests/llm_echo_guard_test.js` | 30 | LLM Guard 测试 |

### 偏离 plan 的地方

1. **测试数据修正**：`npc_memory_echo_test.js` 中赵乘警 Echo 测试的 `flags` 字段初始放在了 `npc_states` 内部，导致 `prevState.flags` 为 undefined。修正为放在 `prevState` 顶层。这是测试数据问题，非 Engine 逻辑问题。

2. **ReplayAnchorPicker 未独立为组件文件**：Plan 中 Step 13 提到创建 `public/components/replay-anchor-picker.js`，实际实现中将其逻辑直接内联到 `app.js` 的 `renderFailureOutcome()` 中。原因是逻辑与失败结算卡强耦合，独立文件会增加不必要的跨文件依赖。如后续需要复用可再抽取。

3. **E2E 测试未创建**：Plan 中提到创建 `tests/e2e/replay-flow.spec.js`，未实现。原因是 E2E 测试需要服务器运行，且需要完整的 IndexedDB 交互流程，留待人工验证阶段补充。

### Phase 6: portrait-intro.js Bug 修复（计划外）

**问题**：`portrait-intro.js` 存在 `Uncaught TypeError: element.getBoundingClientRect is not a function`（控制台报错 47 次），导致 intro overlay 无法正常关闭，新玩家被阻断。

**根因**：
1. `setImage` 函数被重复定义两次（第 25 行和第 138 行），第二个覆盖第一个
2. `play()` 函数使用 `try-finally` 无 `catch`，Web Animations API 的 Promise rejection 传播为 Uncaught TypeError
3. 缺少 `getBoundingClientRect` 和 `animate` 方法的防御性检查

**修复**：
- 删除第一个冗余的 `setImage` 定义，保留更完善的版本
- `try-finally` → `try-catch-finally`，静默处理动画错误（立绘入场为装饰性功能）
- 添加 `getBoundingClientRect` 防御性检查（fallback rect）
- 添加 `animate` 方法存在性检查，不支持时回退到 `setImage`

**验证**：
- `node --check` 语法通过
- 引擎冒烟测试全部通过
- Chrome DevTools 自动化测试：页面加载零控制台错误，"进入游戏"正常关闭 intro，"询问许知微"正常触发立绘动画和对话

**变更文件**：`public/portrait-intro.js`（+105/-105 行，净变更）

### 人工走查结果（Chrome DevTools 自动化）

| 走查项 | 结果 | 备注 |
|--------|------|------|
| 页面加载 `?reset=1` | ✅ | intro overlay 正常显示 |
| 点击"进入游戏"关闭 intro | ✅ | opacity→0, pointer-events→none |
| 观察当前车厢 | ✅ | 时间 14:00→14:01, AP 10→9, 获得线索 |
| 更多行动菜单 | ✅ | 14 个子行动正确显示 |
| 询问许知微（触发 PortraitIntro.play） | ✅ | 立绘动画正常，零控制台错误 |
| 对话流程 | ✅ | 对话取证状态，许知微回复正常 |
| 强制失败测试 | ✅ | 失败结算显示，记忆继承正确 |
| 进入第 2 轮 | ✅ | 轮次+1，时间重置 14:00，AP 重置 10，记忆继承 |
| 查看案件板 | ✅ | 案件整理状态，许知微第 2 轮开场白 |

### 待处理

- [ ] E2E 测试 `tests/e2e/replay-flow.spec.js` 需在服务器启动后补充
- [x] 人工走查：第一轮失败 → 进入第 2 轮 → 验证 clock/location/AP/memory — ✅ 已通过
- [ ] 人工走查：小宁 trust >= 45 → 下一轮开场白变化（需多轮对话提升信任度）
- [x] 人工走查：原始成功路径仍然可用 — ✅ 观察/对话/失败/轮回全链路通过
- [ ] Chrome 隐私模式测试 IndexedDB 降级
