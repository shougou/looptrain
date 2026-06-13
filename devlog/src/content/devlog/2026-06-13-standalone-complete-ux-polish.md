---
title: "v0.5.0-standalone：独立运行时完成 + UX/UI 全面审计修复"
date: "2026-06-13T17:00:00+08:00"
version: "v0.5.0-standalone"
status: "done"
tags:
  - 架构调整
  - 前端重构
  - 版本进展
summary: "LoopTrain 从 SillyTavern 完全剥离，建立独立运行时 SLT。完成上线前全量审计并修复所有发现的问题。UX/UI 从专业前端设计角度全面打磨。"
---

LoopTrain 进入 v0.5.0-standalone 时代。今天完成了两件大事：**ST 剥离的收尾工作**和**前端体验的全面打磨**。

## ST 剥离收尾

从上一轮 `lt-standalone-mvp` 分支起，`looptrain/standalone/` 已经能无 ST 依赖运行。但还有一些残留：

- `todos/architecture/` 空目录 — 已删除
- 多个文档仍引用 `st-extension/`、`st-server-plugin/` 等已删除路径 — 全部修正
- `app.js` 中存在 6 个与 `engine.js` 重复的函数 — 已消除，改为从 API 获取数据
- 敏感配置已从公开文件中清除，API Key 仅保存在后端环境变量中
- 版本号混乱（v0.4.3 vs v0.5）— 已统一到 `v0.5.0-standalone`

## UX/UI 全面审计修复

启动本地服务，用 Playwright 浏览器进行跨分辨率（375px / 430px / 1440px）的视觉检查，结合 CSS 静态分析和运行时数据，发现并修复以下问题：

**无障碍**
- 文本域缺少 `aria-label` → 已添加，屏幕阅读器可正确朗读
- `outline: none` 后无可见焦点指示器 → 改为金色 `box-shadow` 发光环
- 触控目标最小高度 29px → 全部增至 ≥ 44px（WCAG 2.2 推荐）

**视觉打磨**
- 缺少 `color-scheme: dark` → 已添加，消除白色背景闪烁
- 持续动画不尊重 `prefers-reduced-motion` → 已添加媒体查询抑制
- `backdrop-filter: blur()` 在低端设备上性能差 → 已添加 `@supports not` 降级

**Bug 修复**  
- 对话中途关闭浏览器后重开，`.lt-content` 被隐藏导致 UI 锁死 → `loadState()` 增加安全检查，自动清除残留的 dialogue 状态

## 开发日志更新

- 新增 `changelog/v0.5.0-standalone.md`，详细记录所有变更
- `play.astro` / `about.astro` / `site.ts` / `site-status.json` 同步版本号
- Devlog 网站 specifications 中的 `currentVersion` 已更新

## 当前状态

本地 runtime 已经完全独立，不依赖 SillyTavern。

```bash
bash scripts/start_slt.sh  # 启动 → http://127.0.0.1:3030
bash scripts/verify_slt.sh # 验证 → 语法 + 引擎测试 + HTTP 检查
```

下一步待完成：音效系统、内容外置化、线上 `/play/game` 切换。
