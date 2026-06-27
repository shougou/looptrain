# Work Item Idea: IndexedDB 降级验证

**日期**: 2026-06-27
**背景**: v0.12.0 引入 RuntimeDB（IndexedDB 前端封装），Chrome 隐私模式下 IndexedDB 可能不可用。已实现降级策略但未验证。

**降级策略分析**:
- `RuntimeDB.init()` 检查 `window.indexedDB` — 不可用时返回 null，`_ready = false`
- 所有读写操作检查 `_db` — 为 null 时静默跳过
- 失败结算页面显示"历史记录不可用，将从 14:00 开始"
- 游戏功能完全正常，仅回放锚点选择不可用

**验证方案**:
- 用 Playwright E2E 模拟 IndexedDB 不可用场景（`page.addInitScript` 覆盖 `window.indexedDB`）
- 验证游戏启动、行动、失败、进入下一轮全链路正常
- 验证降级提示文本正确显示

**目标**:
- 确认降级路径不影响核心游戏功能
- 确认降级提示文本正确显示
- 将验证结果记录到 KNOWN_ISSUES.md（从"待验证"移到"已验证"）

**范围**:
- 新建 1 个 E2E 测试文件 `indexeddb-fallback.spec.js`
- 不修改功能代码
- 更新 KNOWN_ISSUES.md 标记降级策略已验证
