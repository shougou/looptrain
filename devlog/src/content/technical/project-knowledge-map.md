---
title: "项目长期记忆与知识图谱"
date: "2026-06-15T17:20:00+08:00"
status: "current"
version: "v0.5.0-standalone"
lastVerified: "2026-06-15"
scope: "project-knowledge-map"
spoilerLevel: "none"
tags:
  - 项目记忆
  - 知识图谱
  - 技术文档
  - 文档治理
summary: "LoopTrain 当前项目事实、架构边界、文档治理规则、部署保护和后续迁移路线的长期记忆索引，用于后续迭代快速查找。"
sourceDraft: "TBD/0000-document-governance.md"
pinned: true
---

## 用途

本文是 LoopTrain 的长期项目记忆索引。它不替代代码、README 或正式设计文档，而是把关键事实和关系集中成一张可搜索的知识图谱，方便后续开发、审查、部署和文档迁移时快速定位事实源。

## 当前事实源优先级

```text
运行代码
→ MANIFEST.json
→ 根 README.md
→ devlog/src/data/*
→ devlog/src/content/ 正式文档
→ legacy 旧文档
→ TBD 草稿
```

`TBD/` 只保存讨论稿，不代表当前事实。正式长期文档进入 `devlog/src/content/`。

## 核心实体

| 实体 | 类型 | 当前位置 | 职责 |
|---|---|---|---|
| LoopTrain | 项目 | `README.md` | 互动叙事解谜游戏与 AI 协同开发实验项目 |
| SLT | 运行时 | `looptrain/standalone/` | 当前本地默认游戏运行时，不依赖 SillyTavern |
| Engine | 裁判层 | `looptrain/standalone/engine.js` | 唯一计算 AP、线索、状态、成功失败、循环继承的模块 |
| Express API | 后端接口 | `looptrain/standalone/server.js` | 提供 `/api/*` 游戏接口和 LLM Bridge 边界 |
| Vanilla Frontend | 游戏前端 | `looptrain/standalone/public/` | 手机端优先的独立游戏 UI |
| Materials | 内容包 | `looptrain/materials/` | 可迁移剧情、规则、线索、场景、Prompt 和素材 |
| Devlog | 静态站 | `devlog/` | 项目公开记录站与正式长期文档中心 |
| TBD | 草稿区 | `TBD/` | 未定方案、角色草案、机制探索和迁移讨论 |

## 不变铁律

| 铁律 | 含义 | 事实源 |
|---|---|---|
| Engine 是唯一裁判 | LLM 和前端不能直接决定 AP、线索、状态、成功失败或循环继承 | `README.md`, `looptrain/AGENT.md`, `MANIFEST.json` |
| LLM 只做表演文本 | LLM 输出 NPC 回复或语气建议，不写游戏状态 | `README.md`, `looptrain/AGENT.md` |
| API Key 不进前端 | 真实模型密钥只能保存在后端环境变量 | `README.md`, `looptrain/AGENT.md` |
| 本地验证先于部署 | 修改后先跑本地验证，再考虑线上发布 | `README.md`, `scripts/verify_slt.sh` |
| 线上切换需确认 | 不经最终确认，不切换生产 `/play/game` | `MANIFEST.json`, `DEPLOYMENT.md` |

## 技术栈关系

```text
Browser
  ↓
Vanilla JS game UI (`standalone/public/app.js`)
  ↓
Express API (`standalone/server.js`)
  ↓
Engine (`standalone/engine.js`)
  ↓
State / clues / dialogue / loop outcome
```

```text
Devlog Markdown collections
  ↓
Astro content collections (`devlog/src/content.config.ts`)
  ↓
Static routes (`devlog/src/pages/`)
  ↓
Nginx static site (`/var/www/looptrain-devlog/current`)
```

## 关键命令

| 任务 | 命令 | 说明 |
|---|---|---|
| 启动 SLT | `bash scripts/start_slt.sh` | 本地默认游戏运行时，端口 3030 |
| 验证 SLT | `bash scripts/verify_slt.sh` | 语法、engine smoke tests、HTTP checks |
| 验证文档治理 | `python3 scripts/check_docs_governance.py` | frontmatter、legacy、secret、date、正式文档字段 |
| 构建 Devlog | `cd devlog && npm run build` | Astro 静态构建 |
| 检查 Devlog | `cd devlog && npx astro check` | Astro 内容和类型检查 |
| 发布 Devlog | `bash scripts/deploy_devlog.sh` | 带 upstream / clean tree / governance / build 检查的受保护部署 |

## 文档治理图谱

| 源 | 目标 | 关系 |
|---|---|---|
| `TBD/0000-document-governance.md` | `devlog/src/content/design/document-governance.md` | 草案 → 正式设计文档 |
| `TBD/0001-document-migration-inventory.md` | `devlog/src/content/technical/*` | 迁移清单 → 正式技术文档入口 |
| `devlog/src/content/decisions/0001-devlog-as-formal-docs-hub.md` | `devlog/src/content/` | 决策记录 → Devlog 是正式文档中心 |
| `scripts/check_docs_governance.py` | `README.md`, `AGENT.md`, `DEPLOYMENT.md` | 自动检查器 → 迭代完成和部署前检查 |
| `scripts/deploy_devlog.sh` | 线上 release | 部署保护 → 防止本地落后远端时 `rsync --delete` 删除远端文章 |

## 已完成的文档治理能力

- `TBD/` 草稿区已保留并纳入治理。
- `design / technical / decisions` collections 已建立。
- 文档治理检查器已可运行并返回 0 errors / 0 warnings。
- Devlog 发布脚本已增加 upstream-behind 和 dirty-tree 保护。
- 旧 ST / SillyTavern 表述在主要 devlog 文章中已补历史语境。
- 旧规范文档 `devlog/docs/spec.md` 和 `devlog/docs/content-model.md` 已加 Legacy Note。
- 事故复盘文章已记录 `narrative-state-runtime` 丢失原因和修复方式。

- 音效系统 v0.5.1 已完成：AudioManager、manifest、6 个音效素材、事件映射层、静音开关、降级策略均已实现和部署。
- UI 已刷新为场景驱动布局（v0.5.1 UX Refresh），底部改为对话/行动两栏。

## 当前正式 collections

| Collection | 用途 | 当前状态 |
|---|---|---|
| `devlog` | 开发日志和复盘 | 已使用 |
| `changelog` | 版本记录 | 已使用 |
| `characters` | 公开角色资料 | 已使用 |
| `design` | 设计、架构、机制说明 | 已建立，部分内容为 planned 占位 |
| `technical` | API、测试、部署、内容模型 | 已建立，部分内容为 planned 占位 |
| `decisions` | 重要决策记录 | 已建立，当前有 ADR-0001 |

## 已纳入但待补正文的正式文档

| 文档 | 状态 | 后续动作 |
|---|---|---|
| `technical/api-reference.md` | planned | 补 Express API 请求/响应字段 |
| `design/llm-bridge.md` | planned | 补 Prompt Builder、Provider、Mock fallback、裁判边界 |
| `technical/testing-guide.md` | planned | 补 smoke tests、HTTP checks、浏览器验证路径 |
| `technical/content-schema.md` | planned | 补 Astro collections 与 materials JSON 结构 |
| `technical/deployment-topology.md` | planned | 补 nginx、release、current symlink、回滚流程 |

## 仍待迁移的旧文档

| 旧文档 | 建议目标 | 状态 |
|---|---|---|
| `looptrain/docs/LT_STANDALONE_ARCHITECTURE.md` | `design/standalone-architecture.md` | pending |
| `looptrain/docs/CONTROL_FLOW.md` | `design/control-flow.md` | pending |
| `looptrain/docs/DEPLOY.md` | `technical/deployment-topology.md` | pending |
| `looptrain/docs/SPEC.md` | `design/game-spec.md` | pending |
| `looptrain/materials/docs/*` | `design/` 或 `technical/` | pending |

## 部署事故记忆

`2026-06-15` 发生过一次 Devlog 文章丢失事故：

1. 远端分支已有 `2026-06-15-narrative-state-runtime.md`。
2. 本地未 fetch/merge 远端 commit。
3. 本地构建出的 `dist/` 缺少该文章。
4. 部署使用 `rsync --delete`。
5. 新 release 覆盖线上 current 后，文章消失。

修复方式：

- merge 远端 commit。
- 恢复文章。
- 新增 `scripts/deploy_devlog.sh`，发布前检查 upstream 是否领先本地。

以后 Devlog 发布必须使用：

```bash
bash scripts/deploy_devlog.sh
```

## 后续推荐路线

1. 补全 `technical/api-reference.md`。
2. 补全 `design/llm-bridge.md`。
3. 补全 `technical/testing-guide.md`。
4. 补全 `technical/content-schema.md`。
5. 补全 `technical/deployment-topology.md`。
6. 迁移 `looptrain/docs/LT_STANDALONE_ARCHITECTURE.md`。
7. 迁移 `looptrain/docs/CONTROL_FLOW.md`。

每完成一步，运行：

```bash
python3 scripts/check_docs_governance.py
cd devlog
npm run build
npx astro check
```
