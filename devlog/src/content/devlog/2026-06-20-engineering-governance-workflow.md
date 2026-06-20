---
title: "LoopTrain 工程规范：Work Item 流转制与收尾流程"
date: "2026-06-20T20:00:00+08:00"
version: "v0.8.1-save-versioning"
status: "done"
tags:
  - 工程规范
  - 文档治理
  - Work Item
  - AI 协作
  - 流程设计
summary: "从文档散落六处到 8 阶段 Work Item 流转制：LoopTrain 如何建立可验证的工程规范，并以存档版本检测系统为例完整走通从 Idea 到部署的全流程。"
---

## 背景：为什么要建立工程规范

LoopTrain 是一个互动叙事解谜游戏，同时也是一个 AI 协同开发实验室。随着项目从 v0.5 走到 v0.8，文档逐渐散落在 6 个不同位置：`docs/`、`.claude/plans/`、`.claude/reviews/`、`looptrain/docs/`、`TBD/`、`devlog/src/content/`。

问题不是"没有文档"，而是：

- **同一版本的四份文档互不关联**：plan、review、devlog、changelog 各自为政，不知道哪些是"当前版本"
- **稳态文档经常漏更新**：发布后 PROJECT_STATUS、ROADMAP、KNOWN_ISSUES 停留在旧状态
- **Agent 工作缺少固定输入输出**：每一步依赖聊天上下文，换一个 session 就从头来过
- **部署和文档脱节**：代码上线了但 changelog 没更新，或者文档更新了但代码没部署

这些问题在 AI 协作开发中尤其严重——Agent 没有记忆，没有"上周做了什么"的概念。如果流程不固定，每次协作都是从零开始。

## 核心设计：Work Item 8 阶段流转制

### 8 个阶段

```
Idea → Spec → Plan → Code → Review → Release → Devlog → Archive+部署
 1       2       3       4       5         6         7         8
                                        └────────┬────────┘
                                             收尾阶段
```

每个 Work Item 是一个独立目录 `LT-YYYYMMDD-short-slug/`，包含 7 个固定文档：

| 文件 | 阶段 | 作用 |
|------|------|------|
| `00-idea.md` | Idea | 原始构想（Agent 不可覆盖） |
| `10-spec.md` | Spec | 设计规格 + 验收标准 |
| `20-plan.md` | Plan | 实施计划 + 文件变更清单 |
| `30-implementation-log.md` | Code | 编码日志 |
| `40-review.md` | Review | 审查报告（必须"通过"） |
| `50-release-note.md` | Release | 发布说明 + 收尾 checklist |
| `60-devlog-draft.md` | Devlog | 开发日志草稿 |

### 16 条强制规则

规则分三类：

**编码前（规则 1-4）**：禁止直接编码，必须先有 spec 和 plan；spec 必须追溯 idea；plan 必须含文件级变更清单。

**编码中（规则 5-6）**：编码后必须更新 implementation log；review 必须逐条对照 spec 验收标准。

**收尾（规则 7-16）**：运行检查脚本；更新稳态文档；同步 devlog 数据；版本号一致；判断版本级别；部署线上；撰写 devlog 总结文章。

这些规则不是建议，是**可验证断言**——违反任一条，Agent 拒绝执行后续操作。

## 四层约束机制

规范的价值在于执行。我们建立了四层约束：

| 层 | 机制 | 阶段 | 验证内容 |
|:--:|------|:--:|---------|
| 1 | 目录门禁 | Idea→Code | 物理约束——缺失文件即拒绝 |
| 2 | `check_work_item.sh` | Release | 7 项条件：文档存在性 + 验收标准 + 文件清单 + review 结论 |
| 3 | `check_project_docs.sh` | Archive | 6 个稳态文档存在性 + 版本一致性 |
| 4 | `check_release_wrapup.sh` | Archive | 8 组验证：收尾 checklist + 稳态文档新鲜度 + devlog 同步 + 版本一致性 + 部署验证 |

第四层是本次扩展新增的，它把"收尾是否做完"变成了可脚本验证的事情——包括线上部署后的 `curl` 健康检查。

## 收尾阶段：从 3 件事到完整流程

原规范的收尾阶段过于单薄——只做 3 件事：生成 release note、生成 devlog draft、移到 released/。

扩展后的收尾阶段包含三个子阶段：

**阶段 6 — Release**：
- 生成 `50-release-note.md`
- 运行 `check_work_item.sh`

**阶段 7 — Devlog**：
- 更新 4 个稳态文档（PROJECT_STATUS / CHANGELOG / ROADMAP / KNOWN_ISSUES）
- 同步 2 个 devlog 网站数据文件（site-status.json / roadmap.ts）
- 追加 changelog 页面
- major/minor 发布额外生成 devlog 文章
- 验证版本号在 4 个位置一致

**阶段 8 — Archive + 部署**：
- 运行 `check_project_docs.sh` + `check_release_wrapup.sh`
- 移到 released/
- **执行线上部署**（Devlog + LT 游戏）
- 部署后验证 looptrain.me 健康状态

### 双源真策略

项目维护两层文档真实源：

| 层 | 位置 | 性质 | 消费者 |
|----|------|------|--------|
| 内部源 | `docs/project/` | 开发事实源 | Agent、开发者 |
| 公开层 | `devlog/src/data/` | 网站数据层 | 网站访问者 |

收尾时以内部源为主，同步到公开层。`check_release_wrapup.sh` 负责检测两层不一致。

### 版本编号方案

| 级别 | 示例 | 条件 |
|------|------|------|
| patch | v0.8.1 | Runtime 小改动（bug fix、文案、配置） |
| minor | v0.9 | 新功能/内容（新场景、角色、系统模块） |
| major | v1.0 | 破坏性变更（世界观重写、架构重做） |

版本号没指定就顺延：当前 v0.8，下次 patch 就是 v0.8.1，再下次就是 v0.8.2。

## 实战：存档版本检测系统的完整流转

以下用本次 v0.8.1 存档版本检测系统（Work Item: `LT-20260620-save-version-breaking-reset`）为例，走通完整的 8 阶段流程。

### 问题是什么

v0.8 试玩版对剧情、人物、Runtime、目标系统、记忆结构进行了全面重构。旧玩家的浏览器存档（`looptrain.standalone.v1`）与新系统语义完全不一致——旧 NPC ID 不存在、旧目标无法推进、旧线索无对应逻辑。

如果旧存档被新版 Runtime 直接读取，玩家会遇到目标错乱、NPC 不存在、开场不触发等致命状态错误。

### 阶段 1 — Idea

用户提出构想：**不做兼容迁移，检测到旧存档后主动废弃，提示玩家重新开始**。

生成 `00-idea.md`（161 行），包含：
- 背景：旧版 vs 新版的 6 维度对比表
- 7 个目标（存档版本化、不兼容检测、强制新开局、用户提示、数据安全、手动重置、IndexedDB 兼容）
- 5 个非目标（不做迁移、不做降级、不改 PWA、不做多存档、不做云同步）
- 初步设计：SaveMeta 结构、启动判断流程、key 前缀规范、三入口重置

**关键规则**：Agent 不可覆盖 `00-idea.md`——它是原始构想的不可变记录。

### 阶段 2 — Spec

Agent 基于 idea 生成 `10-spec.md`（301 行），包含 12 个章节：
- 数据结构设计：SaveMeta 6 字段、`lt:save:*` key 体系
- Runtime 影响：init() 4 路径分流（新玩家/旧数据/版本不兼容/兼容恢复）
- UI 状态设计：模态框状态机
- 兼容性影响：Breaking change 策略 + 版本升级分级
- **14 条验收标准**：每条可测试、可观测

Spec 的目标是"实现者不需要再问问题"。

### 阶段 3 — Plan

Agent 基于 spec 生成 `20-plan.md`（853 行），包含：
- 文件变更清单：6 个文件（app.js / index.html / style.css / audio-manager.js / smoke_test.js / engine.js）
- 14 步 Runtime 改造（每步含函数名、行号引用、AC 映射）
- UI 改造步骤（HTML 结构 + CSS 类名 + 事件绑定）
- 测试计划（14 条 AC 的手动验证步骤）
- 回滚方案
- 4 个分阶段任务

Plan 的目标是"开发者可以从头到尾执行而不需要提问"。

### 阶段 4 — Code

Agent 按 plan 执行编码，生成 `30-implementation-log.md`（50 行）。

实际改动：
- `app.js`：+255 行（版本常量、SaveMeta 读写、旧数据扫描、归档、清理、IndexedDB 清理、init() 重构、重置模态、三条重置路径）
- `index.html`：+10 行（重置模态 DOM + 命令栏按钮）
- `style.css`：+38 行（模态样式，匹配 `.lt-ng-card` 设计系统）
- `audio-manager.js`：+22 行（音频设置迁移到 `lt:settings`）
- `smoke_test.js`：+18 行（新增 test #7 存档版本检测）

验证：
- `node --check` 通过
- `npm test` 7 个测试块全部通过
- 服务器启动正常

### 阶段 5 — Review

Agent 逐条对照 spec 的 14 条验收标准，生成 `40-review.md`（219 行）：

| AC | 验证方式 | 结论 |
|----|---------|------|
| AC-1 新玩家无提示 | 代码路径：loadSaveMeta()→null→detectLegacyKeys()→[]→initNewSave() | 通过 |
| AC-2 旧数据检测+归档 | detectLegacyKeys() 找到旧 key→showResetModal()→handleReset() | 通过 |
| AC-8 不删 legacy key | clearLtKeys() 排除 `lt:legacy:` 前缀 | 通过 |
| AC-13 模态不可点遮罩关闭 | overlay 无 click 事件绑定 | 通过 |
| ... | ... | ... |

**结论：通过**。14/14 AC 全部由代码路径覆盖。

### 阶段 6 — Release

生成 `50-release-note.md`（107 行），包含：
- 版本级别标记：`[x] patch`
- 用户可见变化（5 项）
- Runtime 变化（7 项）
- 存档影响：BREAKING
- 回滚方式
- 发布检查 checklist

运行 `check_work_item.sh`：**10/10 PASS**。

### 阶段 7 — Devlog

这是本次扩展的重点。原规范只生成 `60-devlog-draft.md` 草稿就结束了。现在需要：

**更新稳态文档（4 个）**：
- `PROJECT_STATUS.md`：版本号 → v0.8.1-save-versioning，存档系统状态更新
- `CHANGELOG.md`：追加 v0.8.1 条目（Added / Changed / Fixed）
- `ROADMAP.md`：状态持久化 → [x] 已完成
- `KNOWN_ISSUES.md`：旧 #2 移入已解决，新增 IndexedDB 迁移项

**同步 devlog 网站数据（2 个）**：
- `site-status.json`：currentVersion / knownIssues / lastUpdated 同步
- `roadmap.ts`：任务状态同步

**追加 changelog 页面**：
- 新建 `devlog/src/content/changelog/v0.8.1-save-versioning.md`

**版本一致性验证**：
4 个位置的版本号全部一致：`v0.8.1-save-versioning`。

### 阶段 8 — Archive + 部署

**检查脚本**：
- `check_project_docs.sh`：6/6 PASS
- `check_release_wrapup.sh`：9/9 PASS（含部署验证）

**归档**：work item 从 `active/` 移至 `released/`。

**线上部署**：
- Devlog：`bash scripts/deploy_devlog.sh` → 构建成功（37 页，0 错误）→ rsync 完成
- LT 游戏：rsync 代码到服务器 → `pm2 restart looptrain-standalone` → 进程恢复

**部署验证**：
```
looptrain.me/api/health → 200 OK
looptrain.me/           → 200 OK
looptrain.me/play/game  → 200 OK
新代码特征 lt-reset-modal → 确认存在
新 changelog 页面        → 200 OK
```

### 全流程数据

| 指标 | 数值 |
|------|------|
| Work Item 文档总行数 | 1,741 行（7 个文件） |
| 代码变更 | 24 文件，+2,622/-47 行 |
| 验收标准 | 14 条，全部通过 |
| 检查脚本 | 3 个，共 394 行，全部 PASS |
| Agent 规则 | 15 → 16 条（本次新增规则 14 例外 + 规则 16） |
| Git commit | `da8161d` |

## 工程规范本身的演进

本次迭代不仅用规范开发了存档系统，还**同时扩展了规范本身**。具体变更：

1. **ADR-0001 扩展**：收尾阶段从 3 件事扩展为完整流程，部署纳入收尾
2. **AGENT.md 规则扩展**：9 条 → 16 条
   - 规则 10-12：稳态文档更新 + devlog 同步 + 版本一致性
   - 规则 13-14：版本编号方案 + devlog 文章策略
   - 规则 15：线上部署属于收尾
   - 规则 16：devlog 总结文章撰写属于收尾
   - 规则 14 例外：工程规范类 work item 即使 patch 也写 devlog 文章
3. **新检查脚本**：`check_release_wrapup.sh`（255 行，8 组验证）
4. **模板更新**：release-note 模板新增收尾 checklist + 部署 checklist

这意味着规范不是一次设计完就固定的——它随着实践演进。每次演进本身也是一个 Work Item，也要走完整流程。

## 反思

### 做对了什么

- **规则可验证**：每条规则都有对应的检查脚本或验证方式，不是"建议"而是"断言"
- **Agent 有固定 I/O**：每个阶段有明确的输入文件和输出文件，不依赖聊天上下文
- **收尾不留尾巴**：稳态文档、devlog 数据、线上部署全部纳入收尾，不靠人记
- **双源真解耦**：内部开发文档和公开网站数据分开维护，收尾时同步

### 代价

- **小改动也要走流程**：即使改一行文案也要创建 Work Item 目录和 7 个文档
- **收尾更新文件多**：patch 发布至少更新 8 个文件，major/minor 更多
- **检查脚本维护成本**：规范变化时检查脚本也要同步更新

### 下一步

- Playwright 回归测试：减少手动验证 14 条 AC 的工作量
- 真实 LLM 接入：Mock 模式验证的是代码路径，LLM 对话路径需要额外覆盖
- IndexedDB 迁移：当前存档系统基于 localStorage，后续需要迁移到 IndexedDB

## 结论

工程规范的价值不在于文档本身，而在于**让 AI 协作开发变得可重复**。

当 Agent 每次都能按固定流程产出固定质量的文档和代码时，开发者的角色就从"写代码"变成了"审查和决策"——这正是 AI 协作开发的正确姿势。

LoopTrain 的工程规范还会继续演进。但核心原则不会变：**每一步有固定输入输出，每一条规定可验证，每一次收尾不留尾巴。**
