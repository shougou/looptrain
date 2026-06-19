# Changelog

## v0.8-testplay — 2026-06-19

### Added
- 《寒灯初醒》完整试玩内容：新故事、5 角色、3 场景、8 线索、8 目标、3 轮结算
- 电影式开场字幕 + 试玩版结局
- 灰衣乘客角色（替代沈墨寒）
- 内容完全外置化（materials/runtime/ JSON 文件）

### Changed
- 时间线: 08:45→09:00 改为 14:00→14:15
- 赵乘警角色保留（方案中的陆成未采用）
- 场景驱动 UI：对话面板扩展到全内容区
- 全局内容一致性审计修复

### Fixed
- 立绘入场动画孤儿遮罩层（try/finally 保证清理）
- 许知微欢迎语不再干扰活跃对话（state.mode 守卫）
- 对话框限制在底部 35vh 的问题
- NPC ID 不一致（hyphen→underscore）

### Removed
- 沈墨寒（shen_mohan）— 替换为灰衣乘客
- 小宁妈妈（xiaoning_mother_hidden）— v0.8 移除

## v0.7-goal-command-xu — 2026-06-19

### Added
- Goal Engine 模块：声明式 DSL 条件判定器
- 12 条指令系统：CommandRegistry + CommandMatcher
- 许知微主动引导：立绘入场动画 + 三轮渐进引导
- 指令栏 + 目标栏 + 目标完成正反馈卡片
- 立绘入场动画系统（PortraitIntro）

### Changed
- 指令结果从隐藏日志抽屉改为可见内容区域
- 许知微欢迎语触发时机从 init() 移到游戏开始后

## v0.6.1-runtime — 2026-06-19

### Added
- 分层 TypeScript Runtime 架构（MemoryRuntime + Deterministic Assistant）
- 61 文件 20 模块，事件溯源记忆系统
- CompanionView 安全投影（防止 LLM 剧透）

## v0.5.0-standalone — 2026-06-13

### Added
- LoopTrain 从 SillyTavern 完全剥离，建立独立运行时 SLT
- UX/UI 全面审计修复（无障碍、视觉打磨、Bug 修复）
- 版本号统一为 v0.5.0-standalone
