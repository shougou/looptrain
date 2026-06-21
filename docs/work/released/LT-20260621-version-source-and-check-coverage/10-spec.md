# 10-spec.md — 设计规格

**Work Item**: LT-20260621-version-source-and-check-coverage
**版本级别**: patch（工程规范类，按规则 14 例外生成 devlog 文章）
**版本号**: v0.8.2-version-source

---

## 1. 目标（追溯 00-idea.md）

建立版本号单一源（VERSION 文件）+ 自动化同步（sync_version.sh）+ 全覆盖检查（扩展 check_release_wrapup.sh + 新增 check_cross_consistency.py），从工程化手段消除版本号不一致，修复当前 23 处不一致，新增规则 17-20。

## 2. 非目标

- 不改造稳态文档手动更新流程
- 不修改游戏逻辑/前端交互/LLM Bridge
- 不建立自动化回滚系统
- 不引入新工具链

---

## 3. VERSION 文件设计

### 3.1 文件格式

**路径**: `/home/shougou/11_looptrain/VERSION`

**内容**: 单行文本，格式 `v<major>.<minor>.<patch>-<slug>`，无尾部换行符。

**示例**:
```
v0.8.2-version-source
```

### 3.2 版本号格式规范

- 必须以 `v` 开头
- 必须包含 `<major>.<minor>.<patch>` 三段数字
- 可选 `-<slug>` 后缀（小写字母、数字、连字符）
- 正则: `^v\d+\.\d+\.\d+(-[a-z0-9-]+)?$`

---

## 4. 版本号派生位置清单（13 处）

| # | 文件 | 字段/位置 | 当前值 | 同步方式 |
|---|------|----------|--------|---------|
| 1 | `VERSION` | 整个文件 | (新建) | 唯一源（人工编辑） |
| 2 | `MANIFEST.json` | `looptrain_version` | `0.5-standalone-mvp` | sync_version.sh |
| 3 | `looptrain/standalone/package.json` | `version` | `0.5.0` | sync_version.sh |
| 4 | `looptrain/standalone/server.js` | health endpoint `version` 字段 | `0.6-standalone-mvp` | sync_version.sh |
| 5 | `looptrain/standalone/server.js` | startup log `v0.6.0` | `v0.6.0` | sync_version.sh |
| 6 | `looptrain/standalone/public/app.js` | header comment `v0.8.0` | `v0.8.0` | sync_version.sh |
| 7 | `looptrain/standalone/public/app.js` | `LT_RUNTIME_VERSION` 常量 | `0.8.0` | sync_version.sh |
| 8 | `looptrain/standalone/public/audio-manager.js` | header comment `v0.5.1` | `v0.5.1` | sync_version.sh |
| 9 | `looptrain/standalone/public/portrait-intro.js` | header comment `v0.7.1` | `v0.7.1` | sync_version.sh |
| 10 | `docs/project/PROJECT_STATUS.md` | 版本号行 | `v0.8.1-save-versioning` | 人工 + 检查 |
| 11 | `docs/project/CHANGELOG.md` | 最新条目标题 | `v0.8.1-save-versioning` | 人工 + 检查 |
| 12 | `devlog/src/data/site-status.json` | `currentVersion` | `v0.8.1-save-versioning` | sync_version.sh |
| 13 | `looptrain/AGENT.md` | §2 当前版本 | `v0.8-testplay` | sync_version.sh |

**删除**: `devlog/src/data/site.ts` 的 `CURRENT_VERSION` 和 `CURRENT_PHASE` 常量（未被任何页面引用，是死代码）

---

## 5. sync_version.sh 规格

### 5.1 输入

- `VERSION` 文件（必须存在，非空）

### 5.2 输出

- 修改 11 个派生位置（#2-#9, #12-#13）
- stdout: 修改的文件列表
- 退出码: 0 = 全部成功，1 = 有失败

### 5.3 替换规则

| # | 文件 | 匹配模式 | 替换为 |
|---|------|---------|--------|
| 2 | MANIFEST.json | `"looptrain_version":\s*"[^"]+"` | `"looptrain_version": "$VERSION"` |
| 3 | package.json | `"version":\s*"[^"]+"` (仅 standalone/package.json) | `"version": "$NPM_VERSION"` |
| 4 | server.js health | `version:\s*'[^']+'` 在 health endpoint 行 | `version: '$VERSION'` |
| 5 | server.js log | `v\d+\.\d+\.\d+(-[a-z0-9-]+)?` 在 startup log 行 | `$VERSION` |
| 6 | app.js header | `v\d+\.\d+\.\d+(-[a-z0-9-]+)?` 在 header comment 行 | `$VERSION` |
| 7 | app.js const | `LT_RUNTIME_VERSION\s*=\s*'[^']+'` | `LT_RUNTIME_VERSION = '$VERSION'` |
| 8 | audio-manager.js | `v\d+\.\d+\.\d+(-[a-z0-9-]+)?` 在 header comment | `$VERSION` |
| 9 | portrait-intro.js | `v\d+\.\d+\.\d+(-[a-z0-9-]+)?` 在 header comment | `$VERSION` |
| 12 | site-status.json | `"currentVersion":\s*"[^"]+"` | `"currentVersion": "$VERSION"` |
| 13 | AGENT.md | `v\d+\.\d+\.\d+(-[a-z0-9-]+)?` 在 §2 当前版本 | `$VERSION` |

### 5.4 版本号格式处理

- `VERSION` 文件: `v0.8.2-version-source`
- `package.json` version 字段: `0.8.2`（去除 `v` 前缀和 `-slug` 后缀，符合 npm 语义版本）
- 其他位置: 直接使用 VERSION 文件内容

### 5.5 不修改的位置

PROJECT_STATUS.md (#10) 和 CHANGELOG.md (#11) 不由 sync_version.sh 修改，因为它们含有人工编写的上下文文本，由收尾阶段人工更新 + check_release_wrapup.sh 验证一致性。

---

## 6. check_release_wrapup.sh 扩展规格

### 6.1 当前第 6 项"Version consistency"检查范围

当前检查 4 个位置:
- 50-release-note.md
- PROJECT_STATUS.md
- CHANGELOG.md
- site-status.json

### 6.2 扩展后检查范围（13 个位置）

新增检查:
- `VERSION` 文件本身
- `MANIFEST.json` 的 `looptrain_version`
- `standalone/package.json` 的 `version`
- `standalone/server.js` health endpoint 的 version（静态扫描）
- `standalone/public/app.js` 的 `LT_RUNTIME_VERSION`
- `looptrain/AGENT.md` §2 当前版本

### 6.3 检查逻辑

对每个位置提取版本号，与 `VERSION` 文件比对。

提取方式:
- VERSION 文件: `cat VERSION`
- JSON 文件: `grep -oP '"(looptrain_version|version|currentVersion)":\s*"?([^"]+)"?'`
- server.js: 静态扫描 health endpoint 行的 `version` 字段
- app.js: 静态扫描 `LT_RUNTIME_VERSION` 常量
- AGENT.md: 静态扫描 §2 章节的版本号

**格式归一化**: package.json 的 version 字段为 `0.8.2` 格式（无 v 前缀），比对时需在前面加 `v` 并与 VERSION 文件的 `<major>.<minor>.<patch>` 部分比对。

### 6.4 输出

- 每个位置一行: `位置名: 版本号`
- 不一致时: `FAIL: 位置名 ($actual) != VERSION ($expected)`
- 全部一致: `PASS: Version numbers consistent across all 13 locations`

---

## 7. check_cross_consistency.py 规格

### 7.1 目的

检查跨文档内容一致性，捕获 changelog/devlog 声称的变更与代码实际状态不符的问题。

### 7.2 检查项

#### 检查 1: PROJECT_STRUCTURE.md 引用目录存在性

- 解析 `PROJECT_STRUCTURE.md` 中所有形如 `├── dirname/` 或 `└── dirname/` 的目录引用
- 验证每个引用的目录在项目根目录下实际存在
- 不存在的目录 → ERROR

#### 检查 2: looptrain/AGENT.md §4 目录结构文件存在性

- 解析 `looptrain/AGENT.md` §4 中列出的文件路径
- 验证每个文件实际存在
- 不存在的文件 → ERROR

#### 检查 3: 根 README.md "尚未具备"清单与 PROJECT_STATUS 一致性

- 解析根 `README.md` "SLT 尚未具备" 章节
- 解析 `docs/project/PROJECT_STATUS.md` "最近完成" 章节
- 如果 README 的"尚未具备"项与 PROJECT_STATUS 的"已完成"项矛盾 → WARN

#### 检查 4: changelog "Removed" 章节验证

- 解析 `docs/project/CHANGELOG.md` 所有 `### Removed` 章节
- 提取被移除的 ID/名称
- 在 `looptrain/standalone/` 和 `looptrain/materials/runtime/` 中搜索这些 ID
- 如果仍存在 → WARN（可能未完全执行移除）

#### 检查 5: changelog "Added" 章节验证

- 解析 `docs/project/CHANGELOG.md` 所有 `### Added` 章节
- 提取新增的 ID/名称
- 在 `looptrain/standalone/` 和 `looptrain/materials/runtime/` 中验证存在性
- 如果不存在 → WARN

### 7.3 退出码

- 0: 无 ERROR
- 1: 有 ERROR
- WARN 不影响退出码，但打印警告

---

## 8. 23 处不一致修复清单

### 8.1 版本号不一致（9 处）

执行 `sync_version.sh` 后，以下位置的版本号将统一为 `v0.8.2-version-source`:
- MANIFEST.json → v0.8.2-version-source
- standalone/package.json → 0.8.2
- server.js health endpoint → 0.8.2-version-source
- server.js startup log → v0.8.2-version-source
- app.js header → v0.8.2-version-source
- app.js LT_RUNTIME_VERSION → 0.8.2-version-source
- audio-manager.js header → v0.8.2-version-source
- portrait-intro.js header → v0.8.2-version-source
- AGENT.md §2 → v0.8.2-version-source

### 8.2 内容声明不一致（4 处）

| # | 文件 | 修复内容 |
|---|------|---------|
| 14 | `devlog/src/content/changelog/v0.8-testplay.md` | "陆成（列车乘务员，替代赵乘警）" → "赵乘警（保留原名，方案中的陆成未采用）" |
| 15 | `devlog/src/content/devlog/2026-06-19-v07-v08-goal-content.md` | 修正"赵乘警→陆成"表格为"赵乘警保留"；修正角色列表 |
| 16 | `devlog/src/data/roadmap.ts` | "陆成/灰衣乘客新角色" → "灰衣乘客新角色（赵乘警保留）" |
| 17 | `docs/project/testplay.md` | 全文陆成→赵乘警替换 |

### 8.3 文档结构过期（5 处）

| # | 文件 | 修复内容 |
|---|------|---------|
| 18 | 根 `README.md` | "SLT 尚未具备"中移除"音效系统实现"和"内容完全外置化"（均已完成） |
| 19 | `PROJECT_STRUCTURE.md` | 移除 `TBD/` 目录引用；更新 `docs/`、`scripts/`、`looptrain/docs/` 结构；新增 `looptrain/standalone/src/` |
| 20 | `looptrain/AGENT.md` | §4 目录结构更新为当前实际结构 |
| 21 | `looptrain/README.md` | "尚未完成"中移除"内容完全外置化" |
| 22 | `looptrain/standalone/README.md` | "进入第七节车厢" → "进入二号车厢" |
| 23 | `looptrain/materials/README.md` | 移除沈墨寒、小宁妈妈引用；更新为当前角色清单 |
| 24 | `docs/project/ARCHITECTURE.md` | 端口 3001 → 3030 |

### 8.4 site.ts 死代码清理（1 处）

| # | 文件 | 修复内容 |
|---|------|---------|
| 25 | `devlog/src/data/site.ts` | 删除 `CURRENT_VERSION` 和 `CURRENT_PHASE` 常量 |

### 8.5 缺失文档补全（1 处）

| # | 文件 | 修复内容 |
|---|------|---------|
| 26 | `docs/work/released/LT-20260619-document-workflow/60-devlog-draft.md` | 标注为"已由 engineering-governance-workflow 文章覆盖" |

---

## 9. AGENT.md 规则 17-20 规格

### 规则 17: 版本号唯一源

`VERSION` 文件是项目唯一版本源，所有其他位置必须从此同步。`scripts/sync_version.sh` 在收尾阶段 7 必须执行。

验证方式：`check_release_wrapup.sh` 检查全部 13 个位置版本号一致。

### 规则 18: 收尾检查全覆盖

`check_release_wrapup.sh` 必须验证全部 13 个版本号位置一致。新增版本号位置时，必须同步更新 `sync_version.sh` 和 `check_release_wrapup.sh`。

验证方式：`check_release_wrapup.sh` 第 6 项输出 13 个位置的版本号。

### 规则 19: 文档结构变更必须同步 PROJECT_STRUCTURE.md

任何目录增删必须同步更新 `PROJECT_STRUCTURE.md`，`check_cross_consistency.py` 验证引用目录存在。

验证方式：`check_cross_consistency.py` 检查 1。

### 规则 20: changelog 声称的变更必须可验证落地

`check_cross_consistency.py` 解析 changelog 的 Added/Removed 章节，验证代码实际状态。

验证方式：`check_cross_consistency.py` 检查 4 和 5。

---

## 验收标准

### AC-1: VERSION 文件存在且格式正确

**验证**: `cat VERSION` 输出 `v0.8.2-version-source`，匹配正则 `^v\d+\.\d+\.\d+(-[a-z0-9-]+)?$`

### AC-2: sync_version.sh 执行成功

**验证**: `bash scripts/sync_version.sh` 退出码 0，输出修改的文件列表

### AC-3: sync_version.sh 执行后 13 个版本号位置全部一致

**验证**: 手动检查 13 个位置的版本号，全部为 `v0.8.2-version-source`（package.json 为 `0.8.2`）

### AC-4: check_release_wrapup.sh 覆盖 13 个版本号位置

**验证**: `bash scripts/check_release_wrapup.sh LT-20260621-version-source-and-check-coverage` 第 6 项输出 13 个位置

### AC-5: check_cross_consistency.py 检查 5 项

**验证**: `python3 scripts/check_cross_consistency.py` 输出 5 项检查结果，退出码 0

### AC-6: site.ts 不再包含 CURRENT_VERSION 和 CURRENT_PHASE

**验证**: `grep -E "CURRENT_VERSION|CURRENT_PHASE" devlog/src/data/site.ts` 无输出

### AC-7: devlog 构建成功

**验证**: `cd devlog && npm run build` 退出码 0

### AC-8: 陆成引用全部修复

**验证**: `grep -r "陆成" devlog/src/ docs/project/` 无输出（work item 文档除外）

### AC-9: PROJECT_STRUCTURE.md 不引用不存在的目录

**验证**: `python3 scripts/check_cross_consistency.py` 检查 1 PASS

### AC-10: looptrain/AGENT.md §4 目录结构文件存在

**验证**: `python3 scripts/check_cross_consistency.py` 检查 2 PASS

### AC-11: 根 README.md "尚未具备"清单与 PROJECT_STATUS 不矛盾

**验证**: `python3 scripts/check_cross_consistency.py` 检查 3 PASS

### AC-12: check_docs_governance.py 仍 PASS

**验证**: `python3 scripts/check_docs_governance.py` 退出码 0

### AC-13: check_project_docs.sh 仍 PASS

**验证**: `bash scripts/check_project_docs.sh` 退出码 0

### AC-14: verify_slt.sh 仍 PASS

**验证**: `bash scripts/verify_slt.sh` 退出码 0

### AC-15: AGENT.md 包含规则 17-20

**验证**: `grep -c "规则 17\|规则 18\|规则 19\|规则 20" looptrain/AGENT.md` 输出 4

### AC-16: 所有现有检查脚本不被破坏

**验证**: check_docs_governance.py、check_project_docs.sh、check_work_item.sh、verify_slt.sh 全部 PASS

---

## 风险与回滚

### 风险

1. sync_version.sh 的 sed 替换可能误伤其他行 → 通过精确的正则匹配降低风险
2. check_cross_consistency.py 的 changelog 解析可能过于严格 → WARN 不阻断流程
3. testplay.md 大量替换可能引入错误 → 替换后人工审查

### 回滚

`git revert` 本次所有 commit。
