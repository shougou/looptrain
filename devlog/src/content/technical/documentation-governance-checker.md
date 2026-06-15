---
title: "文档治理检查器"
date: "2026-06-15T16:21:00+08:00"
status: "current"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "documentation-tooling"
spoilerLevel: "none"
tags:
  - 文档治理
  - 工具
  - 验证
summary: "记录 scripts/check_docs_governance.py 的职责、检查范围和使用方式。该脚本是 LoopTrain 文档治理的轻量自动化入口。"
sourceDraft: "TBD/0000-document-governance.md"
pinned: true
---

## 命令

```bash
python3 scripts/check_docs_governance.py
```

## 检查范围

当前检查器覆盖：

- `TBD/` 草稿 frontmatter。
- `devlog/src/content/devlog/` 文章基础字段与 date 精度。
- `devlog/src/content/characters/` 的 `spoilerLevel` 合法性。
- 公开 Markdown 中明显的 secret / private key 模式。
- ST / SillyTavern 旧词是否具有历史或 legacy 语境。

## 通过标准

```text
Documentation governance check: 0 error(s), 0 warning(s).
```

## 边界

检查器不是内容审稿人。它只负责发现结构性问题：缺字段、排序不稳定、明显密钥、旧架构词缺历史语境。

具体内容是否适合公开，仍需要人工判断，尤其是叙事设计和角色草案。

## 已覆盖范围

`design / technical / decisions` collections 已纳入检查器。新增正式文档时，必须包含 `title`、`date`、`status`、`version`、`lastVerified`、`scope`、`spoilerLevel` 和 `summary`。
