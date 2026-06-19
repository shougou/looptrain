# Plan: LT 文档工程治理 — Work Item 流转制度（含强制执行层）

**来源**: 用户设计规范  
**复杂度**: Medium  
**状态**: 待确认

## Summary

将 LT 项目从"文档散放、无生命周期"迁移到 Work Item 流转制度。每次变更以 `LT-YYYYMMDD-slug` 目录为单位，经历 8 个阶段。**强制执行靠三层约束：目录门禁（物理）→ 预发布检查脚本（自动化）→ 稳态文档同步验证（自动化）**。

## 当前问题诊断

| 问题 | 现状 |
|------|------|
| 文档散放 | `docs/`、`.claude/plans/`、`.claude/reviews/`、`looptrain/docs/`、`TBD/`、`devlog/src/content/` 六处分散 |
| 无生命周期 | v0.6 plan 在 `docs/plan/`，v0.7 plan 在 `.claude/plans/`，review 在 `.claude/reviews/` — 同一版本的四份文档互不关联 |
| 版本信息过时 | `AGENT.md` 仍写 `v0.5-standalone-mvp`，实际已是 v0.8 |
| 稳态文档缺失 | 无 PROJECT_STATUS.md、无集中 ROADMAP.md、无 KNOWN_ISSUES.md |
| TBD 草稿区无治理 | `TBD/` 下有 6 个零散文件，无归类无生命周期 |
| **无强制执行** | **"release 后必须更新"是口号，没有门禁机制** |

---

## 强制执行模型：三层约束

这是本次方案的核心。不靠"人记得做"，靠物理约束和自动化检查。

```
层 1: 目录门禁（物理约束）
  └→ Work item 目录不存在 → 文档无处可放
  └→ 00-idea.md 缺失 → Agent 拒绝生成 spec
  └→ 40-review.md 结论非"通过" → Agent 拒绝写 release note

层 2: 预发布检查脚本（自动化门禁）
  └→ bash scripts/check_work_item.sh <id>
  └→ 检查 spec/plan/review 齐全 + review 通过
  └→ 不通过 → CI/git hook 阻断发布

层 3: 稳态文档同步验证（发布后检查）
  └→ bash scripts/check_project_docs.sh
  └→ 对比 PROJECT_STATUS 版本号 vs git tag
  └→ 对比 ROADMAP 完成项 vs CHANGELOG
  └→ 不一致 → git push 被 hook 拦截
```

### 层 1 详解：目录门禁

目录结构本身就是状态机。每个 work item 目录的状态由**存在哪些文件**决定：

| 阶段 | 门禁条件 | 谁强制执行 |
|------|---------|-----------|
| Idea → Spec | `00-idea.md` 非空 | AGENT.md 规则：Agent 读取后拒绝跳过 |
| Spec → Plan | `10-spec.md` 含验收标准章节 | AGENT.md 规则：Agent 检查后拒绝跳过 |
| Plan → Code | `20-plan.md` 含文件变更清单 | AGENT.md 规则：Agent 检查后拒绝跳过 |
| Code → Review | `30-implementation-log.md` 存在 | AGENT.md 规则 |
| Review → Release | `40-review.md` 结论为"通过" | `check_work_item.sh` 脚本 |
| Release → Archive | 稳态文档同步完成 | `check_project_docs.sh` 脚本 |

**关键设计**：Agent 在每次生成下一阶段文档时，必须先读取当前 work item 目录，验证前置文档存在且满足条件。这是 AGENT.md 中的硬性规则，不是建议。

### 层 2 详解：`scripts/check_work_item.sh`

预发布检查脚本。输入 work item ID，输出 PASS/FAIL。

```bash
bash scripts/check_work_item.sh LT-20260619-goal-action-system
```

检查项：
1. `00-idea.md` 存在且非空 → PASS/FAIL
2. `10-spec.md` 存在且含 `## 验收标准` 章节 → PASS/FAIL
3. `20-plan.md` 存在且含 `## 文件变更清单` 章节 → PASS/FAIL
4. `30-implementation-log.md` 存在 → PASS/FAIL
5. `40-review.md` 存在且含 `通过` 结论 → PASS/FAIL
6. `50-release-note.md` 存在且含 `## 发布检查` 全部勾选 → PASS/FAIL (release 阶段)
7. **全部 PASS → 退出码 0。任一 FAIL → 退出码 1，打印具体原因。**

集成方式：
- 作为 git pre-push hook：push 前自动检查 active/ 中已标记为 release 状态的 work item
- 或手动执行：发布前人工验证

### 层 3 详解：`scripts/check_project_docs.sh`

发布后稳态文档一致性检查。

```bash
bash scripts/check_project_docs.sh
```

检查项：
1. `docs/project/PROJECT_STATUS.md` 中的版本号 == 最近 git tag
2. `docs/project/ROADMAP.md` 中标记"已完成"的任务 ≥ `docs/project/CHANGELOG.md` 最新版本的条目
3. `docs/project/KNOWN_ISSUES.md` 不含已修复超过 2 个版本的条目
4. `docs/project/CHANGELOG.md` 最新版本的日期 ≤ 7 天前

不一致 → 打印具体差异和修复建议。

---

## 完整流转图（含门禁）

```
Idea (00-idea.md)
  │  Gate: 无（入口阶段）
  ▼
Spec (10-spec.md)
  │  Gate: 00-idea.md 非空 → Agent 拒绝跳过
  │  Gate: 10-spec.md 含"验收标准"章节 → Agent 拒绝跳过
  ▼
Plan (20-plan.md)
  │  Gate: 10-spec.md 存在 → Agent 拒绝跳过
  │  Gate: 20-plan.md 含"文件变更清单" → Agent 拒绝跳过
  ▼
Code + Implementation Log (30-*.md)
  │  Gate: 20-plan.md 存在 → Agent 拒绝跳过
  ▼
Review (40-review.md)
  │  Gate: 30-implementation-log.md 存在 → Agent 拒绝跳过
  │
  ├─ 结论="不通过" → 回到 Code 阶段
  │
  ▼ 结论="通过"
Release (50-release-note.md)
  │  Gate: check_work_item.sh → PASS 才能继续
  │  Gate: check_project_docs.sh → PASS 才能 push
  ▼
Devlog (60-devlog-draft.md)
  │  Gate: 50-release-note.md 存在
  ▼
Sync Project Docs
  │  Gate: check_project_docs.sh → 验证一致性
  ▼
Archive → released/
```

---

## 目标目录结构

```
docs/
  README.md                          # 文档总入口 + 流转规则说明
  
  project/
    PROJECT_STATUS.md                # 当前版本、重点、风险
    ROADMAP.md                       # 路线图（从 devlog/src/data/roadmap.ts 提取）
    KNOWN_ISSUES.md                  # 当前问题（从 site-status.json 提取）
    CHANGELOG.md                     # 版本变更聚合
    ARCHITECTURE.md                  # 架构总览（迁移自 looptrain/docs/）
    GAME_DESIGN.md                   # 游戏设计总览
    
  adr/
    ADR-0001-document-workflow.md    # 本次决策

  work/
    active/                          # 当前进行中
    released/                        # 已完成归档
      LT-20260619-goal-command-xu/
      LT-20260619-content-testplay/
    
  templates/                         # 8 个文档模板

scripts/
  check_work_item.sh                 # CREATE: 预发布门禁脚本
  check_project_docs.sh              # CREATE: 稳态文档一致性检查
```

---

## 实施步骤

### Step 1: 创建目录骨架和模板
- 创建 `docs/` 下所有目录（`project/`、`adr/`、`work/active/`、`work/released/`、`templates/`）
- 创建 8 个模板：idea / spec / plan / implementation-log / review / release-note / devlog-draft / adr
- 创建 `docs/README.md`（文档总入口 + 流转规则速查表）
- **Validate**: `find docs/ -type f | wc -l` ≥ 10

### Step 2: 创建稳态文档（从现有数据提取）
- `devlog/src/data/roadmap.ts` → `docs/project/ROADMAP.md`
- `devlog/src/data/site-status.json` → `docs/project/PROJECT_STATUS.md` + `KNOWN_ISSUES.md`
- `looptrain/docs/LT_STANDALONE_ARCHITECTURE.md` → `docs/project/ARCHITECTURE.md`
- 新建 `docs/project/CHANGELOG.md`（从 git log + 已有 changelog 聚合）
- 新建 `docs/project/GAME_DESIGN.md`
- **Validate**: 6 个文件全部非空

### Step 3: 创建强制执行脚本（核心门禁）

**`scripts/check_work_item.sh`**：
```bash
#!/usr/bin/env bash
# check_work_item.sh <work-item-id>
# 预发布门禁：检查 work item 目录中文档是否齐全且合规
# 退出码 0 = 全部通过，1 = 存在未通过项
```

检查逻辑：
1. `docs/work/active/$1/` 或 `docs/work/released/$1/` 目录存在
2. `00-idea.md` → `grep -q "^## "` 至少 2 个章节
3. `10-spec.md` → `grep -q "验收标准"` 章节存在
4. `20-plan.md` → `grep -q "文件变更"` 章节存在
5. `30-implementation-log.md` → 非空
6. `40-review.md` → `grep -q "通过"` 结论为通过
7. （release 阶段）`50-release-note.md` → `grep -c "\[x\]"` 全部勾选

**`scripts/check_project_docs.sh`**：
```bash
#!/usr/bin/env bash
# check_project_docs.sh
# 稳态文档一致性检查：对比 project/ 文档与 git tag / changelog
# 退出码 0 = 一致，1 = 不一致
```

检查逻辑：
1. `PROJECT_STATUS.md` 版本号 == `git describe --tags --abbrev=0`
2. `ROADMAP.md` 已完成任务数 ≥ `CHANGELOG.md` 最新版本条目数
3. `KNOWN_ISSUES.md` 无过期条目

- **Validate**: `bash scripts/check_work_item.sh LT-20260619-goal-command-xu` 返回 0

### Step 4: 迁移已有 work item（v0.7 + v0.8）
- `.claude/plans/v0.7-goal-command-xu-design.plan.md` → `docs/work/released/LT-20260619-goal-command-xu/20-plan.md`
- `.claude/reviews/v0.7-code-review.md` → `docs/work/released/LT-20260619-goal-command-xu/40-review.md`
- `.claude/plans/v0.8-game-content-design.plan.md` → `docs/work/released/LT-20260619-content-testplay/20-plan.md`
- 补齐缺失的 `00-idea.md`、`30-implementation-log.md`、`60-devlog-draft.md`
- **Validate**: `check_work_item.sh` 对两个 work item 均通过

### Step 5: 创建 ADR
- 写 `docs/adr/ADR-0001-document-workflow.md`，记录决策、三层约束模型、强制执行机制

### Step 6: 更新 AGENT.md — Agent 强制协议（可验证断言）
- 将 9 条规则从"建议语气"改为"可验证断言"：

```
1. 禁止直接编码。必须确认 docs/work/active/LT-*/10-spec.md 和 20-plan.md 存在。
   → 验证方式: Agent 在编码前 grep 检查对应目录下的文件。
2. 禁止覆盖 00-idea.md。
   → 验证方式: Agent 只能读取 00-idea.md，不可使用 Write/Edit 工具修改它。
3. 生成 spec 时必须引用 00-idea.md 的"目标"和"非目标"。
   → 验证方式: Agent 输出的 spec 中 grep 到了 idea 中的目标行。
4. 生成 plan 时必须列出文件级别的变更清单。
   → 验证方式: plan 的"文件变更清单"章节含至少 3 个具体文件路径。
5. 编码后必须更新 30-implementation-log.md。
   → 验证方式: Agent 编码完成后立即追加日期+变更记录。
6. review 必须逐条对照 spec 的验收标准。
   → 验证方式: 40-review.md 的"Spec 对照"表格含 spec 中每条验收标准。
7. release 后必须运行 check_work_item.sh 和 check_project_docs.sh。
   → 验证方式: 发布前两个脚本退出码均为 0。
8. devlog 只能基于 40-review.md 和 50-release-note.md 生成。
   → 验证方式: 60-devlog-draft.md 不包含以上两个文档没有的信息。
9. work item 完成后从 active/ 移动到 released/。
   → 验证方式: check_project_docs.sh 通过后执行 mv。
```

- 修正版本号 `v0.5-standalone-mvp` → `v0.8-testplay`
- **Validate**: AGENT.md 含 9 条可验证断言

### Step 7: 清理旧文档位置
- 删除 `.claude/plans/` 和 `.claude/reviews/` 中已迁移的文件
- 清理 `TBD/` 草稿区（归档或删除）
- 更新 `PROJECT_STRUCTURE.md`

---

## 六处源头 → 目标位置 完整迁移表

### ① `.claude/plans/`（6 个文件）

| 源文件 | 目标 | 操作 |
|--------|------|:--:|
| `v0.7-goal-command-xu-design.plan.md` | `docs/work/released/LT-20260619-goal-command-xu/20-plan.md` | MOVE |
| `v0.8-game-content-design.plan.md` | `docs/work/released/LT-20260619-content-testplay/20-plan.md` | MOVE |
| `command-system-design.plan.md` | v0.7 的子设计，合并到 `docs/work/released/LT-20260619-goal-command-xu/20-plan.md` 中引用 | ARCHIVE |
| `content-extraction.plan.md` | v0.8 的内容外置设计，合并到 `docs/work/released/LT-20260619-content-testplay/20-plan.md` 中引用 | ARCHIVE |
| `xu-zhiwei-design.plan.md` | v0.7 的子设计，合并到 `docs/work/released/LT-20260619-goal-command-xu/20-plan.md` 中引用 | ARCHIVE |
| `document-workflow-governance.plan.md` | **保留**（当前活跃方案） | KEEP |

### ② `.claude/reviews/`（3 个文件）

| 源文件 | 目标 | 操作 |
|--------|------|:--:|
| `v0.7-code-review.md` | `docs/work/released/LT-20260619-goal-command-xu/40-review.md` | MOVE |
| `v0.6-code-review.md` | `docs/work/released/LT-20260610-runtime-06/40-review.md`（创建 v0.6 轻量 work item） | MOVE |
| `v0.6-overall-review.md` | `docs/work/released/LT-20260610-runtime-06/` | MOVE |

### ③ `docs/`（根级，9 个文件）

| 源文件 | 目标 | 操作 |
|--------|------|:--:|
| `UI.md` | `docs/project/GAME_DESIGN.md`（UI 属于游戏设计总览的一部分） | MERGE |
| `testplay.md` | `docs/project/` 保留（试玩版设计约束参考文档） | MOVE |
| `plan/v0.6开发计划.md` | `docs/work/released/LT-20260610-runtime-06/20-plan.md` | MOVE |
| `plan/v0.6.0-development-plan.md` | 与 v0.6 计划合并 | MERGE |
| `v0.6-runtime-development-summary.md` | `docs/work/released/LT-20260610-runtime-06/60-devlog-draft.md` | MOVE |
| `superpowers/specs/*.md`（4 个文件） | `docs/work/released/LT-20260610-runtime-06/` 归档 | ARCHIVE |

### ④ `looptrain/docs/`（5 个文件）

| 源文件 | 目标 | 操作 |
|--------|------|:--:|
| `LT_STANDALONE_ARCHITECTURE.md` | `docs/project/ARCHITECTURE.md` | MOVE |
| `UI_UX_DESIGN.md` | `docs/project/GAME_DESIGN.md`（合并 UI 设计内容） | MERGE |
| `SPEC.md` | `docs/project/GAME_DESIGN.md`（游戏规格说明合并入游戏设计总览） | MERGE |
| `DEPLOY.md` | **保留原位**（部署文档属于 Runtime，不属于项目级文档） | KEEP |
| `CONTROL_FLOW.md` | **保留原位**（引擎控制流，Runtime 特定） | KEEP |

### ⑤ `TBD/`（9 个文件 — 全部草稿）

| 源文件 | 目标 | 操作 |
|--------|------|:--:|
| `0000-document-governance.md` | `docs/work/released/LT-20260619-document-workflow/00-idea.md`（作为本次制度的设计来源） | MOVE |
| `0001-document-migration-inventory.md` | `docs/work/released/LT-20260619-document-workflow/` | ARCHIVE |
| `runtime/*.md`（4 个文件） | `docs/work/released/LT-20260610-runtime-06/`（v0.6 的早期规范草稿） | ARCHIVE |
| `01_new_npc.md` | 废弃（v0.8 已实现） | DELETE |
| `02_doc.md` | 废弃 | DELETE |
| `devlog/01.md` | 废弃 | DELETE |

### ⑥ `devlog/src/content/` — 线上发布层，零迁移

**`devlog/` 是线上运行的 Astro 静态站，所有文件保持原位不动。**

| 文件 | 操作 | 原因 |
|------|:--:|------|
| `content/devlog/*.md`（全 18 篇） | **KEEP** | 对外发布内容，不动 |
| `content/changelog/*.md`（全 4 篇） | **KEEP** | 对外发布内容，不动 |
| `content/characters/*.md`（3 篇） | **KEEP** | 对外发布内容，不动 |
| `content/design/*.md` 等 | **KEEP** | 对外发布内容，不动 |
| `data/roadmap.ts` | **KEEP** | 线上路线图数据源 |
| `data/site-status.json` | **KEEP** | 线上状态数据源 |
| `data/site.ts` | **KEEP** | 线上站点常量 |
| `content/characters/shen-mohan.md` | **替换内容**（非删除） | 改为灰衣乘客，避免公开页面 404 |

**唯一修改**：`shen-mohan.md` 内容替换为灰衣乘客（文件名可能保持不变以兼容 URL，或更新 Astro slug）。

### 数据同步方向（工程层 ↔ 发布层）

```
[工程层 docs/project/]              [发布层 devlog/src/]
ROADMAP.md          ──手动同步──→  data/roadmap.ts
CHANGELOG.md        ──聚合源────  content/changelog/*.md
PROJECT_STATUS.md   ──手动同步──→  data/site-status.json
work/.../60-devlog-draft.md ──发布→ content/devlog/*.md
```

`check_project_docs.sh` 在发布后验证两边一致。

---

## 文件变更清单

| File | Action | Purpose |
|------|--------|---------|
| `docs/README.md` | CREATE | 文档总入口 + 流转规则 |
| `docs/project/PROJECT_STATUS.md` | CREATE | 当前项目状态 |
| `docs/project/ROADMAP.md` | CREATE | 路线图（从 devlog/src/data/roadmap.ts 提取） |
| `docs/project/KNOWN_ISSUES.md` | CREATE | 当前问题清单（从 site-status.json 提取） |
| `docs/project/CHANGELOG.md` | CREATE | 版本变更聚合 |
| `docs/project/ARCHITECTURE.md` | CREATE | 架构总览（从 looptrain/docs/ 迁移） |
| `docs/project/GAME_DESIGN.md` | CREATE | 游戏设计总览（合并 UI.md + UI_UX_DESIGN.md + SPEC.md） |
| `docs/project/testplay.md` | MOVE | 试玩版设计约束（从 docs/ 移入） |
| `docs/adr/ADR-0001-document-workflow.md` | CREATE | Work Item 制度决策 |
| `docs/templates/*.md` (8 files) | CREATE | 文档模板 |
| `docs/work/released/LT-20260619-goal-command-xu/` (~6 files) | CREATE | v0.7 work item 归档 |
| `docs/work/released/LT-20260619-content-testplay/` (~6 files) | CREATE | v0.8 work item 归档 |
| `docs/work/released/LT-20260610-runtime-06/` (~5 files) | CREATE | v0.6 work item 归档 |
| `docs/work/released/LT-20260619-document-workflow/` (2 files) | CREATE | 本次制度 work item |
| `scripts/check_work_item.sh` | CREATE | 预发布门禁脚本 |
| `scripts/check_project_docs.sh` | CREATE | 稳态文档一致性检查 |
| `looptrain/standalone/AGENT.md` | UPDATE | Agent 强制协议 + 版本号 |
| `PROJECT_STRUCTURE.md` | UPDATE | 反映新文档/脚本结构 |
| `.claude/plans/*.md`（迁移后） | DELETE | 6 个文件已迁移到 work item |
| `.claude/reviews/*.md`（迁移后） | DELETE | 3 个文件已迁移到 work item |
| `docs/`（原位置迁移后） | CLEANUP | UI.md/testplay.md 移入 project/，plan/ 移入 work/，superpowers/ 归档 |
| `TBD/` | CLEANUP | 2 个移入 work/，4 个归档，3 个删除 |
| `devlog/src/content/characters/shen-mohan.md` | DELETE | v0.8 已废弃角色

---

## 风险

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| 模板太复杂导致不使用 | Medium | 最小可执行版只要求 6 个文件，模板仅参考 |
| Agent 不遵守协议 | Medium | AGENT.md 用可验证断言 + bash 脚本验证 |
| 检查脚本被绕过 | Low | 集成到 git pre-push hook |
| 迁移后丢失上下文 | Low | copy 非 move，原文件暂时保留 |
| 稳态文档和 devlog 双写不同步 | Medium | `check_project_docs.sh` 自动检测不一致 |

---

## Acceptance

- [ ] `docs/` 目录结构完整（project/ + adr/ + work/active/ + work/released/ + templates/）
- [ ] 8 个模板文件就位
- [ ] 6 个稳态文档有实际内容（PROJECT_STATUS / ROADMAP / KNOWN_ISSUES / CHANGELOG / ARCHITECTURE / GAME_DESIGN）
- [ ] `docs/project/testplay.md` 已从 `docs/` 迁移
- [ ] `scripts/check_work_item.sh` 可执行且对 4 个 work item 均返回 0
- [ ] `scripts/check_project_docs.sh` 可执行且返回 0
- [ ] 4 个 work item 归档就位（v0.6 / v0.7 / v0.8 / document-workflow）
- [ ] ADR-0001 记录三层约束模型
- [ ] AGENT.md 含 9 条可验证断言 + 版本号已修正
- [ ] 六处源头已清理：
  - [ ] `.claude/plans/` — 迁移后删除
  - [ ] `.claude/reviews/` — 迁移后删除
  - [ ] `docs/` — UI.md/testplay.md 移入 project/，plan/ 移入 work/，superpowers/ 归档
  - [ ] `looptrain/docs/` — 架构/UI/SPEC 合并入 project/
  - [ ] `TBD/` — 2 个移入 work/，4 个归档，3 个删除
  - [ ] `devlog/src/content/characters/shen-mohan.md` — 删除
