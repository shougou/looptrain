---
title: "部署拓扑"
date: "2026-06-15T17:09:00+08:00"
status: "planned"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "deployment"
spoilerLevel: "none"
tags:
  - 部署
  - nginx
  - 技术文档
summary: "LoopTrain Devlog 与 SLT 运行时部署拓扑的正式占位文档。后续补充静态站 release、current symlink、nginx 路由和回滚方式。"
sourceDraft: "TBD/0001-document-migration-inventory.md"
---

## 当前状态

本文档是部署拓扑的正式占位，先纳入文档治理检查。

## 当前必须知道的部署入口

Devlog 发布必须使用受保护脚本：

```bash
bash scripts/deploy_devlog.sh
```

## 后续补充范围

- `looptrain.me` 静态站部署路径。
- `/play/game` 到 SLT runtime 的 nginx 反代。
- `/api/` 到 SLT backend 的 nginx 反代。
- release 目录和 `current` symlink 切换。
- 回滚流程。
