---
title: "LoopTrain v0.9.0 — Playwright E2E 回归测试上线"
date: "2026-06-21T22:00:00+08:00"
version: "v0.9.0-playwright-e2e"
status: "done"
tags:
  - 测试
  - E2E
  - Playwright
  - 工程规范
summary: "LoopTrain 首次建立 E2E 回归测试：12 步完整玩家路径 + 存档恢复/重置，Mock 模式 33.1s 全绿，集成到 verify_slt.sh 和 AGENT.md 规则 21。"
---

## 背景

没有 E2E 测试一直是项目最大的风险项。v0.8 试玩版有 5 角色、3 场景、8 线索、8 目标，每次修改都需要手动重走全部路径。上周的项目分析也把"无自动化回归测试"列为最高优先级。

## 实现

12 步完整玩家路径 Playwright 测试：

| # | 步骤 | 耗时 |
|---|------|------|
| 1-2 | 进入游戏 → 开场 | 0.8s |
| 3 | 第一轮可行动 | 0.6s |
| 4 | 与小宁对话 | 3.8s |
| 5 | 与赵乘警对话 | 5.6s |
| 6 | 观察车厢 | 2.3s |
| 7 | 移动到连接处 | 2.8s |
| 8 | 触发灰衣乘客 | 5.9s |
| 9-10 | 失败结算 → 下一轮 | 2.1s |
| 11 | 刷新后可恢复 | 2.8s |
| 12 | 重置后可清空 | 1.2s |
| +2 | 存档恢复 / URL reset | 3.7s |

**12/12 passed, 33.1s。** Mock 模式，无需 LLM Key。

390×844 移动端视口，zh-CN locale。`#end-dialogue-btn` 被 `.lt-bottom` 遮挡通过 `page.evaluate()` 解决。

## 规范集成

- `verify_slt.sh` 新增 E2E 步骤
- AGENT.md **规则 21**: E2E 必须通过
- 所有 work item review 必须含 E2E 结果

## 价值

12 步自动验证 → 一键确认全部路径正常，手动验证节省 95%+ 时间。
