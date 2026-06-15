---
title: "LLM Bridge 设计"
date: "2026-06-15T17:06:00+08:00"
status: "planned"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "llm-bridge"
spoilerLevel: "none"
tags:
  - LLM
  - Prompt
  - 设计文档
summary: "LoopTrain LLM Bridge 的设计文档占位。后续补充 Prompt Builder、Provider、Mock fallback 和 Engine 裁判边界。"
sourceDraft: "TBD/0001-document-migration-inventory.md"
---

## 当前状态

本文档是 LLM Bridge 设计说明的正式占位，先纳入文档治理检查。

## 后续补充范围

- LLM 只生成 NPC 表演文本。
- Engine 是唯一裁判。
- API Key 不进入前端。
- Mock 模式必须保留。
- LLM 输出必须经过清洗，不能直接改变 AP、线索、NPC 状态、成功失败或循环继承。

## 事实来源

正式补全时以以下文件为准：

```text
looptrain/standalone/llm/prompt.js
looptrain/standalone/llm/providers.js
looptrain/standalone/server.js
looptrain/standalone/engine.js
```
