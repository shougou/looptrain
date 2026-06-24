# 50-release-note.md — v0.11.0 发布说明

**Work Item**: LT-20260624-mobile-portrait-ui-redesign
**版本号**: v0.11.0-mobile-portrait-ui-redesign
**版本级别**: minor
**发布日期**: 2026-06-24

---

## 发布概要

v0.11.0 将 LoopTrain 的手机竖版 UI 从"功能堆叠的聊天界面"重构为"现场状态面板 + 行动反馈流 + 时间线调试器"。

## Added

- **四区布局**：顶部状态栏（含迷你时间线）→ 目标卡 → 场景状态卡 → 行动反馈流 → 底部行动区
- **StatusBar 组件**：轮次/时间/AP 增量更新，AP ≤ 3 红色高亮
- **TimelineMiniBar 组件**：14:00→14:15 进度条 + 事件标记
- **ObjectiveCard 组件**：结构化目标进展（✓/□ 步骤）
- **SceneStateCard 组件**：位置 + 描述 + NPC 状态摘要
- **EventFeed 组件**：替代聊天流，接收结构化卡片
- **ActionResultCard 组件**：统一行动结果卡（时间/AP/叙述/线索/状态变化/解锁行动/矛盾标记）
- **ActionDock 组件**：底部推荐行动（2-3 个）+ 更多行动抽屉
- **MoreActionsSheet 组件**：按类型分组（观察/对话/移动/高风险）
- **FocusWatchBar 组件**：持续观察状态栏（盯住 NPC / 守点观察）
- **ArchiveSheet 组件**：档案抽屉（线索/人物/时间线/记忆 4 Tab）
- **DialogueFocusSheet 组件**：全屏对话聚焦模式 + 对话摘要卡
- **高风险确认面板**：高风险行动需二次确认
- **GameShell + 组件化架构**：12 个独立组件，增量更新替代全量重渲染
- **ui-components.spec.js**：前端组件渲染测试

## Changed

- `index.html`：从 131 行 absolute 堆叠重写为 141 行 flex 流式布局
- `app.js`：从 1290 行单体 render() 重写为 622 行组件化架构
- `style.css`：从 651 行重写为 277 行新视觉系统（语义颜色 + 字号层级）
- VERSION：v0.10.0 → v0.11.0

## Removed

- 旧 `.lt-topbar` / `.lt-goal-bar` / `.lt-command-bar` 三栏堆叠
- 旧 `.lt-dialogue-panel` 同屏对话模式
- 旧 `.lt-log-drawer` 对话记录抽屉
- 旧 `.lt-latest-msg` 最新消息预览
- 旧 `.lt-content` absolute 定位 + padding-bottom:120px

## 不变

- engine.js — Engine 逻辑完全不变
- server.js — API 路由完全不变
- portrait-intro.js — 立绘动画不变
- audio-manager.js — 音效系统不变
- 存档系统 — state 结构无变化（_ui 不持久化）
- 所有引擎测试 — smoke_test.js + 6 个 engine tests 不变

## 收尾 Checklist

- [x] 40-review.md 结论"通过"
- [x] node --check 所有 JS 文件通过
- [x] 引擎冒烟测试通过
- [x] VERSION 更新
- [ ] scripts/check_work_item.sh 通过
- [ ] 稳态文档更新（PROJECT_STATUS / ARCHITECTURE / UI.md）
- [ ] devlog 网站数据同步
- [ ] scripts/check_release_wrapup.sh 通过
- [ ] 移动到 released/
