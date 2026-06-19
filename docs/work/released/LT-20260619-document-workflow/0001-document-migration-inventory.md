---
status: draft
type: inventory
topic: documentation-migration
created: 2026-06-15
updated: 2026-06-15
owner: shougou
target: devlog documentation collections
decision: proposed
---

# LoopTrain 文档迁移清单草案

> 本文件是文档治理的迁移清单讨论稿。它用于判断现有文档应保留、迁移、拆分、标记 legacy，还是后续归档。

## 1. 迁移目标

LoopTrain 文档未来采用三层结构：

```text
TBD/                  # 讨论稿，不代表当前事实
根目录                 # 当前事实入口和索引
devlog/src/content/    # 正式长期文档中心
```

本清单不要求一次性迁移所有文档，而是先给每个文档标注：

- 当前状态
- 风险
- 目标位置
- 处理方式
- 优先级

## 2. 处理方式定义

| 动作 | 含义 |
|---|---|
| `keep` | 保留在原位置，作为入口或运行说明 |
| `migrate` | 整体迁入 devlog 正式文档 |
| `split` | 拆成公开文档、技术文档、历史说明等多份 |
| `mark-legacy` | 标记为历史资料，不代表当前事实 |
| `merge` | 合并到已有正式文档中 |
| `archive-later` | 暂不处理，后续归档 |
| `replace` | 用新的正式文档替代旧文档 |

## 3. 优先级定义

| 优先级 | 含义 |
|---|---|
| `P0` | 当前会误导开发或公开页面，需优先处理 |
| `P1` | 重要文档缺口或迁移主线 |
| `P2` | 有价值但不紧急 |
| `P3` | 历史资料或低风险整理 |

## 4. 根目录文档

| 当前文件 | 当前角色 | 风险 | 建议动作 | 目标位置 | 优先级 |
|---|---|---|---|---|---|
| `README.md` | 当前项目入口 | 如果继续增长会变成长文档 | `keep` + 收敛为入口 | 保留根目录；详细内容链接 devlog | P0 |
| `DEPLOYMENT.md` | 部署总览 | 可能与具体部署文档重复 | `keep` + 作为索引 | 保留根目录；详细内容迁入 `technical/deployment-topology.md` | P1 |
| `MANIFEST.json` | 机器可读事实源 | 需要保持版本同步 | `keep` | 保留根目录 | P0 |
| `.gitignore` | 工程配置 | 无 | `keep` | 保留根目录 | P3 |

## 5. `looptrain/` 文档

| 当前文件 | 当前角色 | 风险 | 建议动作 | 目标位置 | 优先级 |
|---|---|---|---|---|---|
| `looptrain/AGENT.md` | SLT 开发协作规范 | 与正式文档重复但仍有本地价值 | `keep` + 摘要迁入 | `technical/development-rules.md` | P1 |
| `looptrain/README.md` | Standalone 快速说明 | 需要保持短小 | `keep` | 保留；链接 devlog 技术文档 | P1 |
| `looptrain/docs/SPEC.md` | 游戏规格 | 可能混合当前事实和旧计划 | `split` | `design/game-spec.md` + legacy notes | P1 |
| `looptrain/docs/CONTROL_FLOW.md` | 控制流说明 | 可能随 engine 漂移 | `migrate` + 增加 lastVerified | `design/control-flow.md` | P1 |
| `looptrain/docs/LT_STANDALONE_ARCHITECTURE.md` | SLT 架构说明 | 部分路径可能过时 | `migrate` + 修正路径 | `design/standalone-architecture.md` | P0 |
| `looptrain/docs/UI_UX_DESIGN.md` | UI/UX 说明 | 可能落后于当前 app/style | `migrate` + 更新 | `design/ui-ux.md` | P2 |
| `looptrain/docs/DEPLOY.md` | 游戏部署说明 | 与根部署文档重复 | `merge` | `technical/deployment-topology.md` | P1 |

## 6. `looptrain/materials/` 文档和内容

| 当前文件/目录 | 当前角色 | 风险 | 建议动作 | 目标位置 | 优先级 |
|---|---|---|---|---|---|
| `looptrain/materials/README.md` | 素材包说明 | 与未来 content schema 重叠 | `migrate` | `technical/content-schema.md` | P1 |
| `looptrain/materials/docs/CONTROL_LAYER_NOTES.md` | 控制层说明 | 可能与 engine 当前实现不一致 | `split` | `design/engine-rules.md` + `technical/content-schema.md` | P1 |
| `looptrain/materials/docs/TRIAL_EPISODE_DESIGN.md` | 试玩章节设计 | 可能包含剧情敏感内容 | `migrate` with spoiler review | `design/trial-episode-design.md` | P2 |
| `looptrain/materials/looptrain/prompts/*` | LLM prompt 模板 | 需要文档化 LLM 边界 | `merge` | `design/llm-bridge.md` | P1 |
| `looptrain/materials/looptrain/schemas/*` | JSON schema | 缺少人类可读说明 | `merge` | `technical/content-schema.md` | P1 |
| `looptrain/materials/looptrain/*.json` | 内容数据 | 与 engine 硬编码重复 | `document` | `technical/content-schema.md` | P1 |

## 7. `devlog/` 工程文档

| 当前文件 | 当前角色 | 风险 | 建议动作 | 目标位置 | 优先级 |
|---|---|---|---|---|---|
| `devlog/README.md` | Devlog 快速启动 | 简短明确 | `keep` | 保留 | P2 |
| `devlog/AGENT.md` | Devlog 设计和开发铁律 | 很长，不适合作为唯一正式文档 | `split` | `design/devlog-information-architecture.md` + `technical/devlog-maintenance.md` | P2 |
| `devlog/plan.md` | 实现计划 | 历史计划与当前事实混合 | `mark-legacy` | `decisions/` 或历史 devlog | P2 |
| `devlog/docs/spec.md` | Devlog 规格 | 存在 ST 旧表述风险 | `mark-legacy` + 摘要迁移 | `design/devlog-spec.md` | P0 |
| `devlog/docs/design.md` | Devlog 视觉设计 | 有价值但过长 | `split` | `design/devlog-visual-design.md` | P2 |
| `devlog/docs/content-model.md` | 内容模型 | 与实际 schema 需要同步 | `migrate` | `technical/devlog-content-model.md` | P1 |
| `devlog/docs/DEPLOY.md` | Devlog 部署 | 与根部署文档重叠 | `merge` | `technical/deployment-topology.md` | P1 |

## 8. `devlog/src/content/` 当前正式内容

| 当前目录 | 当前角色 | 风险 | 建议动作 | 优先级 |
|---|---|---|---|---|
| `devlog/src/content/devlog/` | 开发日志 | 早期文章存在版本和 ST 表述漂移 | `review` | P1 |
| `devlog/src/content/changelog/` | 版本记录 | 需要和 MANIFEST/version 同步 | `review` | P1 |
| `devlog/src/content/characters/` | 公开角色页 | 需要剧透等级治理 | `keep` + enforce spoilerLevel | P1 |

## 9. `TBD/` 草稿

| 当前文件 | 当前角色 | 风险 | 建议动作 | 目标位置 | 优先级 |
|---|---|---|---|---|---|
| `TBD/01_new_npc.md` | 新 NPC / Companion Runtime 草案 | 包含长期机制与可能剧透，需要保持 draft | `keep` + 后续拆分 | `design/companion-runtime.md` + `characters/` 公开版 | P2 |
| `TBD/0000-document-governance.md` | 文档治理草案 | 待正式发布 | `publish` | `devlog/src/content/devlog/2026-06-15-document-governance.md` | P0 |
| `TBD/0001-document-migration-inventory.md` | 文档迁移清单草案 | 需随项目演进更新 | `keep` | 后续可整理成 `technical/document-inventory.md` | P1 |

## 10. 第一批正式文档建议

建议第一批不要追求完整迁移，而是先补关键缺口。

### P0

1. `devlog/src/content/devlog/2026-06-15-document-governance.md`
   - 公开说明为什么建立文档治理。
2. `technical/document-governance.md`（待 content collection 支持后）
   - 更正式、更规则化的治理说明。
3. 标记 `devlog/docs/spec.md` 中 ST 相关内容为 legacy。

### P1

1. `technical/api-reference.md`
2. `design/llm-bridge.md`
3. `technical/testing-guide.md`
4. `technical/content-schema.md`
5. `technical/deployment-topology.md`

## 11. 迁移时的安全边界

迁移或发布前必须检查：

```text
[ ] 是否包含核心谜题答案
[ ] 是否暴露隐藏身份
[ ] 是否包含服务器密码/API Key/私密配置
[ ] 是否把计划写成承诺
[ ] 是否把 legacy ST 描述写成当前事实
[ ] 是否和 README / MANIFEST / site-status 冲突
[ ] 是否已运行 python3 scripts/check_docs_governance.py
```

## 12. 建议执行节奏

```text
第 1 步：发布文档治理 devlog 文章
第 2 步：增加 scripts/check_docs_governance.py，并在 README/AGENT 中引用
第 3 步：建立 design / technical / decisions 的 content model 草案
第 4 步：补 API Reference / LLM Bridge / Testing Guide
第 5 步：迁移并修正 SLT 架构文档
第 6 步：处理旧 ST 文档 legacy 标记
第 7 步：长期维护 lastVerified 和 status
```

## 13. 当前执行状态

已完成：

- `devlog/docs/spec.md` 已加 Legacy Note。
- `devlog/docs/content-model.md` 已加 Legacy Note。
- `technical/api-reference.md` 已创建 planned 占位。
- `design/llm-bridge.md` 已创建 planned 占位。
- `technical/testing-guide.md` 已创建 planned 占位。
- `technical/content-schema.md` 已创建 planned 占位。
- `technical/deployment-topology.md` 已创建 planned 占位。

仍未执行：

- `looptrain/docs/LT_STANDALONE_ARCHITECTURE.md` 迁移。
- `looptrain/docs/CONTROL_FLOW.md` 迁移。
- `looptrain/docs/DEPLOY.md` 合并进正式部署文档。
