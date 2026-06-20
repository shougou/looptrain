# ADR-0001: LT 文档流转采用 Work Item 制

## 状态

Accepted (2026-06-19)，Amendment (2026-06-20 — 收尾阶段扩展)

## 背景

LT 项目文档逐渐增多，spec、plan、review、devlog 分散在 6 个不同位置：
- `docs/`、`.claude/plans/`、`.claude/reviews/`、`looptrain/docs/`、`TBD/`、`devlog/src/content/`

同一版本的四份文档（plan / review / devlog / changelog）互不关联，导致：
- 文档无生命周期，不知道哪些是"当前版本"
- Agent 工作缺少固定输入输出
- 发布后稳态文档（状态/路线图/问题清单）经常漏更新

2026-06-20 修正：原 8 阶段流程中，阶段 6-8（Release → Devlog → Archive）合并称为**收尾阶段**。原规范中收尾阶段过于单薄——仅生成 50-release-note.md 和 60-devlog-draft.md，完成后移动到 released/。缺少对稳态文档、版本号一致性、以及 devlog 网站数据层的系统性同步。本次修正将收尾阶段正式扩展为完整的发布归档流程。

## 决策

### 8 阶段流程

所有功能、剧情、架构变更必须以 **Work Item** 为单位流转。

```
Idea → Spec → Plan → Code → Review → Release → Devlog → Archive
  1       2       3       4       5         6         7         8
                                         └────────┬────────┘
                                              收尾阶段
```

核心规则：
1. 每个构想生成一个 work item 目录（`LT-YYYYMMDD-slug`）
2. 8 阶段流转，其中阶段 6-8（收尾）合称「收尾阶段」
3. 全部文档放在同一个 work item 目录下
4. 稳态文档只记录"当前结论"，不堆过程
5. 每次发布后（收尾阶段）同步更新稳态文档 + devlog 网站数据

### 收尾阶段（阶段 6-8）详细要求

收尾阶段包含三个子阶段，按顺序执行：

**阶段 6 — Release**：
- 生成 `50-release-note.md`（发布说明）
- 运行 `scripts/check_work_item.sh <LT-ID>` 验证 work item 完整性

**阶段 7 — Devlog**：
- 基于 review 和 release note 生成 `60-devlog-draft.md`
- 更新所有稳态文档（`docs/project/`）：
  - `PROJECT_STATUS.md` — 更新版本号、状态描述
  - `CHANGELOG.md` — 追加版本条目（Added / Changed / Fixed）
  - `ROADMAP.md` — 标记已完成任务、添加新任务
  - `KNOWN_ISSUES.md` — 移除已解决问题、追加新问题
- 更新 devlog 网站数据层（`devlog/src/data/`）：
  - `site-status.json` — 更新 `play.currentVersion`、`play.knownIssues`、`site.lastUpdated`
  - `roadmap.ts` — 同步 ROADMAP.md 状态到前端数据
- 对 major / minor 发布：生成 devlog 文章到 `devlog/src/content/devlog/`
- 对 patch 发布：仅更新 `devlog/src/content/changelog/` 条目
- 确保版本号在以下位置一致：`PROJECT_STATUS.md`、`CHANGELOG.md`、`site-status.json`、`50-release-note.md`

**阶段 8 — Archive + 部署**：
- 运行 `scripts/check_project_docs.sh`（稳态文档存在性 + 项目内版本一致性）
- 运行 `scripts/check_release_wrapup.sh`（收尾阶段完整性验证）
- 将 work item 从 `docs/work/active/` 移动到 `docs/work/released/`
- **执行线上部署**（收尾最终步骤）：
  - Devlog 部署：构建 + rsync 到 looptrain.me（`bash scripts/deploy_devlog.sh`）
  - LT 游戏部署：rsync standalone 代码 + pm2 restart（参见 `DEPLOYMENT.md`）
  - 部署后验证：`curl https://looptrain.me/api/health` + `curl https://looptrain.me/`

### 版本编号方案

每次 work item 发布时决定版本号变更级别：

| 变更级别 | 示例（v0.8 →） | 适用条件 |
|----------|----------------|---------|
| **patch** | v0.8.1 | Runtime 小改动（bug fix、文案修正、配置调整） |
| **minor** | v0.9 | 新功能、新内容（新场景、新角色、新系统模块） |
| **major** | v1.0 | 破坏性内容变更（故事世界观重写、全系统架构重做） |

注意：当前项目处于 v0.x 试玩阶段，版本号沿用 `v0.X.Y` 格式。基础设施类 work item（如文档治理、脚本改进）通常按 patch 处理。

### 双源真策略（Dual Source of Truth）

LT 项目维护两层文档真实源：

| 层 | 位置 | 性质 | 消费者 |
|----|------|------|--------|
| **内部源** | `docs/project/` | 开发事实源，最完整 | Agent、开发者 |
| **公开层** | `devlog/src/data/` | 网站数据层，面向公开 | devlog 网站访问者 |

收尾阶段必须同步更新两层。`check_release_wrapup.sh` 负责检测两层不一致。

### 强制执行：四层约束

原三层约束扩展为四层（新增层 4）：

| 层 | 机制 | 阶段 | 作用 |
|:--:|------|:--:|------|
| 1 | 目录门禁 | Idea → Code | Agent 先读 work item 目录状态再进入下一阶段 |
| 2 | `scripts/check_work_item.sh` | Release | 预发布自动验证 7 项条件 |
| 3 | `scripts/check_project_docs.sh` | Archive | 稳态文档存在性 + 项目内版本一致性 |
| 4 | `scripts/check_release_wrapup.sh` | Archive | 收尾完整性：稳态文档更新、devlog 同步、跨层一致性 |

### 每个 Work Item 必须包含

```
LT-YYYYMMDD-short-slug/
  00-idea.md              # 原始构想（不可被 Agent 覆盖）
  10-spec.md              # 设计规格（含验收标准）
  20-plan.md              # 实施计划（含文件变更清单）
  30-implementation-log.md # 实施日志
  40-review.md            # 审查报告（结论必须"通过"）
  50-release-note.md      # 发布说明（release 阶段，含收尾 checklist）
  60-devlog-draft.md      # 开发日志草稿（devlog 阶段）
```

## 后果

### 正面

- 文档可追踪：每个版本的设计、计划、审查、日志在同一目录下
- Agent 工作稳定：每一步有明确输入输出，不依赖"聊天上下文"
- 稳态文档同步：收尾阶段强制更新 PROJECT_STATUS、CHANGELOG、ROADMAP、KNOWN_ISSUES
- devlog 网站同步：收尾阶段强制同步 site-status.json 和 roadmap.ts
- 版本一致性：收尾检查脚本验证版本号在 4 个位置一致
- 长期维护：新成员/Agent 可通过 `docs/README.md` 快速理解结构
- 分层真实源：内部开发事实源与公开网站数据层解耦，收尾阶段统一同步

### 代价

- 每次变更需先创建 work item 目录和 `00-idea.md`
- 小改动也需遵守流转流程
- 收尾阶段需要更新至少 8 个文件（4 个稳态文档 + 2 个网站数据文件 + 1 个 changelog 条目 + 1 个 devlog 文章）
- patch 发布与 major/minor 发布的收尾流程不同，需要 Agent 正确判断版本级别
- `devlog/src/` 和 `docs/project/` 双写，`check_release_wrapup.sh` 负责检测不一致

### 已纳入范围

- **部署流程：属于收尾最终步骤**。work item 归档后立即执行线上部署（Devlog + LT 游戏），部署后验证 looptrain.me 服务正常。
- 稳态文档同步：每次收尾手动更新 4 个稳态文档 + 2 个网站数据文件。未来可考虑自动化同步脚本。

### 明确排除

- 自动化同步脚本：当前所有稳态文档更新为手动执行（Agent 逐文件更新）。暂不纳入本次修正范围。
- 生产环境回滚自动化：回滚目前依赖 Git revert + 手动 rsync，不建立自动化回滚系统。
