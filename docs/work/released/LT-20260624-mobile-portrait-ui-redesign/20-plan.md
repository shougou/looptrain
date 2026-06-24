# Plan: 手机竖版 UX/UI 重设计

> 基于 `10-spec.md` 生成。回答：具体怎么改？改哪些文件？分几步？怎么验证？

---

## 1. 实施范围

v0.11.0 手机竖版 UX/UI 重设计。核心改动：
- 主界面从三栏 absolute 堆叠重构为 flex 流式四区布局
- `app.js` 从 1290 行单体 `render()` 拆分为 12 个独立组件 + GameShell
- `style.css` 从 651 行重写为新视觉系统（语义颜色 + 字号层级 + flex 布局）
- 新增 EventFeed（结构化行动结果卡）替代聊天流
- 新增 ActionDock（底部推荐行动 + 更多行动抽屉）
- 新增 FocusWatchBar（持续观察状态）
- 新增 ArchiveSheet（档案抽屉化）
- 新增 DialogueFocusSheet（对话聚焦模式）
- 不修改 engine.js / server.js / 数据文件

四阶段交付：P0 主界面重排 → P1 行动结果卡 → P2 持续观察 → P3 档案+时间线

## 2. 文件变更清单

| File | Action | Purpose |
|------|--------|---------|
| `looptrain/standalone/public/index.html` | REWRITE | 新 DOM 结构（四区布局 + overlay 容器） |
| `looptrain/standalone/public/app.js` | REWRITE | 组件化渲染逻辑（GameShell + 12 组件） |
| `looptrain/standalone/public/style.css` | REWRITE | 新视觉系统（flex 布局 + 语义颜色 + 字号层级） |
| `looptrain/standalone/public/components/game-shell.js` | CREATE | GameShell 根容器 + 组件注册 + 状态分发 |
| `looptrain/standalone/public/components/status-bar.js` | CREATE | StatusBar 组件（轮次/时间/AP + 音效） |
| `looptrain/standalone/public/components/timeline-mini-bar.js` | CREATE | TimelineMiniBar 组件（迷你时间线进度条） |
| `looptrain/standalone/public/components/objective-card.js` | CREATE | ObjectiveCard 组件（目标 + 结构化进展） |
| `looptrain/standalone/public/components/scene-state-card.js` | CREATE | SceneStateCard 组件（位置/描述/NPC状态摘要） |
| `looptrain/standalone/public/components/event-feed.js` | CREATE | EventFeed 组件（行动反馈流容器） |
| `looptrain/standalone/public/components/action-result-card.js` | CREATE | ActionResultCard 组件（核心：结构化行动结果卡） |
| `looptrain/standalone/public/components/action-dock.js` | CREATE | ActionDock 组件（推荐行动 + 更多行动入口） |
| `looptrain/standalone/public/components/more-actions-sheet.js` | CREATE | MoreActionsSheet 组件（更多行动抽屉） |
| `looptrain/standalone/public/components/focus-watch-bar.js` | CREATE | FocusWatchBar 组件（持续观察状态栏） |
| `looptrain/standalone/public/components/dialogue-focus-sheet.js` | CREATE | DialogueFocusSheet 组件（对话聚焦模式） |
| `looptrain/standalone/public/components/archive-sheet.js` | CREATE | ArchiveSheet 组件（档案抽屉：线索/人物/时间线/记忆） |
| `looptrain/standalone/public/components/command-input.js` | CREATE | CommandInput 组件（底部输入区） |
| `looptrain/standalone/public/components/overlays.js` | CREATE | overlay 组件集合（Toast/ClueBadge/GoalFeedback/NG/Intro/Reset） |
| `looptrain/standalone/public/components/utils.js` | CREATE | 工具函数（parseTime/formatCost/classifyAction 等） |
| `looptrain/standalone/public/portrait-intro.js` | KEEP | 立绘动画不变 |
| `looptrain/standalone/public/audio-manager.js` | KEEP | 音效系统不变 |
| `looptrain/standalone/engine.js` | NO CHANGE | Engine 逻辑不变 |
| `looptrain/standalone/server.js` | NO CHANGE | API 路由不变 |
| `looptrain/standalone/tests/smoke_test.js` | NO CHANGE | 引擎测试不变 |
| `looptrain/tests/*.js` | NO CHANGE | 引擎测试不变 |
| `looptrain/standalone/tests/e2e/full-player-journey.spec.js` | MODIFY | DOM 选择器更新 |
| `looptrain/standalone/tests/e2e/save-restore.spec.js` | MODIFY | DOM 选择器更新 |
| `looptrain/standalone/tests/e2e/ui-components.spec.js` | CREATE | 前端组件渲染测试 |
| `docs/project/PROJECT_STATUS.md` | MODIFY | 更新版本号至 v0.11.0 |
| `docs/project/ARCHITECTURE.md` | MODIFY | 新增前端组件架构段落 |
| `docs/project/UI.md` | MODIFY | 更新为 v0.11.0 布局描述 |
| `VERSION` | MODIFY | v0.10.0 → v0.11.0 |

## 3. 数据结构变更

### 3.1 前端状态扩展（不持久化）

```js
state._ui = {
  focusWatch: null,              // { type: 'npc'|'location', target: string } | null
  archiveTab: 'clues',          // 当前档案 Tab
  moreActionsOpen: false,       // 更多行动抽屉是否打开
  dialogueFocusActive: false,   // 对话聚焦模式是否激活
  shownEntryIds: new Set(),     // 已展示过的时间线索目 ID（FocusWatchBar 去重）
  prevAp: null,                 // 上一帧 AP（计算 cost 差值）
  prevClock: null,              // 上一帧 clock（计算 cost 差值）
  prevSuggestions: [],          // 上一帧 suggestions（检测新增解锁行动）
}
```

### 3.2 ActionResultCard 类型（前端专用）

```js
{
  id: string,                    // 前端生成（Date.now() + random）
  actionType: 'observe'|'dialogue'|'move'|'high_risk'|'system',
  title: string,
  time: string,                  // HH:MM
  cost: { ap: number, minutes: number },
  narrative: string,
  cluesAdded?: Array<{ id, title, source_type }>,
  npcStateChanges?: Array<{ npcId, npcName, trust?, fear?, suspicion? }>,
  objectiveChanges?: Array<{ goalId, title, completed }>,
  unlockedActions?: Array<{ label, template, actionType }>,
  conflictDetected?: boolean,
  timelineEvents?: Array<{ entryId, time, actor, action, source_type, contradicts[] }>,
}
```

### 3.3 高风险行动注册表（前端硬编码）

```js
const HIGH_RISK_ACTIONS = [
  { pattern: /提醒赵乘警|报告赵乘警|说服赵乘警/, label: '提醒赵乘警', requiresEvidence: true },
  { pattern: /强行检查|检查地板/, label: '强行检查地板', requiresEvidence: false },
  { pattern: /抢走|拿走.*布娃娃/, label: '抢走小宁布娃娃', requiresEvidence: false },
  { pattern: /喊|大声|公开.*炸弹/, label: '公开喊有炸弹', requiresEvidence: false },
]
```

### 3.4 ObjectiveCard 步骤映射（前端硬编码）

```js
const OBJECTIVE_STEPS = [
  {
    match: /证明.*异常/,
    steps: [
      { label: '找到可疑证据', check: (s) => s.known_clues.length >= 2 },
      { label: '说服赵乘警检查地板', check: (s) => s.flags.trial_success === true },
    ]
  },
  {
    match: /证据已足够/,
    steps: [
      { label: '找到证据', check: () => true },  // 已完成
      { label: '形成证据链', check: (s) => s.known_clues.length >= 3 },
      { label: '说服赵乘警', check: (s) => s.flags.trial_success === true },
    ]
  },
  {
    match: /已完成/,
    steps: [],  // 全部完成
  }
]
```

## 4. Runtime 改造步骤

> 本迭代不修改 engine.js 和 server.js。此节描述前端 runtime 改造。

### Step 1: 工具函数 + 组件基类

1. CREATE `components/utils.js`
   - `parseTime(hhmm)` → 分钟数
   - `formatCost(ap, minutes)` → "消耗：N AP / N 分钟"
   - `classifyAction(template, suggestions)` → actionType 分类
   - `diffNpcStates(prevState, newState)` → NPC 状态变化量
   - `diffSuggestions(prevSugg, newSugg)` → 新增的 suggestion
   - `buildActionResultCard(res, prevState, actionType, title)` → ActionResultCard 对象
2. CREATE `components/game-shell.js`
   - `GameShell` 类：维护组件列表、state、`updateAll()` 方法
   - 组件注册：`register(component)`
   - 状态更新：`setState(newState)` → `saveState()` → `updateAll()`
   - 全局事件代理：click 委托（替代当前 `#lt-root` 上的单一 handler）
3. 验证：`node --check components/utils.js` + `node --check components/game-shell.js`

### Step 2: HTML 骨架重写

4. REWRITE `index.html`
   - 移除：`.lt-topbar` / `.lt-goal-bar` / `.lt-command-bar` / `.lt-content` 旧结构
   - 新增：`.lt-phone` flex column 容器
   - 新增区域挂载点：status-bar / objective / scene / focus-watch / event-feed / action-dock / command-input
   - 新增 overlay 容器：archive / dialogue-focus / more-actions / ng / intro / reset / toast / clue-badge / goal-feedback
   - 保留 `<script>` 标签引用（新增 components/ 下文件按依赖顺序加载）
5. 验证：浏览器打开，确认空白页面无报错

## 5. UI 改造步骤

### Phase P0: 主界面重排

#### Step 3: StatusBar + TimelineMiniBar

6. CREATE `components/status-bar.js`
   - `StatusBar` 类 extends Component
   - `update(state)`: 增量更新轮次/时间/AP（dirty check）
   - AP ≤ 3 时添加 `.lt-ap-low` 红色高亮
   - 音效按钮复用现有 `AudioManager` 逻辑
7. CREATE `components/timeline-mini-bar.js`
   - `TimelineMiniBar` 类 extends Component
   - `update(state)`: 计算时间进度百分比，更新进度条宽度
   - 事件标记：从 `state.player_timeline.entries` 过滤本轮条目，按时间位置放置 marker
   - 点击展开：触发 `ArchiveSheet.open('timeline')`
8. `style.css` 新增 StatusBar + TimelineMiniBar 样式
9. 验证：浏览器手动测试 — 状态栏显示正确，时间线进度条随时间变化

#### Step 4: ObjectiveCard

10. CREATE `components/objective-card.js`
    - `ObjectiveCard` 类 extends Component
    - `update(state)`: 从 `state._goalData.goals[0].title` 获取目标文字
    - 步骤映射：用 `OBJECTIVE_STEPS` 匹配目标文字，生成步骤列表
    - 步骤完成状态：调用 `step.check(state)` 判断 ✓/□
11. `style.css` 新增 ObjectiveCard 样式
12. 验证：浏览器手动测试 — 目标卡显示正确，步骤随线索获取更新

#### Step 5: SceneStateCard

13. CREATE `components/scene-state-card.js`
    - `SceneStateCard` 类 extends Component
    - `update(state)`: 位置名 + 场景描述 + NPC 状态摘要
    - NPC 状态映射：trust/fear/suspicion → 文字描述
    - **移除**：NPC chips / 移动 chips / 观察 chips（移到 ActionDock）
14. `style.css` 新增 SceneStateCard 样式
15. 验证：浏览器手动测试 — 场景卡显示位置+描述+状态，无行动按钮

#### Step 6: ActionDock + MoreActionsSheet

16. CREATE `components/action-dock.js`
    - `update(state)`: 从 `state._suggestions` 选取推荐行动
    - `selectRecommended()`: 按优先级排序（推理解锁 > 观察 > 对话 > 移动），取前 3
    - 点击推荐行动 → 填充输入框 → `submitInput()`
    - 点击"更多行动" → 打开 MoreActionsSheet
17. CREATE `components/more-actions-sheet.js`
    - 按类型分组渲染（观察/对话/移动/高风险）
    - 高风险行动标记红色边框
    - 高风险确认：弹出确认面板
18. `style.css` 新增 ActionDock + MoreActionsSheet 样式
19. 验证：浏览器手动测试 — 推荐行动显示正确，更多行动抽屉分类正确

#### Step 7: CommandInput + 档案/许知微入口

20. CREATE `components/command-input.js`
    - 对话/行动双模式 tab
    - 输入框 auto-resize
    - 发送按钮 → `submitInput()`
21. 顶部入口按钮：`[档案]` `[许知微]` + 右上角更多菜单（重置）
    - P0 先空壳，P3 实现完整功能
22. `style.css` 新增 CommandInput + 顶部入口样式
23. 验证：浏览器手动测试 — 输入区正常工作

#### Step 8: P0 集成验证

24. REWRITE `app.js` 主逻辑
    - 移除旧 `render()` 函数
    - 新增 `GameShell` 初始化 + 组件注册
    - 保留：`submitInput()` / `handleResponse()` / API 调用逻辑
    - `handleResponse()` 改为：更新 state → `gameShell.setState(newState)`
25. 验证：`bash scripts/verify_slt.sh` 通过
26. 验证：浏览器完整流程测试 — 开场 → 探索 → 对话 → 观察 → 失败 → 下一轮 → 成功

### Phase P1: 统一行动结果卡

#### Step 9: EventFeed + ActionResultCard

27. CREATE `components/event-feed.js`
    - `appendCard(actionResult)`: 创建卡片 DOM 并插入
    - `appendMessage(msg)`: 兼容系统/NPC 文本消息
    - 自动滚动到底部
28. CREATE `components/action-result-card.js`
    - `constructor(actionResult)`: 构建 DOM
    - 字段条件渲染：只显示有值的字段
    - narrative 超过 3 行折叠
    - 解锁行动按钮可点击
    - 6 种卡片变体：observe(蓝) / dialogue(绿) / move(灰蓝) / system(灰) / clue(金) / timeline(紫)
29. 修改 `handleResponse()`
    - 观察响应 → 构建 ActionResultCard → `eventFeed.appendCard()`
    - 对话结算 → 构建 DialogueSummaryCard → `eventFeed.appendCard()`
    - 移动 → 移动卡 → `eventFeed.appendCard()`
    - 线索新增 → ClueUnlockedCard → `eventFeed.appendCard()`
    - 矛盾检测 → TimelineChangeCard → `eventFeed.appendCard()`
    - 系统/NPC 文本 → `eventFeed.appendMessage()`
30. `style.css` 新增 EventFeed + ActionResultCard 样式
31. 验证：浏览器手动测试 — 观察行动后生成结构化卡片，字段正确

### Phase P2: 持续观察状态

#### Step 10: FocusWatchBar

32. CREATE `components/focus-watch-bar.js`
    - `startWatch(type, target)`: 设置 focus，显示 bar
    - `stopWatch()`: 清除 focus，隐藏 bar
    - `update(state)`: 检查 `player_timeline.entries` 中与 focus 匹配的新条目
    - 新条目 → 构建 TimelineChangeCard → `eventFeed.appendCard()`
33. 修改"盯住 NPC"/"守点观察"按钮逻辑
    - 点击后执行 `POST /api/action/observe`（正常消耗 AP）
    - 同时调用 `focusWatchBar.startWatch(type, target)`
    - ActionDock 推荐行动变为：等待 / 靠近目标 / 停止盯住
34. 修改对话模式处理（FocusWatchBar 暂停检查）
35. 修改循环失败处理（FocusWatchBar 清除）
36. `style.css` 新增 FocusWatchBar 样式
37. 验证：浏览器手动测试 — 盯住 NPC 后 bar 出现，时间推进时自动生成观察卡

### Phase P3: 档案抽屉化 + 时间线可视化

#### Step 11: ArchiveSheet

38. CREATE `components/archive-sheet.js`
    - 4 个 Tab：线索（按 source_type 分组）/ 人物（数值条）/ 时间线（5 种标签）/ 记忆（灰色列表）
    - `open(tab)` / `close()`
39. 修改"档案"入口 → `ArchiveSheet.open('clues')`
40. 修改"许知微"入口 → 显示局势建议
41. 修改文本指令兼容（`查看线索` → `ArchiveSheet.open('clues')` 等）
42. `style.css` 新增 ArchiveSheet 样式
43. 验证：浏览器手动测试 — 档案抽屉 4 个 Tab 内容正确

#### Step 12: DialogueFocusSheet

44. CREATE `components/dialogue-focus-sheet.js`
    - 全屏覆盖（保留顶部状态栏）
    - NPC 名 + 立绘 + 状态 + 对话记录 + 建议追问
    - 结束对话 → 生成 DialogueSummaryCard → 插入 EventFeed
45. 修改 `startDialogue()` / `endDialogue()` 逻辑
46. `style.css` 新增 DialogueFocusSheet 样式
47. 验证：浏览器手动测试 — 对话聚焦模式全屏，结束后生成摘要卡

#### Step 13: 时间线可视化增强

48. TimelineMiniBar 点击展开 → `ArchiveSheet.open('timeline')`
49. 跨轮时间线对比视图（按 `loop_observed` 分组，同时间点并排显示）
50. 验证：浏览器手动测试 — 迷你时间线可点击，跨轮对比正确

## 6. 测试计划

### Step 14: 更新现有 E2E 测试

51. 更新 `full-player-journey.spec.js`
    - DOM 选择器全面更新
    - 测试逻辑不变
    - 新增验证：ActionResultCard 出现在 EventFeed 中
52. 更新 `save-restore.spec.js`
    - DOM 选择器更新
    - 验证存档加载后 UI 状态正确恢复

### Step 15: 新增前端组件测试

53. CREATE `ui-components.spec.js`
    - StatusBar / ObjectiveCard / SceneStateCard 渲染测试
    - ActionResultCard 6 种变体测试
    - ActionDock 推荐行动选取测试
    - FocusWatchBar start/stop + 新条目检测测试
    - ArchiveSheet 4 个 Tab 内容测试
    - DialogueFocusSheet open/close + 摘要卡测试

### Step 16: 验证

54. `node --check` 所有新增 JS 文件
55. `bash scripts/verify_slt.sh` 通过
56. `npx playwright test` 全部通过
57. 手机端 390px 视口手动验证布局

## 7. 回滚方案

- 所有改动在 `lt-standalone-mvp` 分支
- 若需回滚：`git checkout <prev-commit> -- looptrain/standalone/public/`
- `engine.js` 和 `server.js` 未修改，无需回滚
- localStorage 存档因 state 结构无变化（`_ui` 不持久化），不触发 breaking change
- 旧版前端文件可从 git 历史恢复

## 8. 分阶段任务

| 阶段 | 步骤 | 内容 | 依赖 | 可独立验证 |
|---|---|---|---|---|
| Phase P0 | Step 1-8 | 工具函数 + HTML 骨架 + StatusBar + ObjectiveCard + SceneStateCard + ActionDock + CommandInput + 集成 | 无 | ✓ 浏览器手动 |
| Phase P1 | Step 9 | EventFeed + ActionResultCard + handleResponse 改造 | P0 | ✓ 浏览器手动 |
| Phase P2 | Step 10 | FocusWatchBar + 持续观察逻辑 | P1 | ✓ 浏览器手动 |
| Phase P3 | Step 11-13 | ArchiveSheet + DialogueFocusSheet + 时间线可视化 | P2 | ✓ 浏览器手动 |
| Phase Test | Step 14-16 | E2E 更新 + 组件测试 + 验证 | P3 | ✓ verify_slt.sh |
| Phase Doc | — | PROJECT_STATUS + ARCHITECTURE + UI.md + VERSION | Test | ✓ check_release_wrapup |

P0 是最小改动但体验提升最大的阶段。每个 Phase 完成后可独立验证，不阻塞下一阶段开发。

## 9. 完成检查清单

### P0 主界面重排
- [ ] index.html 新 DOM 结构（四区 + overlay 容器）
- [ ] StatusBar 显示轮次/时间/AP + 音效按钮
- [ ] TimelineMiniBar 显示进度条 + 事件标记
- [ ] ObjectiveCard 显示目标 + 结构化步骤（✓/□）
- [ ] SceneStateCard 显示位置 + 描述 + NPC 状态（无行动 chips）
- [ ] ActionDock 默认显示 2-3 推荐行动 + 更多行动按钮
- [ ] CommandInput 对话/行动双模式正常
- [ ] 命令栏 5 按钮被档案/许知微替代
- [ ] 重置移入更多菜单
- [ ] `bash scripts/verify_slt.sh` 通过

### P1 行动结果卡
- [ ] EventFeed 替代聊天流
- [ ] 观察行动后生成 ActionResultCard
- [ ] 对话结束后生成 DialogueSummaryCard
- [ ] 移动后生成移动卡
- [ ] 线索新增时生成 ClueUnlockedCard
- [ ] 矛盾检测时生成 TimelineChangeCard
- [ ] 卡片只显示有值字段
- [ ] 解锁行动按钮可点击执行

### P2 持续观察
- [ ] FocusWatchBar 条件显示
- [ ] 盯住 NPC 后 bar 出现
- [ ] 时间推进时自动检测新条目
- [ ] 新条目生成 TimelineChangeCard
- [ ] 停止盯住后 bar 消失
- [ ] 同时只一个 focus
- [ ] focus 不跨轮继承

### P3 档案 + 时间线
- [ ] ArchiveSheet 4 个 Tab 正确
- [ ] 线索按 source_type 分组
- [ ] 人物显示数值条
- [ ] 时间线 5 种标签 + 矛盾标记 + 本轮确认边框
- [ ] 记忆显示跨轮条目
- [ ] 许知微显示局势建议
- [ ] DialogueFocusSheet 全屏对话模式
- [ ] 对话结束后生成摘要卡
- [ ] TimelineMiniBar 可点击展开
- [ ] 跨轮时间线对比视图

### 视觉规范
- [ ] 金色仅用于主线目标/关键推进
- [ ] 蓝/绿/红/紫/灰语义正确
- [ ] 场景标题 22px / 正文 16px / 按钮 15px / 辅助 13px
- [ ] 所有可点击元素 ≥ 44×44px
- [ ] AP ≤ 3 红色高亮

### 布局与性能
- [ ] 主布局 flex 流式（非 absolute 堆叠）
- [ ] 仅 overlay 用 absolute
- [ ] `.lt-content` 唯一滚动区
- [ ] 组件增量更新（不全量 innerHTML 重建）
- [ ] 无 z-index 冲突

### 测试
- [ ] 现有引擎测试全部通过
- [ ] Playwright E2E 更新后通过
- [ ] 新增 ui-components.spec.js 通过
- [ ] `bash scripts/verify_slt.sh` 通过
- [ ] 390px 视口布局正确

### 文档
- [ ] PROJECT_STATUS.md 更新版本号 v0.11.0
- [ ] ARCHITECTURE.md 新增前端组件架构
- [ ] UI.md 更新为 v0.11.0 布局
- [ ] VERSION → v0.11.0
- [ ] `bash scripts/sync_version.sh` 执行
- [ ] `bash scripts/check_release_wrapup.sh` 通过
