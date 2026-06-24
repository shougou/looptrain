# Project Status

## 当前版本

v0.11.0-mobile-portrait-ui-redesign — 手机竖版 UX/UI 重设计（组件化架构 + EventFeed + ActionDock + FocusWatchBar + ArchiveSheet）

## 当前状态

- Runtime: standalone Node.js，pm2 管理，端口 3030
- 前端: vanilla HTML/CSS/JS，组件化 flex 布局，手机竖屏
- LLM: Mock 模式（预设模板对话），DeepSeek Bridge 已预留接口
- 音效: Web Audio API，场景环境音 + 按钮音效 + 时间压力 + 失败冲击
- 存档: localStorage 版本化双 key 架构（SaveMeta + runtime），breaking change 自动检测与重置
- 部署: https://looptrain.me/play/game（nginx 反向代理）

## 当前重点

- 手机竖版 UI 重设计已上线（12 组件 + GameShell + flex 布局 + EventFeed + ActionDock + FocusWatchBar + ArchiveSheet + DialogueFocusSheet）
- NPC 时间线推理系统已上线（player_timeline + 3 种观察行动 + 矛盾检测 + 推理生成 + 多维证据评分）
- Goal Engine + 指令系统 + 许知微助手已上线
- 《寒灯初醒》完整试玩内容已上线
- 暂用 Mock 模式，待接入真实 LLM
- 测试: Playwright E2E 12 步回归测试 + ui-components.spec.js 组件测试（Mock 模式）
- 版本号治理: VERSION 文件作为唯一源，sync_version.sh 自动同步 11 个位置

## 最近完成

- v0.11.0 手机竖版 UX/UI 重设计：组件化架构（12 组件 + GameShell）、flex 流式布局、EventFeed + ActionResultCard、ActionDock + MoreActionsSheet、FocusWatchBar 持续观察、ArchiveSheet 档案抽屉、DialogueFocusSheet 对话聚焦、高风险确认面板
- v0.10.0 NPC 时间线推理系统：player_timeline + 3 种观察行动 + 矛盾检测 + 推理生成 + 多维证据评分
- v0.9.0 Playwright E2E 12 步回归测试
- v0.8.2 版本号单一源 + 检查脚本全覆盖
- v0.8.1 存档版本检测 + breaking change 强制重置系统

## 当前风险

- 组件化架构为 v0.11.0 新增，需要实际游玩验证各组件交互
- Playwright E2E 测试需更新 DOM 选择器（旧测试选择器不再匹配）
- Mock 模式对话文本单一，真实 LLM 接入后需重测全部对话路径
- 手机端真机测试覆盖不足
- 存档系统仍为 localStorage 实现，后续需迁移到 IndexedDB
