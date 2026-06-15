---
title: "测试与验证指南"
date: "2026-06-15T17:07:00+08:00"
status: "planned"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "testing"
spoilerLevel: "none"
tags:
  - 测试
  - 验证
  - 技术文档
summary: "LoopTrain 当前测试和验证流程的正式占位文档。后续补充 engine smoke test、HTTP checks、devlog build/check 和浏览器验证路径。"
sourceDraft: "TBD/0001-document-migration-inventory.md"
---

## 当前状态

本文档是测试与验证指南的正式占位，先纳入文档治理检查。

## 当前必须知道的命令

SLT 本地验证：

```bash
bash scripts/verify_slt.sh
```

Devlog 文档治理与构建验证：

```bash
python3 scripts/check_docs_governance.py
cd devlog
npm run build
npx astro check
```

## 后续补充范围

- Engine smoke tests 覆盖范围。
- HTTP checks 覆盖范围。
- Devlog 内容 schema 检查。
- 浏览器/Playwright 回归测试计划。
