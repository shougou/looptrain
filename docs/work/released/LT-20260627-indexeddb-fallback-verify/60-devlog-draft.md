# Devlog Draft: IndexedDB 降级验证

**Work Item**: LT-20260627-indexeddb-fallback-verify
**Version**: v0.12.0
**Release**: Replay Echo
**Date**: 2026-06-27
**Type**: 验证/测试补充

---

## 导语

v0.12.0 引入 RuntimeDB 基于 IndexedDB 保存事件流、状态快照与 Replay Anchor，为时间线回放和接入点选择提供数据支持。但 IndexedDB 在浏览器隐私模式下可能不可用，降级策略的正确性直接影响核心游戏流程的稳定性。

本次 Work Item 验证 RuntimeDB 在 `window.indexedDB` 缺失时的降级路径，确保：
- 游戏核心流程不受阻断
- 失败结算正确显示降级提示
- 进入下一轮后从 14:00 正常开始

---

## 验证方法：Playwright E2E 模拟降级

**核心挑战**：如何在自动化测试中模拟 IndexedDB 缺失场景？

**方案选择**：
- 原计划：使用 `page.addInitScript` 在 `page.goto()` 前删除 `window.indexedDB`
- 实际采用：使用 `page.evaluate` 在页面加载后设置 `RuntimeDB._db = null` 和 `RuntimeDB._ready = false`

**原因**：SLT 前端在 `page.goto()` 后立即初始化 RuntimeDB，使用 `addInitScript` 会导致前端初始化逻辑错误。改为直接修改 RuntimeDB 状态更稳定，且同样验证了降级路径。

---

## 测试场景

### 场景 1：游戏正常启动

验证 RuntimeDB 不可用时，游戏页面正常加载，玩家可以进入游戏主界面，看到场景卡片和轮次/时钟状态。

### 场景 2：失败结算显示降级提示

验证 RuntimeDB 不可用时，触发失败结算后：
- 失败结算页正常显示
- 显示"历史记录不可用"降级提示
- 不展示 Replay Anchor 接入点选择

### 场景 3：进入下一轮正常工作

验证 RuntimeDB 不可用时，点击"进入下一轮"后：
- 新轮次从 14:00 开始
- 游戏状态正确重置
- 可以继续执行基础行动

---

## 验证结果

| 检查项 | 结果 |
|--------|------|
| 3 个新增 E2E 测试 | 全部通过（10.1s） |
| 全部 32 个 E2E 测试 | 无回归 |
| 功能代码修改 | 无 |
| pageerror | 零 |

---

## 已知限制

本次验证仅覆盖 `window.indexedDB` 缺失场景，以下场景未覆盖：

- `indexedDB.open` onerror 场景
- `indexedDB.open` blocked 场景
- quota / SecurityError / UnknownError 场景
- Safari 私密浏览模式
- 真实 Chrome 隐私模式

以上场景建议后续 Work Item 覆盖。

---

## 文档更新

- `KNOWN_ISSUES.md` 已更新，添加"已验证"章节记录 IndexedDB 降级验证结果
- 验证日期、方式、结果、边界清晰记录
- 原"待验证"问题已移除

---

## 发布记录

- Release Note: [50-release-note.md](50-release-note.md)
- Review Report: [40-review.md](40-review.md)
- Implementation Log: [30-implementation-log.md](30-implementation-log.md)
