## v0.11.0-newbie-ui-unlock — 2026-06-25

### Added
- UIStage 渐进解锁系统：7 阶段状态机（intro → first_observation → first_dialogue → loop_memory_intro → caseboard_intro → contradiction_intro → normal_play）
- 每阶段控制 UI 元素可见性（按钮数、输入框、Archive 按钮等）
- 许知微主界面化：从顶部按钮改为场景描述下方提示卡，提供动态提示和推荐行动
- 案件板 (CaseBoard)：已确认事实、NPC 说法、待验证、关键矛盾、下一步建议
- 加载状态管理：按钮点击加载动画、全局遮罩、prefers-reduced-motion 支持
- 按钮点击反馈：缩放效果、涟漪高光、150ms 过渡动画
- 4 个新前端模块：`ui-stage.js`（状态机）、`assistant-hint.js`（提示生成）、`case-board.js`（案件板）、`loading-state.js`（加载状态）
- 2 个单元测试 + 1 个 E2E 测试（newbie-flow.spec.js）
- `/api/ui-stage` 端点：获取当前 UI 阶段配置

### Changed
- `app.js`：集成 UIStage 状态切换（~150 行新增），updateUIVisibility()，renderAssistantHint()
- `actions.js`：ActionDock 支持 setActionCount() 方法
- `style.css`：新增 150+ 行样式（提示卡、案件板、加载、动画、安全区）
- `index.html`：引入 4 个新模块
- `server.js`：新增 `/api/ui-stage` 端点
- `start_slt.sh`：修复超时问题（nohup 后台运行）

### Removed
- 无

---

## v0.10.0-npc-timeline-inference — 2026-06-23

### Added
- NPC 时间线推理系统：player_timeline 数据结构，玩家通过观察构建 NPC 行动时间线
- 3 种观察行动：观察当前场景（1AP/1min）、盯住NPC（1AP/2min）、守点观察（1AP/2min）
- 矛盾检测系统：detectConflicts() 检测 NPC 主张与时间线事实的冲突
- 推理线索自动生成：generateInference() 基于矛盾对生成推理结论
- 多维证据评分：evaluateEvidence() 5 维度（物理异常/时间线矛盾/嫌疑人路线/可执行位置/程序要求）
- canConvinceZhao() 4 条成功路径（物理证据/时间线推理/纯观察/综合推理）
- 失败继承：timeline entries 转 memory 类型，current_loop_verified 机制
- "查看NPC时间线"系统指令（零 AP）：查看灰衣/小宁/全部 NPC 时间线
- 时间线 UI：5 种标签（观察/自述/推理/记忆/矛盾），按 NPC 分组
- POST /api/action/observe API 端点
- 5 个新引擎测试（timeline_observation/conflict_detection/inference_generation/evidence_scoring/loop_inheritance）
- verify_slt.sh 修复：E2E 前自动启动服务器

### Changed
- 线索系统从 8 条推倒重设计为 20 条（4 物理 + 5 主张 + 6 观察 + 5 推理）
- trial-timeline.json 从 9 事件扩展为 17 事件，新增 observable 字段
- NPC 对话 AP 消耗从 3 降至 2
- NPC 对话新增 grants_claim 机制（对话选项可授予主张线索）
- 成功判定从 countValidEvidence >= 2 改为 canConvinceZhao() 多维评分
- engine.js: 628→1261 行，10 个新函数

### Removed
- 旧线索 ID（gray_coat_note_pressure / ticking_under_floor / xiaoning_heard_ticking 等）
- hidden_node_test 中的 mother_doll_memory 机制

# Changelog

## v0.9.0-playwright-e2e — 2026-06-21

### Added
- Playwright E2E 回归测试套件：`tests/e2e/` 目录
- `full-player-journey.spec.js` — 12 步完整玩家路径（开场→对话→行动→失败→下一轮→刷新→重置）
- `save-restore.spec.js` — 存档恢复 + URL 强制重置
- `playwright.config.js` — 390×844 zh-CN 移动端配置
- AGENT.md 规则 21 — E2E 测试必须通过，失败不得合并或部署

### Changed
- `package.json`: +@playwright/test + test:e2e script
- `scripts/verify_slt.sh`: 新增 Playwright E2E 测试步骤
- 版本号: v0.9.0-playwright-e2e

## v0.8.2-version-source — 2026-06-21

### Added
- `VERSION` 文件 — 项目唯一版本源
- `scripts/sync_version.sh` — 从 VERSION 自动同步到 11 个派生位置
- `scripts/check_cross_consistency.py` — 5 项跨文档一致性检查
- AGENT.md 规则 17-20（版本号单一源/收尾检查全覆盖/文档结构同步/changelog 变更验证）

### Changed
- `scripts/check_release_wrapup.sh` §6 — 版本一致性从 4 个位置扩展到 13 个
- `looptrain/AGENT.md` §4 — 目录结构更新为当前实际结构
- 统一 9 个代码文件的版本号为 v0.8.2-version-source

### Fixed
- MANIFEST.json 版本号 0.5 → v0.8.2（落后 4 个大版本）
- site.ts 死代码 `CURRENT_VERSION`/`CURRENT_PHASE` 删除
- devlog 公开展示层 4 处 陆成→赵乘警修正
- 根 README/looptrain/README 等 7 处文档结构过期修复

## v0.8.1-save-versioning — 2026-06-20

### Added
- 存档版本检测系统：启动时检测 `lt:save:meta` 与 `looptrain.standalone.v1` 旧数据，自动判定兼容性
- SaveMeta 结构（6 字段）：`appId`, `saveSchemaVersion`, `runtimeVersion`, `storyVersion`, `createdAt`, `updatedAt`
- `lt:` key 命名体系：`lt:save:meta`, `lt:save:runtime`, `lt:save:memory`, `lt:save:goals`, `lt:settings`
- breaking change 强制重置模态框：区分 legacy 数据检测和 incompatible version 两种文案
- 手动重置三路径：UI「🔄重置」按钮、URL `?reset=1` 参数、开发者 `window.LT_RESET()`
- 旧数据归档：`looptrain.standalone.v1` → `lt:legacy:<timestamp>` 开发侧保留
- IndexedDB 旧库清理：异步删除 `LoopTrainDB`, `LoopTrainRuntimeDB`, `LoopTrainMemoryDB`
- 版本升级分级策略（Patch/Minor/Major）

### Changed
- 存档从单 key `looptrain.standalone.v1` 迁移到双 key `lt:save:meta` + `lt:save:runtime`
- `init()` 流程重构为 4 路径分流：新玩家、旧数据归档、版本不兼容、兼容恢复
- `AudioManager` 静音设置迁移到 `lt:settings`，跨版本保留
- `resetGame()` 升级为新存档系统

### Fixed
- 刷新页面丢失进度：localStorage 持久化 + 版本检测确保正确恢复
- 旧存档污染新版 Runtime：强制 breaking change 检测隔离

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
