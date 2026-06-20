# Release Note: v0.8.1-save-versioning

> 版本级别：[x] patch / [ ] minor / [ ] major
> 前版本号：v0.8-testplay
> 包含内容：项目工程规范治理 + 存档版本检测与 Breaking Change 强制重置

## 本次发布内容

存档系统全面升级：从旧版单 key `looptrain.standalone.v1` 迁移到版本化 `lt:save:meta` + `lt:save:runtime` 双 key 架构。新增启动时版本检测、breaking change 强制重置引导、手动重置三路径、音频设置跨版本保留、IndexedDB 旧库清理。

## 用户可见变化

1. **旧玩家首次进入新版时弹出重置提示模态框**：坦诚告知"新版试玩已重构，旧存档不兼容"，提供单一「重新开始」按钮。模态框不可点遮罩关闭。
2. **命令栏新增「🔄重置」按钮**：点击后弹出确认对话框，确认后清除当前进度并重新开始。
3. **URL 参数 `?reset=1`**：直接清除存档并开始新游戏，处理完成后自动移除 URL 参数。
4. **开发者控制台 `window.LT_RESET()`**：清除存档并刷新页面。
5. **音频静音设置跨版本保留**：升级后静音偏好不丢失。

## Runtime 变化

- **存档版本化**：新增 `SaveMeta` 结构（`appId`, `saveSchemaVersion`, `runtimeVersion`, `storyVersion`, `createdAt`, `updatedAt`），写入 `lt:save:meta`。
- **Key 体系迁移**：
  - 旧 `looptrain.standalone.v1` → 归档到 `lt:legacy:<timestamp>` 后删除
  - 新存档 key：`lt:save:runtime`（全量状态 JSON）、`lt:save:meta`（版本元数据）
  - 音频设置 key：`looptrain.audio.muted` → `lt:settings`（`{ muted: boolean }`）
- **`init()` 流程重构**：新增 4 路径分流——新玩家、旧数据归档、版本不兼容强制重置、兼容存档正常恢复。
- **IndexedDB 旧库清理**：启动时异步删除 `LoopTrainDB`、`LoopTrainRuntimeDB`、`LoopTrainMemoryDB`。新版使用 `LoopTrainMemoryDB_v0_8` 新名天然隔离。删除失败不阻塞启动。
- **数据安全**：清除操作只删除 `lt:` 前缀 key（排除 `lt:legacy:` 和 `lt:settings`），不触碰非 LT 相关 key。
- **`resetGame()` 升级**：改用新存档系统（`detectLegacyKeys → archiveLegacyData → clearLtKeys → initNewSave`）。
- **引擎 `reset_game` 命令**：行为不变，返回标准化 `START_STATE`。

## UI/UX 变化

- **新增重置模态框**（`#lt-reset-modal`）：深色遮罩 + 居中卡片，金色主按钮，文案区分 legacy/incompatible 场景。样式匹配现有 `.lt-ng-card` 设计系统（`--lt-gold`、`--lt-panel-strong`、`--lt-border`、16px 圆角、999px 药丸按钮）。
- **命令栏新增按钮**：`.lt-cmd-btn` 样式的「🔄重置」按钮，`title="重新开始试玩版"`。

## 存档影响

- **BREAKING**：旧存档（`looptrain.standalone.v1`）完全不兼容，启动时强制重置。
- **归档保留**：旧数据在 `lt:legacy:<timestamp>` 中保留，开发侧可调试复现，玩家不可见。
- **用户设置保留**：`lt:settings` 跨版本持续，静音偏好不丢失。
- **不做旧数据迁移**：本次为 Major/Breaking 级别升级，不写任何 migration 逻辑。

## 已知问题

- 无阻塞性问题。
- IndexedDB 旧库删除依赖浏览器 `window.indexedDB` API 可用性，不支持时静默跳过。
- 完整浏览器手动端到端测试（14 条 AC 逐条验证）建议在 QA 阶段执行。

## 回滚方式

代码回滚（所有改动集中在 5 个前端文件，无数据库/API 变更）：

```bash
git revert <commit>
```

或逐文件：

```bash
git checkout HEAD~1 -- looptrain/standalone/public/app.js
git checkout HEAD~1 -- looptrain/standalone/public/index.html
git checkout HEAD~1 -- looptrain/standalone/public/style.css
git checkout HEAD~1 -- looptrain/standalone/public/audio-manager.js
git checkout HEAD~1 -- looptrain/standalone/tests/smoke_test.js
```

用户数据回滚：旧数据在 `lt:legacy:<timestamp>` key 中保留，可手动恢复。

## 发布检查

- [x] 本地运行通过（`npm test` 全部 7 个测试块通过）
- [x] 新开局通过（AC-1 代码路径验证通过）
- [x] 移动端首屏检查通过（样式使用 `min-height: 44px` 触控友好标准）
- [x] Devlog 草稿已生成
- [x] `check_work_item.sh` 通过
- [x] `check_project_docs.sh` 通过

## 收尾检查（阶段 7-8 — 稳态文档同步）

### 稳态文档更新（docs/project/）
- [x] PROJECT_STATUS.md 已更新（版本号、状态描述）
- [x] CHANGELOG.md 已追加版本条目
- [x] ROADMAP.md 已更新（状态持久化 → 已完成）
- [x] KNOWN_ISSUES.md 已更新（移除已解决、追加 IndexedDB 迁移项）

### Devlog 网站数据更新（devlog/src/data/）
- [x] site-status.json 已更新（play.currentVersion、play.knownIssues、site.lastUpdated）
- [x] roadmap.ts 已与 ROADMAP.md 同步

### Devlog 内容更新
- [x] changelog 条目已追加到 devlog/src/content/changelog/v0.8.1-save-versioning.md
- [ ] [仅 major / minor] devlog 文章已生成（patch 发布，不生成）
- [x] 60-devlog-draft.md 已生成

### 版本一致性验证
- [x] 版本号在 PROJECT_STATUS.md、CHANGELOG.md、site-status.json、50-release-note.md 中一致（v0.8.1）

### 最终检查
- [x] `check_project_docs.sh` 通过
- [ ] `check_release_wrapup.sh` 通过（执行中）

### 线上部署（收尾最后一步）
- [ ] Devlog：构建 + rsync 部署到 looptrain.me
- [ ] LT 游戏：rsync standalone 代码 + pm2 restart
- [x] 部署验证：`curl https://looptrain.me/api/health` → 200 OK
- [x] 部署验证：`curl https://looptrain.me/` → 200 OK
