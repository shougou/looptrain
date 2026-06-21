# 10-spec.md — 设计规格

**Work Item**: LT-20260621-playwright-e2e-regression  
**版本级别**: minor  
**版本号**: v0.9-playwright-e2e

---

## 1. 目标（追溯 00-idea.md）

建立 Playwright E2E 回归测试，覆盖 12 步完整玩家路径 + 存档专项，Mock 模式运行，集成到 verify_slt.sh，纳入 AGENT.md 强制规则。

## 2. 非目标

不测试 LLM 对话质量（Mock 确定性），不覆盖所有边缘情况，不建立 CI/CD，不修改游戏逻辑。

## 3. Playwright 配置

```js
testDir: './tests/e2e'
webServer: { command: 'PORT=3030 node server.js', port: 3030 }
viewport: { width: 390, height: 844 }
locale: 'zh-CN', headless: true, timeout: 30000
```

## 4. 测试文件

### full-player-journey.spec.js — 12 步

| # | 操作 | 选择器 | 验证 |
|---|------|--------|------|
| 1 | 进入游戏 | page.goto('/') | `.lt-intro.lt-show` |
| 2 | 完成开场 | click '#intro-start-btn' | `.lt-scene-card` 可见 |
| 3 | 第一轮行动 | — | `.lt-goal-bar` / `.lt-command-bar` 可见 |
| 4 | 小宁对话 | NPC chip → .lt-input → #btn-send | `.lt-dialogue-panel` 可见 |
| 5 | 赵乘警对话 | #end-dialogue-btn → 赵乘警 chip | 对话流转正常 |
| 6 | 观察车厢 | [data-mode="action"] → 输入"观察车厢" | 行动结果返回 |
| 7 | 移动到连接处 | 输入"走向连接处" | location 变成 connector_2_3 |
| 8 | 灰衣乘客 | 点击灰衣乘客 → 对话 → 结束 | 线索获得 |
| 9 | 失败结算 | 输入"强制失败测试" | `.lt-ng` 可见 |
| 10 | 下一轮 | .lt-ng-card 内按钮 | loop 递增 |
| 11 | 刷新恢复 | page.reload() | 非开场状态 |
| 12 | 重置清空 | #btn-manual-reset → #lt-reset-confirm | 开场画面 |

### save-restore.spec.js — 3 项

- 进行中刷新恢复
- 手动重置回开场
- URL ?reset=1 强制重置

## 5. 规范集成

- `package.json`: `"@playwright/test": "^1.45"` + `"test:e2e": "npx playwright test"`
- `verify_slt.sh`: Materials 后加 `npx playwright test`
- `AGENT.md`: 规则 21（E2E 必过）

## 验收标准

| AC | 描述 |
|----|------|
| AC-1 | Playwright 依赖安装 + chromium 安装成功 |
| AC-2 | 12 步核心路径全部通过 |
| AC-3 | 存档专项全部通过 |
| AC-4 | verify_slt.sh 包含 E2E 步骤 |
| AC-5 | Mock 模式 LLM_ENABLED=false |
| AC-6 | AGENT.md 规则 21 |
| AC-7 | npm test 不受影响 |
| AC-8 | 无 API Key 依赖 |
