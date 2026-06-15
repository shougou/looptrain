---
decisionId: "0001"
title: "Devlog 作为正式长期文档中心"
date: "2026-06-15T16:22:00+08:00"
status: "current"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "documentation-governance"
spoilerLevel: "none"
deciders:
  - shougou
tags:
  - 文档治理
  - 决策记录
  - 信息架构
summary: "记录 LoopTrain 文档治理的关键决策：保留 TBD 作为讨论稿区，使用 devlog/src/content 作为正式长期文档中心，根目录只保留入口职责。"
sourceDraft: "TBD/0000-document-governance.md"
pinned: true
---

## Context

LoopTrain 已经从早期验证阶段进入 SLT 独立运行时阶段。项目文档同时存在于根目录、`looptrain/docs/`、`looptrain/materials/docs/`、`devlog/docs/`、`devlog/src/content/` 和 `TBD/` 中。

如果不治理，多个文件会用不同时间点的语言描述同一个项目事实，形成文档漂移。

## Decision

使用 `devlog/src/content/` 作为正式长期文档中心。

保留 `TBD/` 作为讨论稿区。根目录文档只保留当前入口、启动方式、验证方式和事实索引。

## Alternatives Considered

### 继续把正式文档放在 `looptrain/docs/`

- 优点：靠近游戏运行时代码。
- 缺点：无法自然出现在公开 devlog 网站中，也不利于长期项目档案化。

### 把所有文档都集中到根目录

- 优点：路径直观。
- 缺点：根目录会快速变成第二套文档系统，入口职责变重。

### 删除 TBD，只保留正式文档

- 优点：结构更干净。
- 缺点：不适合创作型项目。许多角色、机制、叙事设计需要先保留讨论空间。

## Consequences

### Positive

- Devlog 可以承载开发日志、版本记录、设计说明、技术文档和决策记录。
- `TBD/` 的草稿身份明确，不再被误读为当前事实。
- 根目录保持简短，降低新读者理解成本。

### Negative

- 需要扩展 Astro content collections。
- 需要长期维护文档状态、剧透等级和 lastVerified。

### Follow-up

- 建立 `design / technical / decisions` collections。
- 补齐 API Reference、LLM Bridge、Testing Guide、Content Schema。
- 迁移并标记旧 ST 文档的历史语境。
