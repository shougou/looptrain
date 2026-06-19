# LoopTrain 文档体系

## 目录

### [project/](project/) — 稳态文档
长期维护的项目当前状态，每次 release 后同步更新。

| 文件 | 用途 |
|------|------|
| [PROJECT_STATUS.md](project/PROJECT_STATUS.md) | 当前版本、重点、风险 |
| [ROADMAP.md](project/ROADMAP.md) | 路线图 |
| [KNOWN_ISSUES.md](project/KNOWN_ISSUES.md) | 当前问题清单 |
| [CHANGELOG.md](project/CHANGELOG.md) | 版本变更记录 |
| [ARCHITECTURE.md](project/ARCHITECTURE.md) | 当前架构总览 |
| [GAME_DESIGN.md](project/GAME_DESIGN.md) | 游戏设计总览 |

### [adr/](adr/) — 架构决策记录
重大技术决策的独立文档。

### [work/](work/) — 工作流文档
- **[active/](work/active/)** — 当前进行中的 work item
- **[released/](work/released/)** — 已完成的 work item 归档

### [templates/](templates/) — 文档模板

---

## Work Item 流转规则

### 8 阶段流程

```
Idea → Spec → Plan → Code → Review → Release → Devlog → Archive
```

### 强制执行：三层约束

| 层 | 机制 | 作用 |
|:--:|------|------|
| 1 | 目录门禁 | Agent 先读 work item 目录状态再进入下一阶段 |
| 2 | `scripts/check_work_item.sh` | 预发布自动验证 7 项条件 |
| 3 | `scripts/check_project_docs.sh` | 发布后稳态文档一致性检查 |

### 每个 Work Item 必须包含

```
LT-YYYYMMDD-short-slug/
  00-idea.md              # 原始构想（不可被 Agent 覆盖）
  10-spec.md              # 设计规格（含验收标准）
  20-plan.md              # 实施计划（含文件变更清单）
  30-implementation-log.md # 实施日志
  40-review.md            # 审查报告（结论必须"通过"）
  50-release-note.md      # 发布说明（release 阶段）
  60-devlog-draft.md      # 开发日志草稿
```

完整 Agent 工作协议见 `looptrain/standalone/AGENT.md`。
