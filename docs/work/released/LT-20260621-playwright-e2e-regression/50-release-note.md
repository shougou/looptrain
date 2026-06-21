# 50-release-note.md

**版本级别**: [x] minor  
**版本号**: v0.9.0-playwright-e2e  
**日期**: 2026-06-21

## 摘要

建立 Playwright E2E 回归测试 — 12 步玩家路径 + 存档恢复/重置，Mock 模式，集成到 verify_slt.sh + AGENT.md 规则 21。

## 新增

- `playwright.config.js` — 390×844 zh-CN
- `tests/e2e/full-player-journey.spec.js` — 12 步
- `tests/e2e/save-restore.spec.js` — 2 项
- AGENT.md 规则 21

## 测试结果

12 passed (33.1s)

## 发布检查

- [x] E2E 全部通过
- [x] Mock 模式
- [x] npm test 不受影响

## 收尾检查

- [ ] 稳态文档更新
- [ ] devlog 同步 + 文章
- [ ] 部署
