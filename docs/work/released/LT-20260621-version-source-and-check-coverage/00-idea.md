---
status: accepted
type: engineering-governance
topic: version-source-single-source-of-truth-and-check-coverage
created: 2026-06-21T11:30:00+08:00
updated: 2026-06-21T11:30:00+08:00
---

# LT-20260621 — 版本号单一源 + 检查脚本全覆盖

## 背景

### 问题发现

本次项目全面分析发现：**3 个检查脚本（check_docs_governance.py / check_project_docs.sh / check_release_wrapup.sh）全部 PASS，但实际存在 23 处文档不一致**。

根本原因：检查脚本的覆盖范围严重不足。

- 版本号存储位置共 **13 处**，检查脚本只覆盖 **3 处**（PROJECT_STATUS / CHANGELOG / site-status.json）
- **6 处版本号不一致未被发现**：MANIFEST.json、package.json、server.js、app.js、audio-manager.js、portrait-intro.js、site.ts、AGENT.md
- **内容声明不一致**：changelog 声称"陆成替代赵乘警"但代码仍是 `zhao_police.json`
- **文档结构过期**：PROJECT_STRUCTURE.md 引用不存在的 TBD/ 目录，looptrain/AGENT.md 目录结构列出不存在的文件

### 根本原因分析

问题的本质不是"开发者忘记更新文档"，而是：

1. **事实源清单不完整**：规范没有列出完整的事实源清单（哪些文件存储版本号）
2. **跨源一致性检查缺失**：检查脚本只覆盖了规范列出的事实源（4 个），不是实际存在的事实源（13 个）
3. **代码内嵌版本号无同步机制**：app.js / audio-manager.js / portrait-intro.js / server.js 版本号各自独立，无人更新也无人检查
4. **MANIFEST.json 是孤儿**：项目第二高优先级事实源从未被任何脚本检查
5. **site.ts vs site-status.json 重复**：两个文件都声明版本号，无同步机制

## 用户决策（2026-06-21）

1. **版本源方案**：采用方案 A — 建立 VERSION 文件作为唯一版本源，所有其他位置从此文件读取或同步
2. **陆成 vs 赵乘警**：废弃陆成，仍采用赵乘警 — 修复 changelog/devlog/roadmap.ts 中的错误声明
3. **启动时机**：立即启动 P0 Work Item
4. **site.ts 处理**：删除 `CURRENT_VERSION` 常量，改从 site-status.json 导入

## 目标

### 核心目标

建立版本号单一源 + 自动化同步 + 全覆盖检查，从工程化手段消除版本号不一致，避免依赖人工保持一致。

### 具体目标

1. 建立 `VERSION` 文件作为项目唯一版本源
2. 新增 `scripts/sync_version.sh`：从 VERSION 文件读取版本号，自动写入所有派生位置
3. 扩展 `check_release_wrapup.sh`：覆盖全部 13 个版本号位置的一致性检查
4. 新增 `scripts/check_cross_consistency.py`：检查跨文档内容一致性（README/AGENT.md/PROJECT_STRUCTURE.md 与稳态文档）
5. 修复当前 23 处不一致
6. 更新 `looptrain/AGENT.md` 强制规则：新增规则 17-20
7. 走完整 8 阶段 Work Item 流程，作为新规范的首次实践

## 非目标

1. 不建立自动化回滚系统
2. 不改造稳态文档的手动更新流程（仍由 Agent 逐文件更新）
3. 不引入新的文档系统或工具链
4. 不修改游戏逻辑、前端交互、LLM Bridge
5. 不处理 ROADMAP 中的其他待办（LLM Bridge / Playwright / IndexedDB）

## 初步设计

### VERSION 文件格式

```
# /home/shougou/11_looptrain/VERSION
v0.8.2-version-source
```

单行文本，无换行，格式为 `v<major>.<minor>.<patch>-<slug>`。

### 版本号派生位置清单（13 处）

| # | 文件 | 字段/位置 | 同步方式 |
|---|------|----------|---------|
| 1 | `VERSION` | 整个文件 | 唯一源（人工编辑） |
| 2 | `MANIFEST.json` | `looptrain_version` | sync_version.sh |
| 3 | `looptrain/standalone/package.json` | `version` | sync_version.sh |
| 4 | `looptrain/standalone/server.js` | health endpoint `version` 字段 | sync_version.sh |
| 5 | `looptrain/standalone/server.js` | startup log | sync_version.sh |
| 6 | `looptrain/standalone/public/app.js` | header comment | sync_version.sh |
| 7 | `looptrain/standalone/public/app.js` | `LT_RUNTIME_VERSION` 常量 | sync_version.sh |
| 8 | `looptrain/standalone/public/audio-manager.js` | header comment | sync_version.sh |
| 9 | `looptrain/standalone/public/portrait-intro.js` | header comment | sync_version.sh |
| 10 | `docs/project/PROJECT_STATUS.md` | 版本号 | 人工 + 检查 |
| 11 | `docs/project/CHANGELOG.md` | 最新条目 | 人工 + 检查 |
| 12 | `devlog/src/data/site-status.json` | `currentVersion` | sync_version.sh |
| 13 | `looptrain/AGENT.md` | §2 当前版本 | sync_version.sh |

**删除**：`devlog/src/data/site.ts` 的 `CURRENT_VERSION` 常量（改从 site-status.json 导入）

### sync_version.sh 工作流程

1. 读取 `VERSION` 文件
2. 对每个派生位置执行 sed/替换操作
3. 输出修改的文件列表
4. 退出码 0 = 全部成功，非 0 = 有失败

### check_release_wrapup.sh 扩展

在现有第 6 项"Version consistency"中，新增检查：
- `MANIFEST.json` 的 `looptrain_version`
- `standalone/package.json` 的 `version`
- `standalone/server.js` health endpoint（需启动服务器或静态扫描）
- `standalone/public/app.js` 的 `LT_RUNTIME_VERSION`
- `devlog/src/data/site.ts`（已删除 CURRENT_VERSION，改为检查不存在的常量）
- `looptrain/AGENT.md` 声称的版本号
- `VERSION` 文件本身

### check_cross_consistency.py 新增

检查项：
1. `PROJECT_STRUCTURE.md` 引用的目录是否实际存在
2. `looptrain/AGENT.md` §4 目录结构列出的文件是否实际存在
3. 根 `README.md` 的"SLT 已经具备/尚未具备"清单是否与 PROJECT_STATUS 一致
4. `changelog` 的"Removed"章节中声明的 ID 是否仍在代码中（如 `shen_mohan`）
5. `changelog` 的"Added"章节中声明的新 ID 是否确实存在

### AGENT.md 规则扩展

- **规则 17**：版本号唯一源。`VERSION` 文件是项目唯一版本源，所有其他位置必须从此同步。`scripts/sync_version.sh` 在收尾阶段 7 必须执行。
- **规则 18**：收尾检查全覆盖。`check_release_wrapup.sh` 必须验证全部 13 个版本号位置一致，新增版本号位置时同步更新检查脚本。
- **规则 19**：文档结构变更必须同步 PROJECT_STRUCTURE.md。任何目录增删必须同步更新 PROJECT_STRUCTURE.md，`check_cross_consistency.py` 验证引用目录存在。
- **规则 20**：changelog 声称的变更必须可验证落地。`check_cross_consistency.py` 解析 changelog 的 Added/Removed 章节，验证代码实际状态。

## 影响范围

### 修改文件清单（初步）

**新增**：
- `VERSION`
- `scripts/sync_version.sh`
- `scripts/check_cross_consistency.py`

**修改**：
- `MANIFEST.json`
- `looptrain/standalone/package.json`
- `looptrain/standalone/server.js`
- `looptrain/standalone/public/app.js`
- `looptrain/standalone/public/audio-manager.js`
- `looptrain/standalone/public/portrait-intro.js`
- `devlog/src/data/site-status.json`
- `devlog/src/data/site.ts`
- `looptrain/AGENT.md`
- `scripts/check_release_wrapup.sh`
- 根 `README.md`
- `PROJECT_STRUCTURE.md`
- `looptrain/README.md`
- `looptrain/standalone/README.md`
- `looptrain/materials/README.md`
- `devlog/src/content/changelog/v0.8-testplay.md`（陆成→赵乘警修正）
- `devlog/src/content/devlog/2026-06-19-v07-v08-goal-content.md`（陆成→赵乘警修正）
- `devlog/src/data/roadmap.ts`（陆成→赵乘警修正）
- `docs/project/ARCHITECTURE.md`（端口 3001→3030）

### 不受影响

- 游戏逻辑（engine.js）
- 前端交互（除版本号外不修改 app.js 逻辑）
- LLM Bridge
- 部署配置
- 游戏内容数据（materials/runtime/）

## 版本级别

patch — 基础设施/规范类 work item

按规则 14 例外：工程规范类 work item 即使 patch 也生成 devlog 文章。

版本号：`v0.8.2-version-source`
