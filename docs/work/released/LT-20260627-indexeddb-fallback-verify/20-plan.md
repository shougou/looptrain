# IndexedDB 降级验证 Plan

## 文件变更

| 文件 | 操作 |
|------|------|
| `tests/e2e/indexeddb-fallback.spec.js` | 新建 |

## 步骤

1. 新建 `indexeddb-fallback.spec.js`，使用 `page.addInitScript` 删除 `window.indexedDB`
2. 测试 3 个场景：游戏启动、失败结算降级提示、进入下一轮
3. 运行全部 E2E 测试确认无回归
4. 运行 `verify_slt.sh` 确认完整验证通过
