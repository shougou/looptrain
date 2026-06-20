# Devlog: 存档系统升级——版本检测与 Breaking Change 处理

> 基于 review 和 release note 生成。不是内部记录的复制版。

## 这次改了什么

LoopTrain 的存档系统从无版本的 `localStorage` 单 key 写入升级到了完整的版本化管理。核心变化：

- **存档元数据**：每个存档现在都有 `SaveMeta`，记录 `saveSchemaVersion`、`runtimeVersion`、`storyVersion` 等 6 个字段。
- **Key 体系重构**：旧 `looptrain.standalone.v1` 被替换为 `lt:save:meta` + `lt:save:runtime` 双 key，旧的 `looptrain.audio.muted` 迁移到 `lt:settings`。
- **启动时版本检测**：游戏初始化时自动扫描浏览器 `localStorage`，判断是新玩家、旧玩家还是兼容存档，走不同路径。
- **强制重置弹窗**：检测到不兼容存档时弹出模态框，告知玩家需要重新开始。
- **三种手动重置路径**：UI 按钮、URL 参数 `?reset=1`、控制台 `window.LT_RESET()`。
- **IndexedDB 清理**：启动时异步删除旧版数据库（`LoopTrainDB` 等），新版使用 `LoopTrainMemoryDB_v0_8`。

## 为什么要改

v0.8 试玩版「寒灯初醒」对剧情、人物、Runtime、记忆结构、目标系统进行了全面重构。旧存档（来自 v0.6–v0.7）的语义与新系统完全不兼容——旧目标 ID 不存在于新剧情、旧 NPC 被移除或改名、场景和线索在新版无对应逻辑。直接读取旧存档会导致状态错乱而不是简单报错。

这不是字段改名，而是底层语义改变。迁移成本高、风险大、收益低，所以选择了 breaking change 策略：不做兼容迁移，直接强制新开局。

## 设计取舍

几个关键决策：

1. **不写 migration，直接归档 + 重置**。旧数据移到 `lt:legacy:<timestamp>` 保留，开发侧可调试，但新版完全不读取。
2. **不清空整个 `localStorage`**。清除逻辑只删除 `lt:` 前缀的 key，且排除 `lt:legacy:` 归档数据和 `lt:settings` 用户设置。非 LT 前缀的 key（浏览器扩展、devlog 设置等）完全不受影响。
3. **三种重置路径覆盖不同场景**。普通玩家用 UI 按钮，遇到问题可用 URL 参数强制刷新，开发调试用控制台命令。三条路径最终状态一致（loop=1, clock=14:00, intro_seen=false）。
4. **模态框只给一个按钮**。文案同时区分了"检测到旧版数据"和"版本不匹配"两种情况，但交互上只有「重新开始」一个选择，减少认知负担。
5. **模态框不可点遮罩关闭**。因为这不是"可以忽略"的提示，玩家必须做选择。

## 实现结果

- 14 条验收标准全部通过代码路径覆盖。
- `node --check` 语法检查通过。
- `npm test` 全部 7 个测试块通过，包括新增的存档版本检测测试。
- 改动集中在 5 个文件：`app.js`（主要）、`index.html`（模态框 HTML + 按钮）、`style.css`（模态样式）、`audio-manager.js`（`lt:settings` 迁移）、`smoke_test.js`（新增测试块）。
- 引擎 `engine.js` 无需修改，`reset_game` 命令行为不变。

## 还存在的问题

没有阻塞性问题。几个需要关注的：

- IndexedDB 旧库删除依赖浏览器的 `window.indexedDB` API，在某些隐私模式下可能不可用，此时静默跳过。
- 完整的浏览器手动端到端测试（14 条 AC 在真实浏览器中逐条验证）建议安排在 QA 阶段完成。
- 旧玩家首次看到重置提示的体感反馈需要在试玩版发布后观察。

## 下一步计划

v0.8 试玩版的存档基础设施已经就绪，后续内容工作可以在此基础上推进。`lt:save:memory` 和 `lt:save:goals` 两个 key 已预留，用于后续 MemoryRuntime 和 GoalEngine 的 IndexedDB 迁移。
