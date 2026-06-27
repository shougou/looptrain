# E2E 测试更新 Spec

## 验收标准

1. 所有现有 4 个 E2E spec 文件在本地 SLT 通过（`npm run test:e2e`）
2. 新建 `replay-flow.spec.js` 覆盖时间线回放流程：
   - 失败后显示 ReplayAnchorPicker
   - 选择锚点后进入下一轮
   - 验证状态继承（AP 预置、时间线继承）
3. 所有测试描述更新为 v0.12.0
4. 选择器适配 v0.12.0 UI（不修改功能代码）

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `tests/e2e/full-player-journey.spec.js` | 修改 | 更新版本描述，验证选择器 |
| `tests/e2e/ui-components.spec.js` | 修改 | 更新版本描述，验证选择器 |
| `tests/e2e/newbie-flow.spec.js` | 修改 | 更新版本描述，验证选择器 |
| `tests/e2e/save-restore.spec.js` | 修改 | 更新版本描述，验证选择器 |
| `tests/e2e/replay-flow.spec.js` | 新建 | 时间线回放完整流程 |

## 测试范围

- 不测试 LLM 对话内容（Mock 模式文本不稳定）
- 不测试音频播放（Web Audio API 在 headless 环境不可靠）
- 重点测试 UI 状态流转和选择器存在性
