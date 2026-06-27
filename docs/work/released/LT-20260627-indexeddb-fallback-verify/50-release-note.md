# Release Note: IndexedDB 降级验证

**版本**: v0.12.0-replay-echo  
**Work Item**: LT-20260627-indexeddb-fallback-verify  
**发布日期**: 2026-06-27  
**发布类型**: 验证/测试补充  
**版本级别**: [x] patch

---

## 新增内容

### E2E 测试

- 新增 `looptrain/standalone/tests/e2e/indexeddb-fallback.spec.js`，包含 3 个测试场景：
  - **RuntimeDB 不可用时游戏正常启动**：验证页面正常加载、游戏可进入
  - **RuntimeDB 不可用时失败结算显示降级提示**：验证失败结算页显示"历史记录不可用"降级提示，不展示 Replay Anchor 接入点
  - **RuntimeDB 不可用时进入下一轮正常工作**：验证点击"进入下一轮"后新轮次从 14:00 开始

### 验证方法

- 使用 Playwright `page.evaluate` 在页面上下文中设置 `RuntimeDB._db = null` 和 `RuntimeDB._ready = false` 模拟 IndexedDB 降级状态
- 测试过程中监听 `pageerror`，确保无未捕获错误

---

## 变更文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `looptrain/standalone/tests/e2e/indexeddb-fallback.spec.js` | 新建 | 3 个降级场景 E2E 测试 |
| `docs/project/KNOWN_ISSUES.md` | 更新 | 添加已验证章节，记录 IndexedDB 降级验证结果 |
| `docs/work/active/LT-20260627-indexeddb-fallback-verify/10-spec.md` | 更新 | 扩展为完整规格文档 |

---

## 验证结果

- ✅ 3 个新增 E2E 测试全部通过（10.1s）
- ✅ 全部 32 个 E2E 测试通过，无回归
- ✅ 未修改功能代码，仅新增测试
- ✅ `KNOWN_ISSUES.md` 已更新验证记录

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

## 升级说明

无需升级。本次发布仅新增测试和文档，不涉及功能代码变更。

---

## 发布检查

- [x] `npm run check` 语法检查通过（无功能代码变更）
- [x] `npx playwright test` 全部 E2E 测试通过（32 tests passed, 3 new）
- [x] 未修改功能代码，仅新增测试和文档
- [x] 现有路径无回归（32 tests passed）
- [x] 新增 3 个 E2E 测试全部通过（10.1s）
- [x] 测试过程中无 pageerror
- [x] `KNOWN_ISSUES.md` 已更新验证结果
- [x] `10-spec.md` 已扩展为完整规格文档
- [x] 所有 work item 文件齐全（00~60）

---

## 收尾检查

- [x] 更新稳态文档: KNOWN_ISSUES.md（添加已验证章节）
- [x] 创建 devlog 草稿: 60-devlog-draft.md
- [x] 实施日志: 30-implementation-log.md
- [x] 审查报告: 40-review.md（结论：通过）

---

## 兼容性

- 与 v0.12.0 完全兼容
- 不影响现有功能
- 不修改存档格式
