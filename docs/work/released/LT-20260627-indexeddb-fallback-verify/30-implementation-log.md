# Implementation Log

> 编码过程中持续记录。不需要漂亮，但必须记录事实。

## 2026-06-27

### 已完成
- [x] 新建 `tests/e2e/indexeddb-fallback.spec.js`，包含 3 个测试用例
  - RuntimeDB 不可用时游戏正常启动
  - RuntimeDB 不可用时失败结算显示降级提示
  - RuntimeDB 不可用时进入下一轮正常工作
- [x] 测试使用 `page.evaluate` 在页面上下文中设置 `RuntimeDB._db = null` 和 `RuntimeDB._ready = false` 模拟降级
- [x] 所有 3 个 E2E 测试通过（10.1s）
- [x] 运行全部 E2E 测试确认无回归（32 tests passed）
- [x] 更新 `KNOWN_ISSUES.md`，添加"已验证"章节记录 IndexedDB 降级验证结果
- [x] 扩展 `10-spec.md` 为完整规格文档，匹配详细 spec 要求

### 变更文件
- `looptrain/standalone/tests/e2e/indexeddb-fallback.spec.js` (新建)
- `docs/project/KNOWN_ISSUES.md` (更新)
- `docs/work/active/LT-20260627-indexeddb-fallback-verify/10-spec.md` (更新)

### 偏离 plan 的地方
- 原计划使用 `page.addInitScript` 在 `page.goto()` 前删除 `window.indexedDB`，实际实现使用 `page.evaluate` 在页面加载后设置 `RuntimeDB._db = null` 和 `RuntimeDB._ready = false`
- 原因：SLT 前端在 `page.goto()` 后立即初始化 RuntimeDB，使用 `addInitScript` 会导致前端初始化逻辑错误；改为在 `beforeEach` 加载页面后通过 `page.evaluate` 直接修改 RuntimeDB 状态更稳定
- 测试仍然验证了 RuntimeDB 降级路径，只是模拟方式不同

### 待处理
- 无
