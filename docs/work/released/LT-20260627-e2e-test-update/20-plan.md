# E2E 测试更新 Plan

## 文件变更

| 文件 | 操作 |
|------|------|
| `tests/e2e/full-player-journey.spec.js` | 修改 |
| `tests/e2e/ui-components.spec.js` | 修改 |
| `tests/e2e/save-restore.spec.js` | 修改 |
| `tests/e2e/replay-flow.spec.js` | 新建 |

## 步骤 1: 验证现有测试状态
- 运行 `npm run test:e2e` 检查当前失败情况
- 记录失败的选择器和错误信息

## 步骤 2: 修复现有测试选择器
- 更新 4 个 spec 文件的版本描述（v0.11.0 → v0.12.0）
- 修复失效的选择器
- 更新 Mock 模式下的对话处理（文本可能变化）

## 步骤 3: 新建 replay-flow.spec.js
- 测试失败后显示 ReplayAnchorPicker
- 测试选择锚点进入下一轮
- 验证循环数增加
- 验证锚点选择器存在性

## 步骤 4: 验证所有测试通过
- 运行 `npm run test:e2e` 确认全部通过
- 运行 `verify_slt.sh` 确认完整验证通过
