# Project Status

## 当前版本

v0.12.0-replay-echo · Replay Echo — 时间线回放与 NPC 记忆残响系统（Playtest）
- 四层版本号：app 0.12.0 / playtest / Replay Echo / story c01-trial-0.3
- Save Schema Version: 2（breaking change 自动重置旧 v1 存档）

## 当前状态

- Runtime: standalone Node.js，pm2 管理，端口 3030
- 前端: vanilla HTML/CSS/JS，组件化 flex 布局，手机竖屏
- LLM: DeepSeek 已上线（线上启用），Mock 为降级 fallback，LLM Echo Guard 拦截禁词
- 音效: Web Audio API，场景环境音 + 按钮音效 + 时间压力 + 失败冲击
- 存档: localStorage 版本化双 key 架构（SaveMeta + runtime），breaking change 自动检测与重置
- RuntimeDB: IndexedDB 前端封装（5 store：meta/events/snapshots/replayAnchors/runs），降级策略已实现
- 部署: https://looptrain.me/play/game（nginx 反向代理）

## 当前重点

- 时间线回放系统：失败后从上一轮时间线选择锚点接入（resumeFromReplayAnchor + calculatePrepositionAP）
- NPC 记忆残响系统：3 NPC 阈值规则（trust/fear/suspicion），跨轮情感残留影响开场白和 LLM 表演
- LLM Echo Guard：prompt 注入残响段落 + 禁词检测（6 禁词 + 3 组 forbidden_reveals）
- Runtime 事件记录：行动边界自动记录 RuntimeEvent + Snapshot + ReplayAnchor
- 四层版本号体系：app / channel / release name / story version
- 版本号治理: VERSION 文件作为唯一源，sync_version.sh 自动同步 13 个位置

## 最近完成

- v0.12.0 时间线回放：resumeFromReplayAnchor + 锚点选择 UI + IndexedDB 存储 + 降级策略
- v0.12.0 NPC 记忆残响：buildNpcMemoryEchoes + applyNpcMemoryEchoes + resolveNpcOpening + 3 NPC profile
- v0.12.0 LLM Echo Guard：prompt 残响段落 + guardLlmEchoReply + server 管线接入
- v0.12.0 portrait-intro.js 崩溃修复：getBoundingClientRect 防御性检查 + try-catch-finally
- v0.11.0 LLM 正式上线：DeepSeek 动态对话已启用，Mock 降级为 fallback 模式
- v0.11.0 渐进式 UI 解锁系统：UIStage 7 阶段状态机、许知微主界面化提示卡、案件板 CaseBoard、加载状态管理、按钮点击反馈
- v0.11.0 手机竖版 UX/UI 重设计：组件化架构（12 组件 + GameShell）、flex 流式布局、EventFeed + ActionResultCard、ActionDock + MoreActionsSheet、FocusWatchBar 持续观察、ArchiveSheet 档案抽屉、DialogueFocusSheet 对话聚焦、高风险确认面板
- v0.10.0 NPC 时间线推理系统：player_timeline + 3 种观察行动 + 矛盾检测 + 推理生成 + 多维证据评分
- v0.9.0 Playwright E2E 12 步回归测试
- v0.8.2 版本号单一源 + 检查脚本全覆盖
- v0.8.1 存档版本检测 + breaking change 强制重置系统

## 当前风险

- Playwright E2E 测试需更新 DOM 选择器（旧测试选择器不再匹配 v0.12.0 UI）
- LLM 动态对话为新增，需实际游玩验证对话质量和 Engine 边界稳定性
- 手机端真机测试覆盖不足（仅在 DevTools 模拟）
- RuntimeDB IndexedDB 降级策略需 Chrome 隐私模式真机验证
- 存档系统 localStorage -> IndexedDB 完整迁移尚未完成（runtime-db.js 为并行层，非替代层）
- 时间线回放系统为 v0.12.0 新增，需多轮游玩验证锚点选择 + 接入点 + 状态正确性
