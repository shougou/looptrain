# Work Item Idea: E2E 测试更新

**日期**: 2026-06-27
**背景**: v0.12.0 Replay Echo 引入了大量 UI 变更（ReplayAnchorPicker、RuntimeRecorder 面板、版本号显示更新），现有 Playwright E2E 测试选择器可能已失效。

**问题**:
1. 现有 E2E 测试描述仍标注 v0.11.0，需要更新为 v0.12.0
2. 新增 UI 组件（ReplayAnchorPicker）无 E2E 覆盖
3. 缺少时间线回放的完整 E2E 流程验证
4. 可能因 DOM 选择器失效导致现有测试失败

**目标**:
- 验证并修复所有现有 E2E 测试选择器适配 v0.12.0 UI
- 新建 `replay-flow.spec.js` 覆盖时间线回放完整流程
- 更新测试描述和版本标注为 v0.12.0
- 确保所有 E2E 测试在本地 SLT 通过

**范围**:
- 修改现有 4 个 spec 文件（full-player-journey, ui-components, newbie-flow, save-restore）
- 新建 1 个 spec 文件（replay-flow）
- 不修改游戏功能代码（仅测试代码）
