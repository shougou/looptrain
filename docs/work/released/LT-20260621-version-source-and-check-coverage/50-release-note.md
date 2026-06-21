# 50-release-note.md — 发布说明

**Work Item**: LT-20260621-version-source-and-check-coverage  
**版本级别**: [x] patch  [ ] minor  [ ] major  
**版本号**: v0.8.2-version-source  
**发布日期**: 2026-06-21

## 发布摘要

建立版本号单一源（VERSION 文件）+ 自动化同步（sync_version.sh）+ 全覆盖检查（扩展 check_release_wrapup.sh + 新增 check_cross_consistency.py），修复 23 处文档不一致，新增 Agent 强制规则 17-20。

## 新增

- `VERSION` — 项目唯一版本源
- `scripts/sync_version.sh` — 从 VERSION 自动同步到 11 个派生位置
- `scripts/check_cross_consistency.py` — 5 项跨文档一致性检查

## 变更

- `scripts/check_release_wrapup.sh` — §6 版本一致性从 4 个位置扩展到 13 个
- `looptrain/AGENT.md` — §4 目录结构更新 + §13.4-§13.7 新增规则 17-20
- `MANIFEST.json` — `looptrain_version` → v0.8.2-version-source
- `looptrain/standalone/package.json` — `version` → 0.8.2
- 所有代码文件版本号统一为 v0.8.2-version-source

## 修复（23 处不一致）

- 版本号不一致 9 处（sync_version.sh 自动修复）
- 陆成→赵乘警修正 4 处（changelog/devlog/roadmap/testplay 公开展示层）
- 文档结构过期 7 处（README/PROJECT_STRUCTURE/AGENT.md/ARCHITECTURE.md）
- site.ts 死代码删除（CURRENT_VERSION/CURRENT_PHASE）
- 缺失文档标注 1 处

## 存档影响

无 — 规范类 work item，不影响存档格式。

## 回滚方式

```bash
git revert <commit_hash>
```

## 发布检查

- [x] 代码变更完成
- [x] 所有检查脚本 PASS
- [x] devlog 构建成功（38 pages）
- [x] 版本号 13 个位置一致

---

## 收尾检查

- [ ] 更新 PROJECT_STATUS.md
- [ ] 更新 CHANGELOG.md
- [ ] 更新 ROADMAP.md
- [ ] 更新 KNOWN_ISSUES.md
- [ ] 同步 site-status.json
- [ ] 同步 roadmap.ts
- [ ] 追加 devlog changelog 条目
- [ ] 生成 devlog 文章（规则 14 例外 — 工程规范类）
- [ ] 运行 check_release_wrapup.sh
- [ ] 移动到 released/
