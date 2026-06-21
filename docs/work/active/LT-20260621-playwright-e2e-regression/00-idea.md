---
status: accepted
type: engineering-quality
topic: playwright-e2e-regression-tests
created: 2026-06-21T14:00:00+08:00
updated: 2026-06-21T14:00:00+08:00
---

# LT-20260621 — 建立 Playwright 回归测试

## 背景

LoopTrain 试玩版当前依赖手动验证全部玩家路径。随着 v0.8 内容扩展至 5 角色、3 场景、8 线索、8 目标，手动验证成本急剧上升。ROADMAP 中长期标记 Playwright 回归测试为高优先级但未开始。本次项目分析也反复确认这是最高风险项之一。

**核心问题**：没有 E2E 测试 → 每次修改必须手动重走全部路径 → 后续剧情越复杂越容易失控 → 最终不敢改代码。

## 用户决策（2026-06-21）

1. **最低验收路径**（12 步）：进入游戏 → 开场 → 行动 → 小宁对话 → 赵乘警对话 → 观察车厢 → 移动到连接处 → 触发灰衣乘客 → 失败结算 → 下一轮 → 刷新恢复 → 重置清空
2. **遵守项目工程规范**：走完整 8 阶段 Work Item 流程
3. **纳入工程规范**：将 E2E 测试集成到 verify_slt.sh + AGENT.md 规则

## 目标

### 核心目标

为 LoopTrain Standalone 建立可自动运行的 Playwright E2E 回归测试套件。

### 具体目标

1. 安装 Playwright 依赖 + 配置文件
2. 编写核心 12 步完整玩家路径测试
3. 编写存档/恢复/重置专项测试
4. 集成到 `verify_slt.sh` 验证流水线
5. Mock 模式运行（`LLM_ENABLED=false`），无需 API Key，保证确定性
6. 移动端视口（390×844，iPhone 14 竖屏）
7. 将 E2E 测试纳入 AGENT.md 强制规则

### 非目标

- 不测试 LLM 对话质量（Mock 模式确定性测试）
- 不覆盖所有边缘情况（第一版聚焦关键路径）
- 不建立 CI/CD 自动触发（后续阶段）
- 不修改游戏逻辑

## 初步设计

### 测试架构

```
looptrain/standalone/
  tests/
    e2e/
      full-player-journey.spec.js   # 12 步核心路径
      save-restore.spec.js          # 存档专项
    smoke_test.js                   # 现有引擎测试（不变）
  playwright.config.js              # Playwright 配置
```

### 技术选型

- Playwright test runner（官方框架，非 Jest/vitest）
- Chromium 浏览器
- webServer 自动启停 Express（PORT=3030, LLM_ENABLED=false）
- viewport: 390×844, locale: zh-CN, headless

### 规范集成设计

- `scripts/verify_slt.sh`：Materials validation 后添加 `npm run test:e2e`
- `looptrain/AGENT.md`：新增规则 21（E2E 测试必须通过）
- 后续 work item 的 40-review.md 必须包含 `npx playwright test` 结果

## 版本级别

minor — 新增功能/系统模块

版本号：`v0.9-playwright-e2e`
