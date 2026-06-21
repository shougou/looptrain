# 20-plan.md — 实施计划

**Work Item**: LT-20260621-playwright-e2e-regression

## 文件变更清单

| # | 文件 | 操作 |
|---|------|------|
| 1 | `looptrain/standalone/package.json` | UPDATE — +playwright 依赖 + test:e2e |
| 2 | `looptrain/standalone/playwright.config.js` | CREATE |
| 3 | `looptrain/standalone/tests/e2e/full-player-journey.spec.js` | CREATE — 12 步 |
| 4 | `looptrain/standalone/tests/e2e/save-restore.spec.js` | CREATE — 3 项 |
| 5 | `scripts/verify_slt.sh` | UPDATE — +E2E 步骤 |
| 6 | `looptrain/AGENT.md` | UPDATE — +规则 21 |

## 分阶段任务

### Task 1: 环境搭建
- `npm install -D @playwright/test` + `npx playwright install chromium`
- 创建 `playwright.config.js`
- Validate: `npx playwright test --list`

### Task 2: 核心 12 步测试
- 文件: `tests/e2e/full-player-journey.spec.js`
- 按 spec §4.1 逐步实现
- Validate: `npx playwright test full-player-journey --headed`

### Task 3: 存档专项
- 文件: `tests/e2e/save-restore.spec.js`
- Validate: `npx playwright test save-restore`

### Task 4: 规范集成
- verify_slt.sh + AGENT.md
- Validate: `bash scripts/verify_slt.sh`

## 回滚

`npm uninstall @playwright/test` + `git revert`
