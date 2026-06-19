# ADR-0001: LT 文档流转采用 Work Item 制

## 状态

Accepted (2026-06-19)

## 背景

LT 项目文档逐渐增多，spec、plan、review、devlog 分散在 6 个不同位置：
- `docs/`、`.claude/plans/`、`.claude/reviews/`、`looptrain/docs/`、`TBD/`、`devlog/src/content/`

同一版本的四份文档（plan / review / devlog / changelog）互不关联，导致：
- 文档无生命周期，不知道哪些是"当前版本"
- Agent 工作缺少固定输入输出
- 发布后稳态文档（状态/路线图/问题清单）经常漏更新

## 决策

所有功能、剧情、架构变更必须以 **Work Item** 为单位流转。

核心规则：
1. 每个构想生成一个 work item 目录（`LT-YYYYMMDD-slug`）
2. 8 阶段流转：Idea → Spec → Plan → Code → Review → Release → Devlog → Archive
3. 全部文档放在同一个 work item 目录下
4. 稳态文档只记录"当前结论"，不堆过程
5. 每次发布后同步更新稳态文档

强制执行靠三层约束：
- **层 1**：目录门禁（物理约束 — 缺失即拒绝）
- **层 2**：`scripts/check_work_item.sh`（预发布自动验证 7 项）
- **层 3**：`scripts/check_project_docs.sh`（发布后稳态一致性检查）

## 后果

### 正面

- 文档可追踪：每个版本的设计、计划、审查、日志在同一目录下
- Agent 工作稳定：每一步有明确输入输出，不依赖"聊天上下文"
- 稳态文档同步：发布后自动检查一致性
- 长期维护：新成员/Agent 可通过 `docs/README.md` 快速理解结构

### 代价

- 每次变更需先创建 work item 目录和 `00-idea.md`
- 小改动也需遵守流转流程
- 稳态文档需发布后手动同步到 `devlog/src/`（线上发布层）
- `devlog/src/` 和 `docs/project/` 双写，`check_project_docs.sh` 负责检测不一致
