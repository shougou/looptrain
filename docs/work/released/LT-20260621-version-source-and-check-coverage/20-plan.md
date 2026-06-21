# 20-plan.md — 实施计划

**Work Item**: LT-20260621-version-source-and-check-coverage

---

## 文件变更清单

### 新增文件（3 个）

| # | 文件路径 | 用途 | AC 映射 |
|---|---------|------|---------|
| 1 | `VERSION` | 项目唯一版本源 | AC-1 |
| 2 | `scripts/sync_version.sh` | 从 VERSION 同步到 11 个派生位置 | AC-2, AC-3 |
| 3 | `scripts/check_cross_consistency.py` | 跨文档内容一致性检查 | AC-5, AC-9, AC-10, AC-11 |

### 修改文件（20 个）

| # | 文件路径 | 变更内容 | AC 映射 |
|---|---------|---------|---------|
| 4 | `MANIFEST.json` | `looptrain_version` → v0.8.2-version-source | AC-3 |
| 5 | `looptrain/standalone/package.json` | `version` → 0.8.2 | AC-3 |
| 6 | `looptrain/standalone/server.js` | health endpoint version + startup log | AC-3 |
| 7 | `looptrain/standalone/public/app.js` | header comment + LT_RUNTIME_VERSION | AC-3 |
| 8 | `looptrain/standalone/public/audio-manager.js` | header comment | AC-3 |
| 9 | `looptrain/standalone/public/portrait-intro.js` | header comment | AC-3 |
| 10 | `devlog/src/data/site-status.json` | currentVersion → v0.8.2-version-source | AC-3 |
| 11 | `devlog/src/data/site.ts` | 删除 CURRENT_VERSION 和 CURRENT_PHASE | AC-6 |
| 12 | `looptrain/AGENT.md` | §2 版本号 + §4 目录结构 + §13 规则 17-20 | AC-3, AC-10, AC-15 |
| 13 | `scripts/check_release_wrapup.sh` | 第 6 项扩展到 13 个位置 | AC-4 |
| 14 | `README.md`（根） | "SLT 尚未具备"清单移除已完成项 | AC-11 |
| 15 | `PROJECT_STRUCTURE.md` | 移除 TBD/、更新目录结构 | AC-9 |
| 16 | `looptrain/README.md` | "尚未完成"移除内容外置化 | — |
| 17 | `looptrain/standalone/README.md` | "第七节车厢" → "二号车厢" | — |
| 18 | `looptrain/materials/README.md` | 移除沈墨寒/小宁妈妈引用 | — |
| 19 | `devlog/src/content/changelog/v0.8-testplay.md` | 陆成 → 赵乘警修正 | AC-8 |
| 20 | `devlog/src/content/devlog/2026-06-19-v07-v08-goal-content.md` | 陆成 → 赵乘警修正 | AC-8 |
| 21 | `devlog/src/data/roadmap.ts` | 陆成 → 赵乘警修正 | AC-8 |
| 22 | `docs/project/testplay.md` | 全文陆成 → 赵乘警替换 | AC-8 |
| 23 | `docs/project/ARCHITECTURE.md` | 端口 3001 → 3030 | — |

### 可选修改（1 个）

| # | 文件路径 | 变更内容 |
|---|---------|---------|
| 24 | `docs/work/released/LT-20260619-document-workflow/60-devlog-draft.md` | 补充标注 |

---

## 分阶段任务

### 阶段 A: 基础设施（串行）

**A1: 创建 VERSION 文件**
- 文件: `VERSION`
- 内容: `v0.8.2-version-source`
- AC: AC-1

**A2: 创建 sync_version.sh**
- 文件: `scripts/sync_version.sh`
- 依赖: A1
- 逻辑:
  1. 读取 VERSION 文件
  2. 计算 NPM_VERSION（去除 v 前缀和 -slug 后缀）
  3. 对 11 个派生位置执行 sed 替换
  4. 输出修改文件列表
  5. 退出码 0/1
- AC: AC-2

**A3: 执行 sync_version.sh**
- 依赖: A2
- 验证: 11 个文件被正确修改
- AC: AC-3

### 阶段 B: 检查脚本（与 A 并行）

**B1: 扩展 check_release_wrapup.sh**
- 文件: `scripts/check_release_wrapup.sh`
- 修改: 第 6 项"Version consistency"新增 7 个检查位置
- AC: AC-4

**B2: 创建 check_cross_consistency.py**
- 文件: `scripts/check_cross_consistency.py`
- 5 项检查
- AC: AC-5, AC-9, AC-10, AC-11

### 阶段 C: 文档修复（依赖 A3，C 内部可并行）

**C1: site.ts 死代码清理** — AC-6
**C2: 陆成 → 赵乘警修正（4 文件）** — AC-8
**C3: 文档结构过期修复（7 文件）** — AC-9, AC-10, AC-11

### 阶段 D: AGENT.md 规则更新（依赖 C3）

**D1: 新增规则 17-20** — AC-15

### 阶段 E: 验证（依赖所有前序阶段）

**E1: 运行所有检查脚本** — AC-4, AC-5, AC-7, AC-12, AC-13, AC-14, AC-16
**E2: 手动验证 13 个版本号位置** — AC-3

---

## 任务并行化策略

```
阶段 A (VERSION + sync_version.sh) ──┐
                                      ├──→ 阶段 C (文档修复，3 路并行) ──→ 阶段 D (规则) ──→ 阶段 E (验证)
阶段 B (检查脚本，2 路并行) ──────────┘
```

---

## 回滚方案

1. `git stash` 或 `git revert` 本次所有修改
2. VERSION 文件可安全删除
3. 新增脚本可安全删除
4. check_release_wrapup.sh 的修改可通过 git revert 回滚

---

## 测试计划

### 手动验证步骤（对应 16 条 AC）

1. `cat VERSION` → 输出 `v0.8.2-version-source` [AC-1]
2. `bash scripts/sync_version.sh` → 退出码 0 [AC-2]
3. 逐一检查 13 个位置版本号 [AC-3]
4. `bash scripts/check_release_wrapup.sh LT-20260621-version-source-and-check-coverage` 第 6 项 [AC-4]
5. `python3 scripts/check_cross_consistency.py` → 5 项检查 [AC-5]
6. `grep -E "CURRENT_VERSION|CURRENT_PHASE" devlog/src/data/site.ts` → 无输出 [AC-6]
7. `cd devlog && npm run build` → 退出码 0 [AC-7]
8. `grep -r "陆成" devlog/src/ docs/project/` → 无输出 [AC-8]
9-11. check_cross_consistency.py 检查 1-3 [AC-9, AC-10, AC-11]
12. `python3 scripts/check_docs_governance.py` → 退出码 0 [AC-12]
13. `bash scripts/check_project_docs.sh` → 退出码 0 [AC-13]
14. `bash scripts/verify_slt.sh` → 退出码 0 [AC-14]
15. `grep -c "规则 17\|规则 18\|规则 19\|规则 20" looptrain/AGENT.md` → 4 [AC-15]
16. 所有检查脚本 PASS [AC-16]
