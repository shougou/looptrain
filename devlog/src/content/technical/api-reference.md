---
title: "SLT API Reference"
date: "2026-06-15T17:05:00+08:00"
status: "planned"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "api-reference"
spoilerLevel: "none"
tags:
  - API
  - SLT
  - 技术文档
summary: "LoopTrain Standalone Runtime 的 API 文档占位。后续补充 Express 路由、请求字段、响应字段和验证方式。"
sourceDraft: "TBD/0001-document-migration-inventory.md"
---

## 当前状态

本文档是 API Reference 的正式占位，先纳入文档治理检查。

## 后续补充范围

- `/api/health`
- `/api/session/init`
- `/api/action/commit`
- `/api/dialogue/start`
- `/api/dialogue/message`
- `/api/dialogue/end`
- `/api/loop/fail`
- `/api/loop/next`
- `/api/suggestions`
- `/api/npcs`
- `/api/scenes`
- `/api/config`
- `/api/llm/npc-reply`

## 验证方式

正式补全时应以 `looptrain/standalone/server.js` 和 `looptrain/standalone/README.md` 为事实来源，并运行：

```bash
bash scripts/verify_slt.sh
```
