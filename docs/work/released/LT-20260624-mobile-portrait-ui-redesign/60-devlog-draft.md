# 60-devlog-draft.md — v0.11.0 开发日志草稿

**日期**: 2026-06-24
**版本**: v0.11.0-mobile-portrait-ui-redesign

---

## 概要

v0.11.0 是 LoopTrain 前端架构的一次系统性重构。将手机竖版 UI 从"功能堆叠的聊天界面"升级为"现场状态面板 + 行动反馈流 + 时间线调试器"。

## 核心改造

### 从单体到组件

v0.10.0 的 `app.js` 是一个 1290 行的单体文件，`render()` 函数在每次行动后重建所有 DOM。v0.11.0 将其拆分为 12 个独立组件 + GameShell 编排器，每个组件有独立的 `update(state)` 方法，采用 dirty check 增量更新。

组件清单：StatusBar / TimelineMiniBar / ObjectiveCard / SceneStateCard / EventFeed / ActionResultCard / ActionDock / MoreActionsSheet / FocusWatchBar / DialogueFocusSheet / ArchiveSheet / CommandInput。

### 从 absolute 堆叠到 flex 流式

v0.10.0 使用 12 层 z-index 堆叠 7 个 absolute 定位的区域，`padding-bottom: 120px` 防止遮挡。v0.11.0 改为 flex column 流式布局，仅 overlay 类元素使用 absolute。

### EventFeed + ActionResultCard

最大的体验提升：所有行动结果不再追加为普通聊天消息，而是生成结构化 ActionResultCard（时间/AP/叙述/线索/状态变化/解锁行动/矛盾标记），让玩家快速判读"做了什么 → 消耗了什么 → 发现了什么 → 下一步"。

### ActionDock + 拇指可达

行动按钮从场景卡内部（屏幕中上部）移到底部行动区，默认只显示 2-3 个推荐行动，其余进入"更多行动"抽屉。按类型分组（观察/对话/移动/高风险）。

### FocusWatchBar — 持续观察

"盯住 NPC"从一次性按钮升级为持续状态。FocusWatchBar 显示在场景卡下方，时间推进时自动检测新的观察条目并生成 TimelineChangeCard。

### ArchiveSheet — 档案抽屉化

5 个命令栏按钮（线索/人物/记忆/帮助/重置）收进统一"档案"抽屉 + "许知微"入口。档案有 4 个 Tab：线索（按 source_type 分组）/ 人物（数值条）/ 时间线（5 种标签）/ 记忆。

## 不变的部分

- engine.js / server.js 完全不变
- API 路由和响应结构不变
- 存档兼容（_ui 不持久化）
- 所有引擎测试不变

## 数据

- 代码行数：app.js 1290→622 行，style.css 651→277 行
- 新增组件文件：636 行（5 个文件）
- 组件数量：12 个独立组件 + GameShell
