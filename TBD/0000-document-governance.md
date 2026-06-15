---
status: draft
type: governance
topic: documentation-governance
created: 2026-06-15
updated: 2026-06-15
owner: shougou
target: devlog/src/content/devlog/2026-06-15-document-governance.md
decision: accepted-for-drafting
---

# LoopTrain 文档治理草案

> 本文件是讨论稿，用于把 LoopTrain 的文档治理规则整理成正式方案。它不直接代表公开文档的最终版本；正式公开版本位于 devlog 内容区。

## 1. 背景

LoopTrain 现在已经形成两个主要工程面：

- `looptrain/standalone/`：当前本地默认运行时，也就是 SLT（Standalone LoopTrain）。
- `devlog/`：公开开发日志站，也是后续项目文档的长期归档位置。

与此同时，项目里已经存在多层文档：根目录 README、部署总览、`looptrain/docs/`、`looptrain/materials/docs/`、`devlog/docs/`、`devlog/src/content/`，以及 `TBD/` 下的讨论稿。

文档数量增加后，最大风险不是“没有文档”，而是：

```text
多个地方都在描述项目状态，但没有明确谁代表当前事实。
```

因此需要建立一套轻量治理规则。

## 2. 治理目标

文档治理的目标不是把所有 Markdown 机械搬到同一个目录，而是明确每类文档的生命周期：

```text
想法 → 讨论稿 → 方案确认 → 正式文档 → 定期校验 → 历史归档
```

最终希望做到：

1. 新想法有地方放。
2. 正式文档有唯一归宿。
3. 根目录保持清爽。
4. 历史 ST 内容不会继续污染当前事实。
5. Devlog 不只是博客，而是项目长期知识库。

## 3. 已接受的治理决策

### 3.1 `TBD/` 保留为讨论稿区

`TBD/` 用来保存：

- 未定角色设计
- 机制草案
- 架构替代方案
- LLM Bridge 风险分析草稿
- 内容外置化方案草稿
- 还没有决定是否实现的长期想法

规则：

- `TBD/` 中的内容不代表当前事实。
- `TBD/` 中的内容不能直接作为实现依据。
- `TBD/` 可以保留不完整、不稳定、探索性的文本。
- 草案被接受后，不删除原稿，只在原稿中标记正式目标位置。

### 3.2 `devlog/src/content/` 是正式长期文档中心

正式文档最终进入 devlog 内容区。

建议长期结构：

```text
devlog/src/content/
├── devlog/       # 开发过程记录
├── changelog/    # 版本记录
├── characters/   # 可公开角色资料
├── design/       # 设计说明、机制说明、架构说明
├── technical/    # API、部署、测试、内容模型、运维说明
└── decisions/    # 重要决策记录
```

当前项目尚未创建 `design/`、`technical/`、`decisions/` collection。本草案先定义方向，是否扩展 Astro content schema 另行实施。

### 3.3 根目录文档只保留入口职责

根目录只承担“入口”和“当前事实摘要”的职责：

| 文件 | 职责 |
|---|---|
| `README.md` | 当前主线、启动方式、验证方式、项目铁律、文档入口 |
| `DEPLOYMENT.md` | Devlog + 游戏部署总览，详细说明跳转正式文档 |
| `MANIFEST.json` | 机器可读项目事实 |

根目录不应继续增长为长文档集合。

### 3.4 正式文档必须带状态元信息

正式文档建议至少包含：

```yaml
status: current
version: v0.5.0-standalone
lastVerified: 2026-06-15
scope: documentation
spoilerLevel: none
```

推荐字段：

| 字段 | 示例 | 含义 |
|---|---|---|
| `status` | `current`, `planned`, `stale`, `legacy`, `deprecated` | 文档状态 |
| `version` | `v0.5.0-standalone` | 对应项目版本 |
| `lastVerified` | `2026-06-15` | 最近校验日期 |
| `scope` | `game-runtime`, `devlog-site`, `deployment`, `llm`, `testing` | 文档范围 |
| `spoilerLevel` | `none`, `light`, `internal`, `core` | 剧透等级 |
| `sourceDraft` | `TBD/0000-document-governance.md` | 来源草案 |

### 3.5 Legacy ST 内容必须标记为历史资料

SillyTavern / ST 相关内容保留时必须明确标记：

```yaml
status: legacy
```

或在正文中说明：

```text
本节描述历史实现，不代表当前 SLT 架构。
```

旧 ST 内容不能继续作为当前架构事实源。

## 4. 文档状态模型

建议使用以下状态：

```text
draft → reviewing → accepted → published → stale → legacy/deprecated
```

| 状态 | 常见位置 | 含义 |
|---|---|---|
| `draft` | `TBD/` | 草稿，未定 |
| `reviewing` | `TBD/` | 正在讨论 |
| `accepted` | `TBD/` 或正式文档草稿 | 方案已接受，等待整理 |
| `published` / `current` | `devlog/src/content/` | 当前正式文档 |
| `stale` | 任意正式文档 | 可能过时，需要校验 |
| `legacy` | 历史文档 | 历史资料，不代表当前事实 |
| `deprecated` | 历史文档 | 已废弃，不应作为依据 |

## 5. 当前事实源优先级

当文档之间冲突时，按以下顺序判断：

```text
1. 实际运行代码
2. MANIFEST.json
3. 根 README.md
4. devlog/src/data/site-status.json
5. devlog/src/data/site.ts
6. devlog 正式文档
7. looptrain/docs 旧文档
8. TBD 草稿
```

解释：

- 代码和文档冲突时，代码优先。
- `TBD/` 永远不代表当前事实。
- 旧 ST 文档如果未标记 legacy，应优先视为待清理风险。

## 6. 剧透治理

LoopTrain 是悬疑叙事解谜项目。正式文档需要区分剧透等级。

建议等级：

| 等级 | 可公开 | 含义 |
|---|---|---|
| `none` | 是 | 无剧情秘密，通常是技术或流程文档 |
| `light` | 是 | 轻微设定，不影响核心谜题 |
| `internal` | 谨慎 | 设计资料，可能暴露结构或后续方向 |
| `core` | 否 | 核心真相、隐藏身份、谜底、关键反转 |

规则：

- `core` 不进入公开 devlog 页面。
- `characters/` 只放 `none` 或 `light`。
- `design/` 可包含 `internal`，但展示层需要处理。
- 当前治理方案自身为 `spoilerLevel: none`。

## 7. TBD 晋升规则

一个 TBD 文件满足以下条件时，可以晋升为正式文档：

1. 目标明确。
2. 方案已被接受。
3. 不再只是头脑风暴。
4. 能作为后续开发或项目记录依据。
5. 不泄露核心谜题。
6. 有明确目标位置。

晋升后，TBD 文件不删除，而是更新头部：

```yaml
status: accepted
publishedAs: devlog/src/content/design/example.md
decision: accepted
```

正文顶部增加：

```markdown
> This draft has been accepted and formalized at:
> `devlog/src/content/design/example.md`
```

## 8. 文档审查清单

正式文档进入 devlog 前检查：

```text
[ ] 是否标明 status
[ ] 是否标明 version
[ ] 是否标明 lastVerified
[ ] 是否标明 scope
[ ] 是否标明 spoilerLevel
[ ] 是否有当前代码或数据来源
[ ] 是否区分已实现和计划中
[ ] 是否没有把计划写成承诺
[ ] 是否没有暴露核心谜题
[ ] 是否没有 API Key、服务器密码、私密信息
[ ] 是否处理了 Legacy ST 表述
```

## 9. 第一阶段治理任务

建议第一阶段只做文档治理，不做运行时代码重构。

### P0：建立规则和检查器

- 保留 `TBD/` 草稿区。
- 接受 devlog 作为正式文档中心。
- 统一正式文档元信息。
- 明确 Legacy ST 标记规则。
- 增加 `scripts/check_docs_governance.py`，作为文档治理的轻量自动检查入口。

### P1：建立迁移清单

参考：

```text
TBD/0001-document-migration-inventory.md
```

### P2：优先补齐缺失文档

建议新增正式文档：

```text
api-reference.md
llm-bridge.md
testing-guide.md
content-schema.md
deployment-topology.md
```

### P3：处理文档漂移

优先处理：

- ST / SillyTavern 旧描述。
- 版本号不统一。
- 过时路径。
- devlog spec 与当前页面不一致。

## 10. 执行入口

第一阶段采用非阻断式治理检查：

```bash
python3 scripts/check_docs_governance.py
```

脚本职责：

- 检查新 TBD 草案的基础 frontmatter。
- 检查 devlog 文章的 `date` 是否包含时间和时区，保证排序稳定。
- 检查公开 Markdown 中的明显密钥模式。
- 检查 ST / SillyTavern 旧词是否带有历史或 legacy 语境。
- 对历史遗留漂移先给出 warning，不阻断当前治理落地。

## 11. 公开发布版本

本草案的公开发布版本目标：

```text
devlog/src/content/devlog/2026-06-15-document-governance.md
```

公开版本应更短、更叙事化，不暴露内部敏感细节，不包含核心剧情设计。它应说明：

- 为什么需要治理文档。
- 为什么保留 TBD。
- 为什么正式文档进入 devlog。
- 如何避免信息漂移。
- 后续文档治理方向。
