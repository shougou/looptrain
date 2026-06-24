---
status: pending-review
type: feature
priority: P1
topic: mobile-portrait-ui-redesign
created: 2026-06-24T00:00:00+08:00
updated: 2026-06-24T00:00:00+08:00
owner: shougou
target_release: v0.11.0
decision: pending-review
---

# LT-20260624 — 手机竖版 UX/UI 重设计

## 背景

### 当前版本状态

LoopTrain v0.10.0-npc-timeline-inference 已上线 NPC 时间线推理系统（player_timeline + 3 种观察行动 + 矛盾检测 + 推理生成 + 多维证据评分），但前端 UI 仍停留在 v0.7 的场景驱动布局，未跟上引擎能力的演进。

当前前端技术栈：vanilla HTML/CSS/JS（`looptrain/standalone/public/`），手机竖屏 390px 基准，无框架依赖。核心文件：

| 文件 | 行数 | 职责 |
|---|---|---|
| `index.html` | 131 | DOM 骨架，12 层 z-index 堆叠 |
| `app.js` | 1290 | 全部渲染逻辑、状态管理、API 调用、事件绑定 |
| `style.css` | 651 | 全部样式，11 个 CSS 变量，18 个组件 |
| `portrait-intro.js` | 153 | NPC 立绘入场动画（Web Animations API） |
| `audio-manager.js` | 251 | 音效系统（Web Audio API） |

### 摸排发现的核心矛盾

经过对当前前端代码的全面审计（DOM 结构、渲染逻辑、状态管理、组件清单、交互模式、视觉系统、引擎数据契约），发现核心矛盾：

**引擎已具备结构化输出能力（TimelineEntry 20+ 字段、ClueDetail 4 类分类、3 种观察行动、矛盾检测、推理生成、多维证据评分），但 UI 仍以"追加文本到聊天流"为主要反馈方式，未将引擎的结构化数据转化为结构化的视觉反馈。**

具体表现为：
- `engine.js` 的 `observeEnvironment()` 返回 `ObservationResult`（含 `discovered[]`、`conflict_detected`、`clock_advanced`、`ap_remaining`），但 UI 只取 `discovered[].entry.title` 显示为普通文本
- `TimelineEntry` 有 `source_type`（observation/claim/inference/memory）、`status`（verified/claimed/remembered）、`current_loop_verified`、`contradicts[]`、`supports[]` 等字段，但时间线面板只是简单的分组列表
- `DialogueOutcome` 有 `clues_gained`、`world_events`、`unlocked_actions`、`ap_cost`、`time_advance`，但对话结算只显示为绿色消息块
- `LoopFailureOutcome` 有 `confirmed_facts`、`suspicions`、`mistakes`、`next_loop_suggestions`，但失败页只是一段 HTML 文本

### 与 UX-UI.md 提案的对接

项目根目录 `UX-UI.md`（856 行）提出了完整的手机竖版 UI 重设计提案，核心定位：

> **玩家不是在"点菜单"，而是在一个 15 分钟循环里调试现场。**
> UI 应该像一个"现场状态面板 + 行动反馈流 + 时间线调试器"。

同时 `docs/project/UI.md`（762 行）此前的 UI 分析也指出了信息层级混乱、立绘遮挡、目标结构化、对话状态分离等问题。

本构想整合两份文档的分析，以 UX-UI.md 的"现场调试器"定位为主方向，基于实际代码审计提出可落地的重设计方案。

---

## 核心问题诊断

基于对 `index.html`、`app.js`、`style.css`、`engine.js`、`server.js` 及 TypeScript runtime 的全面审计，诊断出以下 8 个核心问题：

### 问题 1：信息层级三栏堆叠，抢夺视觉焦点

**现状**：顶部连续三个栏（`index.html` L19-39）：
```
.lt-topbar (z:10)     → 轮次/时间/位置/AP
.lt-goal-bar (z:10)   → 当前目标文字 + 进度 + 轮次
.lt-command-bar (z:10) → 线索/人物/记忆/帮助/重置（5 个等权重按钮）
```

三栏均为 `position: relative; z-index: 10`，视觉权重相同，玩家第一眼无法判断哪个最重要。

**UX-UI.md 诊断**：顶部功能按钮过重，"线索/人物/记忆/帮助/重置全部放在顶部黄金区域，会让玩家误以为这些是当前最重要的操作"。真正核心应该是"当前位置 → 当前目标 → 可执行行动 → 行动结果 → 时间线变化"。

**代码证据**：`style.css` L494-519，5 个 `.lt-cmd-btn` 样式完全一致（11px, weight 600, 相同 bg/border），无优先级区分。`app.js` L277-283，命令栏从第 4 轮起 `display:none` 永久隐藏，无替代方案。

### 问题 2：行动按钮位置不可达，拇指操作断裂

**现状**：NPC 交互按钮、移动按钮、观察按钮全部作为 chips 放在 `.lt-scene-card` 内部（`index.html` L56, `app.js` L111-133），位于屏幕中上部。

**UX-UI.md 诊断**："手机竖屏玩家主要靠拇指操作，按钮应该在底部附近，而不是堆在中上部。"

**代码证据**：`.lt-content`（z:5）是唯一可滚动区域，`padding-bottom: 120px`（L105），但行动 chips 在内容流顶部，距底部输入栏约 400-500px。底部 `.lt-bottom`（z:12）只有对话/行动 tab 切换 + 输入框 + 发送按钮，没有快捷行动入口。

### 问题 3：行动反馈无结构化呈现，玩家无法快速判读

**现状**：所有行动结果通过 `appendMsg()` / `appendHtml()` 追加到 `.lt-log` 或 `.lt-dialogue-log`，表现为普通聊天消息（`style.css` L218-250，4 种消息样式仅区分颜色）。

**UX-UI.md 诊断**：玩家点击按钮后应该立刻明白"我做了什么 → 消耗了什么 → 发现了什么 → 新线索入库 → 新行动解锁"，而不是"只是下面多一段文字"。

**代码证据**：`app.js` L682-747 `handleResponse()` 将 `res.messages` 逐条追加到日志，无结构化卡片。引擎返回的 `ObservationResult`、`DialogueOutcome`、`LoopFailureOutcome` 的字段（`clues_gained`、`unlocked_actions`、`ap_cost`、`time_advance`、`conflict_detected`）被扁平化为 HTML 字符串。

### 问题 4：按钮类型混合，无语义分类

**现状**：`.lt-visible-npcs`（`app.js` L111-133）将 NPC 对话、场景移动、观察行动混在一起作为 chips，仅靠颜色区分（金色=NPC、蓝色=移动、绿色=观察）。

**UX-UI.md 诊断**：按钮里有"人物：小宁"、"行动：观察当前场景"、"移动：前往连接处"，本质不同却放在一起。应该拆成主行动、观察行动、对话对象、移动行动、高风险行动。

**代码证据**：`app.js` L111-133，三类 chips 在同一个 `npcWrap.innerHTML` 中拼接，无分组容器。颜色编码是唯一的类型提示，对色盲用户不可用（审计发现无 `aria-label` 或文字标签辅助）。

### 问题 5：持续观察无状态化，"盯住"沦为普通按钮

**现状**：`engine.js` 的 `observeEnvironment(type='npc')` 支持"盯住 NPC"（1 AP / 2 min），但 UI 层将其实现为一次性观察 chips（`app.js` L124-131，从 `_suggestions` 中过滤 `__OBSERVE_NPC__` 模板），点击后只返回一次结果。

**UX-UI.md 诊断**："盯住不是'点一下获得文本'，而是占用注意力换取时间线证据。" 应该像 debugger 里的 watch expression，持续关注目标，系统在时间线推进时自动捕捉异常行为。

**代码证据**：`app.js` L556-571 `handleObserveAction()` 调用 `POST /api/action/observe` 后，结果通过 `handleResponse()` 正常处理，无持续状态追踪。`engine.js` 的 `observeEnvironment()` 每次调用都是独立的，不维护"当前关注对象"状态。

### 问题 6：档案系统散落，5 个入口抢空间

**现状**：`index.html` L33-39 的 `.lt-command-bar` 放了 5 个按钮：线索、人物、记忆、帮助、重置。每个按钮通过 `handleCommand()`（`app.js` L355-494）在聊天流中内联显示一个列表。

**UX-UI.md 诊断**：顶部只保留一个"档案"入口和一个"许知微"入口。点击"档案"后进入抽屉（线索/人物/时间线/循环记忆）。"重置"放到右上角更多菜单。

**代码证据**：`app.js` L274-284 `renderCommandBar()` 从第 4 轮起隐藏命令栏（`display:none`），之后玩家只能靠输入命令字访问档案功能，可发现性归零。

### 问题 7：时间线作为隐藏系统，未可视化

**现状**：`player_timeline` 是 v0.10.0 的核心系统，`TimelineEntry` 有 20+ 字段（含 `source_type`、`status`、`current_loop_verified`、`contradicts[]`、`supports[]`），但 UI 层只有 `showTimeline()`（`app.js` L384-478）一个命令触发的内联列表，无常驻展示。

**UX-UI.md 诊断**："既然你已经实现了时间线管理，就要把它做成 LT 的特色，而不是隐藏系统。" 建议加入迷你时间线（顶部进度条）+ 可展开的本轮时间线 + 跨轮对比。

**代码证据**：`app.js` L428-478 `renderTimelineHtml()` 按 actor 分组渲染列表，条目有颜色标签（observation=蓝、claim=橙、inference=紫、memory=灰、conflict=红），但只在输入"查看时间线"时显示。`style.css` L610-651 `.lt-timeline-panel` 限高 60vh 且嵌套在已可滚动的 `.lt-content` 内，产生双重滚动。

### 问题 8：视觉层级扁平，金色语义稀释

**现状**：`style.css` 定义了 11 个 CSS 变量（L1-14），但金色 `--lt-gold: #d6a85a` 被用于 12 个不同 UI 角色：位置标题、NPC chips、发送按钮、激活 tab、toast、线索徽章边框、对话 NPC 名、时间线标题、目标栏、intro 标题、重置标题、玩家消息背景。

**UX-UI.md 诊断**："不要所有按钮都用金边，否则玩家不知道哪个重要。" 建议固定语义：金色=主线目标/关键推进，蓝色=观察/信息，绿色=已获得线索/安全行动，红色=危险/高风险/时间逼近，灰色=不可用/已完成。

**代码证据**：`style.css` 审计发现，11px 字号覆盖 8 个语义角色（topbar、subtitle、end-dialogue-btn、log-toggle、intro-kicker、intro-skip、goal-bar-loop、cmd-btn），13px 覆盖 10 个角色 — 字号层级过于扁平。`--lt-muted: #9ca3af` 在 `--lt-bg: #0e1116` 上的对比度约 4.8:1，勉强达到 WCAG AA 标准但 11px 小字不达标。

---

## 目标

### 核心目标

将 LoopTrain 的手机竖版 UI 从"功能堆叠的聊天界面"重构为"现场状态面板 + 行动反馈流 + 时间线调试器"，让玩家每一眼都知道当前局势，每一次点击都看到世界状态变化，每一轮循环都能对比自己改变了什么。

### 具体目标

1. **主界面四区结构**：顶部状态栏（含迷你时间线）→ 当前目标卡（结构化进展）→ 场景状态卡（状态可读）→ 行动反馈流（结构化行动结果卡）→ 底部行动区（推荐行动 + 更多行动抽屉）
2. **行动按钮下移**：从场景卡内部移到底部行动区，默认只显示 2-3 个推荐行动，其余进入"更多行动"抽屉
3. **统一行动结果卡**：所有行动（观察/对话/移动/高风险）后生成结构化 `ActionResultCard`，包含时间变化/AP 变化/发现内容/新增线索/人物状态变化/解锁行动/目标推进
4. **持续观察状态**：将"盯住 NPC / 守点观察"从一次性按钮升级为持续状态（`FocusWatchBar`），系统在时间推进时自动捕捉异常行为
5. **档案系统抽屉化**：线索/人物/时间线/记忆统一收入"档案"抽屉，许知微变为"局势建议"入口，重置移入更多菜单
6. **时间线可视化**：顶部迷你时间线进度条 + 可展开的本轮时间线 + 跨轮对比视图
7. **按钮四类分类**：推荐行动 / 观察行动 / 对话对象 / 移动行动，高风险行动需确认
8. **视觉语义规范**：固定颜色语义（金=主线/蓝=观察/绿=线索/红=危险/灰=不可用），字号层级拉开（22px 标题 / 16-17px 正文 / 13-14px 辅助 / 15-16px 按钮）
9. **组件化拆分**：将 1290 行 `app.js` 的渲染逻辑拆分为 12 个独立组件，每个组件有明确的 props 和渲染职责

### 非目标

- 不引入前端框架（Vue/React/Svelte），保持 vanilla JS（ARCHITECTURE.md L199 约束）
- 不修改 `engine.js` 的核心裁判逻辑（Engine 唯一裁判铁律）
- 不修改 `server.js` 的 API 路由签名（保持向后兼容）
- 不做 LLM Bridge 接入（属独立 work item）
- 不做复杂可视化时间轴（SVG/Canvas 绘制），用列表式展示 + 颜色标签
- 不做玩家手动拖拽排序/编辑时间线
- 不做多结局复杂推理树 UI
- 不做立绘呼吸/眨眼等氛围动画（P2 后续增强）
- 不做背景音乐系统改造（音效系统已独立）
- 不改变存档系统（localStorage 版本化双 key 架构）

---

## 初步设计

### 1. 整体布局重构

从当前的三栏堆叠 + 场景卡 + 聊天流，重构为四区 + 行动反馈流 + 底部行动区：

```text
┌────────────────────────┐
│ 顶部状态栏               │  StatusBar + TimelineMiniBar
│ 第1轮 · 14:00      AP 10 │
│ 14:00 ━●━━━━━━ 14:15    │  迷你时间线（可点击展开）
├────────────────────────┤
│ 当前目标                  │  ObjectiveCard
│ 证明二号车厢异常           │
│ □ 找到可疑证据             │  结构化进展（✓/□）
│ □ 说服赵乘警检查地板       │
├────────────────────────┤
│ 二号车厢                  │  SceneStateCard
│ 小宁抱着布娃娃坐在靠窗位置。│  场景状态（非小说正文）
│ 赵乘警正在过道巡逻。        │
│ 状态：小宁紧张 / 地板未检查 │  可利用的状态摘要
├────────────────────────┤
│ 14:00 许知微提醒你         │  EventFeed（行动反馈流）
│ "先证明异常，不要急着解决。"│
│                           │
│ 14:01 你观察了当前场景      │  ActionResultCard
│ 消耗：1 AP / 1 分钟        │  ← 结构化行动结果
│ + 小宁在保护座位下方        │  ← 新增线索
│ [检查小宁座位下方] [追问小宁]│  ← 解锁行动
├────────────────────────┤
│ 推荐行动                  │  ActionDock
│ [观察当前场景] [询问小宁]   │  默认 2-3 个推荐
│ [更多行动]                 │  → 展开抽屉
├────────────────────────┤
│ [对话] [行动]              │  CommandInput
│ 你要做什么？          发送 │
└────────────────────────┘
```

**核心变化**：
- 顶部从三栏（状态栏 + 目标栏 + 命令栏）压缩为一栏（状态栏 + 迷你时间线）
- 命令栏 5 按钮收进"档案"抽屉 + "许知微"入口
- 行动按钮从场景卡移到底部行动区
- 新增"行动反馈流"作为独立区域，替代当前聊天流作为主反馈通道

### 2. ActionResultCard 数据结构

统一所有行动结果的渲染数据结构，映射引擎已有字段：

```typescript
// 映射 engine.js 的 ObservationResult / DialogueOutcome / LoopFailureOutcome
type ActionResultCard = {
  actionId: string           // 行动唯一标识
  actionType: 'observe' | 'dialogue' | 'move' | 'high_risk' | 'system'
  title: string              // "观察了二号车厢" / "询问了小宁"
  time: string               // "14:01" — 来自 state.clock
  cost: {
    ap: number               // 来自 ObservationResult.ap_remaining 差值
    minutes: number          // 来自 ObservationResult.clock_advanced 差值
  }
  narrative: string          // 场景描述文本
  cluesAdded?: Array<{       // 来自 dialogue_outcome.clues_gained / 观察发现
    id: string
    title: string
    source_type: 'physical' | 'claim' | 'observation' | 'inference'
  }>
  npcStateChanges?: Array<{  // 来自 engine npc_states 变化
    npcId: string
    npcName: string
    trust?: number           // 变化量
    fear?: number
    suspicion?: number
  }>
  objectiveChanges?: Array<{ // 来自 GoalEngineResult.newlyCompleted
    goalId: string
    title: string
    completed: boolean
  }>
  unlockedActions?: Array<{  // 来自 dialogue_outcome.unlocked_actions / suggestion
    label: string
    template: string
    actionType: 'observe' | 'dialogue' | 'move' | 'high_risk'
  }>
  conflictDetected?: boolean // 来自 ObservationResult.conflict_detected
  timelineEvents?: Array<{   // 来自 ObservationResult.discovered[].entry
    time: string
    actor: string
    action: string
    source_type: string
    contradicts: string[]    // 矛盾条目 ID
  }>
}
```

**渲染规则**：
- 普通行动（观察/移动/普通询问）→ 结果进入 EventFeed，不弹窗
- 对话聚焦 → 进入 DialogueFocusSheet 模式，结束后生成摘要卡进入 EventFeed
- 高风险行动 → 弹出确认面板，确认后执行，结果进入 EventFeed
- 只有查看档案/对话聚焦/高风险确认三种情况弹出面板

### 3. 组件拆分

从当前 1290 行 `app.js` 的单体渲染函数 `render()`，拆分为 12 个独立组件：

```text
GameShell (根容器，管理布局和全局状态)
  ├─ StatusBar              ← 顶部状态栏（轮次/时间/AP + 音效按钮）
  │   └─ TimelineMiniBar    ← 迷你时间线进度条（可点击展开）
  ├─ ObjectiveCard          ← 当前目标卡（结构化进展 ✓/□）
  ├─ SceneStateCard         ← 场景状态卡（位置/描述/NPC 状态摘要）
  ├─ EventFeed              ← 行动反馈流（替代当前聊天流）
  │   ├─ DialogueEventCard  ← 对话摘要卡
  │   ├─ ActionResultCard   ← 行动结果卡（核心组件）
  │   ├─ ClueUnlockedCard   ← 线索解锁卡
  │   └─ TimelineChangeCard ← 时间线变化卡（矛盾/推理/验证）
  ├─ ActionDock             ← 底部行动区
  │   ├─ RecommendedActions ← 推荐行动（2-3 个）
  │   └─ MoreActionsSheet   ← 更多行动抽屉（分类展示）
  ├─ FocusWatchBar          ← 持续观察状态栏（盯住/守点）
  ├─ DialogueFocusSheet     ← 对话聚焦模式（替代当前对话面板）
  ├─ ArchiveSheet           ← 档案抽屉（线索/人物/时间线/记忆）
  └─ CommandInput           ← 底部输入区（对话/行动双模式）
```

**组件契约**：每个组件接收 `state` 和/或特定 props，返回/更新 DOM 片段。组件间不直接耦合，通过 `GameShell` 的状态分发通信。

**与当前代码的映射**：

| 新组件 | 当前代码来源 | 改造要点 |
|---|---|---|
| StatusBar | `app.js` L100-101 (topLeft/right) | 加入迷你时间线 |
| ObjectiveCard | `app.js` L243-272 (renderGoalBar) | 从文字升级为结构化进展 |
| SceneStateCard | `app.js` L104-133 (scene card + chips) | 移除行动 chips，加入 NPC 状态摘要 |
| EventFeed | `app.js` L682-747 (handleResponse) | 从追加消息改为插入结构化卡片 |
| ActionResultCard | 新增 | 核心组件，渲染 ActionResultCard 类型 |
| ActionDock | 新增（替代场景卡内的 chips） | 底部固定，默认 2-3 推荐行动 |
| FocusWatchBar | 新增 | 持续观察状态 |
| DialogueFocusSheet | `app.js` L136-144 (dialogue panel) | 升级为聚焦模式 |
| ArchiveSheet | `app.js` L355-494 (show* 系列) | 统一抽屉入口 |
| CommandInput | `app.js` L174-179 (bottom bar) | 保持双模式 |

### 4. 按钮交互方案

#### 四类分类

| 类型 | 颜色 | 默认展示 | 示例 |
|---|---|---|---|
| 推荐行动 | 金色 | 底部默认 2-3 个 | 观察当前场景、询问小宁、前往连接处 |
| 观察行动 | 蓝色 | 更多行动抽屉 | 盯住小宁、守连接处观察、观察三号车厢 |
| 对话对象 | 绿色 | 更多行动抽屉 | 询问小宁、询问许知微、提醒赵乘警 |
| 移动行动 | 灰蓝 | 更多行动抽屉 | 前往连接处、返回二号车厢 |
| 高风险行动 | 红色边框 | 更多行动抽屉 + 确认弹窗 | 强行检查地板、抢走小宁布娃娃 |

#### 推荐机制

推荐行动从 `state._suggestions`（引擎返回的 `Suggestion[]`）中选取，按以下优先级：
1. 引擎标记为解锁的推理行动（`unlocked_actions`）
2. 当前场景可观察的事件（`__OBSERVE_*`）
3. 当前位置的 NPC 对话
4. 移动到可达场景

#### 高风险确认

高风险行动弹出轻量确认面板（非全屏 modal）：

```text
高风险行动

你要直接提醒赵乘警检查地板。
如果证据不足，他可能认为你精神异常，并降低信任。

当前可用证据：2 条
缺少关键证据：地板异常

[取消] [继续]
```

### 5. 持续观察状态（FocusWatchBar）

将"盯住 NPC / 守点观察"从一次性按钮升级为持续状态：

```text
┌────────────────────────┐
│ 👁 正在盯住：小宁          │  FocusWatchBar
│ 持续观察中 · 下次异常可能被捕捉│
│ [停止盯住]                │
└────────────────────────┘
```

**行为**：
1. 点击"盯住小宁" → `FocusWatchBar` 出现在场景卡下方
2. 底部推荐行动变为：等待 1 分钟 / 靠近小宁 / 停止盯住
3. 时间推进时（玩家执行其他行动或等待），系统自动调用 `observeEnvironment(type='npc')` 生成观察片段
4. 观察片段作为 `TimelineChangeCard` 进入 EventFeed
5. 发现异常时自动生成线索卡 + 时间线索目

**数据映射**：
- 前端维护 `focusWatch: { type: 'npc' | 'location', target: string } | null`
- 每次引擎返回新 state 时，检查 `player_timeline.entries` 是否有新的 `source_type: 'observation'` 条目
- 新条目自动渲染为 `TimelineChangeCard`

**与引擎的关系**：不修改 `engine.js`，仅在前端层维护持续状态。每次时间推进时，前端自动触发 `POST /api/action/observe` 调用。

### 6. 档案系统抽屉化

将当前 5 个命令栏按钮收进统一抽屉：

```text
顶部入口
[档案] [许知微]

点击"档案" → ArchiveSheet 抽屉
├─ [线索] ← 已获得线索列表（按 source_type 分组）
├─ [人物] ← NPC 状态卡（trust/fear/suspicion）
├─ [时间线] ← 本轮时间线 + 跨轮对比
└─ [记忆] ← 跨轮继承的记忆条目
```

**许知微入口**：不是普通帮助页，而是当前局势建议：

```text
许知微建议

现在不要急着找炸弹。
你还没有证明二号车厢异常。

建议顺序：
1. 观察小宁
2. 检查她座位下方
3. 拿证据说服赵乘警
```

**重置**：移到右上角更多菜单（与音效按钮同级），不与核心玩法并列。

### 7. 时间线可视化

#### 迷你时间线（TimelineMiniBar）

顶部状态栏下方，细条进度条：

```text
14:00 ━●━━━━━━ 14:15
       当前
```

随事件发生，进度条上标记事件点。点击展开本轮时间线。

#### 本轮时间线

```text
本轮时间线（第 1 轮）

14:00 醒来，许知微说明循环          [系统]
14:01 观察二号车厢，发现小宁紧张      [观察]
14:03 盯住小宁，发现她遮挡座位下方     [观察]
14:05 询问小宁，她回避地板问题        [对话]
14:06 守连接处，发现灰衣进入三号车厢   [观察]
14:08 三号车厢传来金属声             [观察]
     ⚠ 灰衣自述"一直在连接处"与此矛盾  [矛盾]
```

#### 跨轮对比

```text
时间线对比

第 1 轮                    第 2 轮
14:03 小宁遮挡座位下方      14:03 玩家提前询问，小宁未遮挡
差异：小宁行为被玩家干预
```

**数据映射**：
- 迷你时间线：`state.clock` → 计算进度百分比，`player_timeline.entries` → 标记事件点
- 本轮时间线：`player_timeline.entries` 过滤 `loop_observed === state.loop`
- 跨轮对比：`player_timeline.entries` 按 `loop_observed` 分组，对比同一时间点的不同行为

### 8. 视觉风格规范

#### 颜色语义（固定）

| 颜色 | 语义 | CSS 变量 | 用途 |
|---|---|---|---|
| 金色 `#d6a85a` | 主线目标 / 关键推进 | `--lt-gold` | 目标卡标题、目标完成、关键行动推荐 |
| 蓝色 `#7fb3d5` | 观察 / 信息 | `--lt-blue` | 观察行动、观察结果、时间线观察条目 |
| 绿色 `#6ea982` | 已获得线索 / 安全行动 | `--lt-success` | 线索卡、安全行动按钮、本轮已验证 |
| 红色 `#b54747` | 危险 / 高风险 / 时间逼近 | `--lt-danger` | 高风险行动、矛盾标记、失败结算、AP 低位 |
| 紫色 `#c0a0d8` | 推理结论 | 新增 `--lt-inference` | 推理线索、推理结果卡 |
| 灰色 `#9ca3af` | 不可用 / 已完成 / 辅助 | `--lt-muted` | 已完成目标、不可用按钮、时间戳 |

**关键变化**：金色不再用于 NPC chips、发送按钮、对话 NPC 名等常规 UI，只保留给"主线目标 / 关键推进"。

#### 字号层级

| 层级 | 字号 | 字重 | 用途 |
|---|---|---|---|
| H1 | 22px | 700 | 场景标题 |
| H2 | 18px | 700 | 卡片标题（行动结果卡标题、档案分类标题） |
| 正文 | 16px | 400 | 场景描述、行动结果叙述 |
| 对白 | 16px | 400 | NPC 对话文本 |
| 辅助 | 13px | 400 | 时间戳、状态摘要、线索描述 |
| 按钮 | 15px | 600 | 所有可点击按钮 |
| 微标 | 11px | 400 | 顶部状态栏、标签、进度数字 |

**关键变化**：从当前 5 个字号覆盖 20+ 角色改为 7 个层级明确分工。标题从 20px 提升到 22px，正文保持 16px，按钮从 11-13px 提升到统一 15px。

#### 按钮数量原则

- 默认状态最多显示 3 个推荐行动按钮
- 超过 3 个，全部进入"更多行动"抽屉
- 抽屉内按类型分组（观察/对话/移动/高风险）
- 高风险行动在抽屉内以红色边框标记，点击需二次确认

#### 触摸目标

所有可点击元素最小 44×44px（WCAG 推荐）。修正当前 `.lt-cmd-btn`（32px）、`.lt-end-dialogue-btn`（无 min-height）、`.lt-log-toggle`（无 min-height）的不足。

---

## 落地优先级

### 第一阶段：主界面重排（P0）

最小改动，最大体验提升：

1. 顶部三栏压缩为一栏（状态栏 + 迷你时间线）
2. 命令栏 5 按钮收进"档案"+"许知微"两个入口
3. 目标卡从文字升级为结构化进展（✓/□）
4. 场景卡缩短，移除行动 chips
5. 底部新增 ActionDock（默认 3 个推荐行动 + 更多）
6. 保留当前聊天流作为 EventFeed 的基础

**验证**：界面立刻清爽，玩家拇指可达行动按钮，目标进展可视化。

### 第二阶段：统一行动结果卡（P1）

体验提升最大的部分：

1. 实现 `ActionResultCard` 组件
2. 所有行动（观察/对话/移动）后生成结构化卡片
3. 卡片包含：时间/AP 消耗 + 叙述 + 新线索 + 状态变化 + 解锁行动
4. 线索解锁单独渲染 `ClueUnlockedCard`
5. 矛盾检测渲染 `TimelineChangeCard`

**验证**：玩家每次行动后能快速判读"做了什么 → 消耗了什么 → 发现了什么 → 下一步"。

### 第三阶段：持续观察状态（P2）

LT 区别于普通文字冒险的关键：

1. 实现 `FocusWatchBar` 组件
2. "盯住 NPC / 守点观察"进入持续状态
3. 时间推进时自动生成观察片段
4. 观察片段作为 `TimelineChangeCard` 进入 EventFeed

**验证**：玩家理解"盯住不是点一下获得文本，而是占用注意力换取时间线证据"。

### 第四阶段：档案抽屉化 + 时间线可视化（P3）

1. 实现 `ArchiveSheet` 统一抽屉
2. 线索/人物/时间线/记忆按分类展示
3. 迷你时间线可点击展开本轮时间线
4. 跨轮时间线对比视图
5. 许知微变为局势建议入口

**验证**：主界面聚焦核心玩法，档案作为深度信息入口，时间线成为 LT 特色。

---

## 风险

| 风险 | 程度 | 缓解 |
|---|---|---|
| vanilla JS 实现复杂组件（抽屉/持续状态/时间线）工作量大 | HIGH | 四阶段渐进式改造，每阶段可独立验证；组件拆分后可逐个实现 |
| 全量重渲染模式（`render()` 每次重建所有 DOM）影响性能 | MEDIUM | 新组件采用增量更新（只更新变化的 DOM 片段）；保留全量重渲染作为 fallback |
| ActionResultCard 结构化改造需 Engine 配合输出 | MEDIUM | Engine 已有结构化字段（ObservationResult/DialogueOutcome），前端层做字段映射即可，不修改 Engine |
| 时间线可视化在手机竖屏上的展示空间有限 | MEDIUM | 迷你时间线只占顶部一行；展开后用列表式展示 + 按 NPC 分组，不做可视化时间轴 |
| 持续观察状态需前端自动触发 observe API | MEDIUM | 每次时间推进只触发一次 API 调用，不增加 Engine 负担；前端维护 focusWatch 状态 |
| z-index 层级重构可能引入新的覆盖问题 | LOW | 新布局减少 absolute 定位，改为 flex 流式布局；仅在抽屉/弹窗/overlay 使用 absolute |
| 命令栏从第 4 轮隐藏的现有行为需替代方案 | LOW | 档案抽屉常驻可用，不依赖轮次隐藏 |
| 与 v0.10.0 时间线推理系统的 UI 集成 | LOW | 时间线 UI 设计已考虑推理系统数据结构（source_type/contradicts/supports） |

---

## 版本级别

**minor** — UI 系统模块级重设计（主界面布局重构 + 行动结果卡 + 持续观察状态 + 档案抽屉化 + 时间线可视化）

版本号：`v0.11.0`

依据 ADR-0001 版本编号方案：新功能、新系统模块属 minor 级别。本次重设计不破坏现有内容（故事/角色/线索不变），不破坏 Engine 逻辑，属 UI 层的系统级重构。

---

## 讨论记录

- 2026-06-24：基于 `UX-UI.md`（856 行）提案 + `docs/project/UI.md`（762 行）既有分析 + 对当前前端代码的全面审计（index.html/app.js/style.css/engine.js/server.js + TypeScript runtime 24 模块），生成本构想文档。审计覆盖 DOM 结构（131 行）、渲染逻辑（1290 行 app.js）、视觉系统（651 行 CSS）、引擎数据契约（19 条 API + TimelineEntry 20+ 字段 + ClueDetail 4 类 + 3 种观察行动 + 循环继承机制），诊断 8 个核心问题，提出 4 阶段渐进式改造方案。等待用户评审。
