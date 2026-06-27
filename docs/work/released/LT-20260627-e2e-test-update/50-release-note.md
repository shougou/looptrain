# Release Note: v0.12.0-replay-echo — E2E 测试更新

版本级别: [x] patch
**Work Item**: LT-20260627-e2e-test-update
**发布日期**: 2026-06-27

## 概述

更新 Playwright E2E 测试套件：版本描述更新为 v0.12.0，新建 `replay-flow.spec.js` 覆盖时间线回放流程。

## Changed
- `full-player-journey.spec.js`: 版本描述 v0.11.0 → v0.12.0
- `ui-components.spec.js`: 版本描述 v0.11.0 → v0.12.0
- `save-restore.spec.js`: 版本描述 v0.11.0 → v0.12.0

## Added
- `replay-flow.spec.js`: 3 个测试覆盖 ReplayAnchorPicker 显示、锚点选择、循环进入

## 验证
- `npm run test:e2e`: 28/28 通过
- `verify_slt.sh`: 全部通过

## 发布检查
- [x] `npm run check` 语法检查通过
- [x] `npm run test:e2e` 全部 28 个测试通过
- [x] E2E 测试选择器未影响功能代码

## 收尾检查
- [x] 移动 work item 到 released/
