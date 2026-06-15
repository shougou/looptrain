---
title: "文档治理设计"
date: "2026-06-15T16:20:00+08:00"
status: "current"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "documentation-governance"
spoilerLevel: "none"
tags:
  - 文档治理
  - 信息架构
  - 设计说明
summary: "LoopTrain 文档治理的正式设计说明：TBD 保留为讨论稿区，devlog 成为正式长期文档中心，根目录只保留入口职责。"
sourceDraft: "TBD/0000-document-governance.md"
pinned: true
---

## 目标

LoopTrain 的文档治理目标是避免项目事实分散在多个目录、多个时间点、多个版本表述中。

治理后的文档生命周期为：

```text
想法 → TBD 讨论稿 → 方案确认 → devlog 正式文档 → 定期校验 → legacy / deprecated
```

## 分层

| 层级 | 位置 | 职责 |
|---|---|---|
| 讨论稿 | `TBD/` | 未定方案、角色草案、机制探索 |
| 正式文档 | `devlog/src/content/` | 可长期阅读和引用的项目知识 |
| 当前入口 | 根 `README.md` / `MANIFEST.json` | 当前主线、启动方式、事实索引 |

## 关键规则

1. `TBD/` 不代表当前事实。
2. 正式长期文档进入 `devlog/src/content/`。
3. 旧 ST / SillyTavern 内容必须标记为历史语境。
4. 公开内容不得暴露核心悬疑谜底。
5. 每次迭代完成前运行文档治理检查器。

## 执行入口

```bash
python3 scripts/check_docs_governance.py
```

正式文档修改后还需要验证：

```bash
cd devlog
npm run build
npx astro check
```
