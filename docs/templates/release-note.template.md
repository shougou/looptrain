# Release Note: v0.X.Y

> 版本级别：[ ] patch / [ ] minor / [ ] major
> 前版本号：v0.X.Y

## 本次发布内容
## 用户可见变化
## Runtime 变化
## UI/UX 变化
## 存档影响
## 已知问题
## 回滚方式

## 发布检查（阶段 6）

- [ ] 本地运行通过
- [ ] 新开局通过
- [ ] 移动端首屏检查通过
- [ ] `check_work_item.sh` 通过

## 收尾检查（阶段 7-8 — 稳态文档同步）

### 稳态文档更新（docs/project/）
- [ ] PROJECT_STATUS.md 已更新（版本号、状态描述）
- [ ] CHANGELOG.md 已追加版本条目
- [ ] ROADMAP.md 已更新（标记完成/添加任务）
- [ ] KNOWN_ISSUES.md 已更新（移除已解决/追加新问题）

### Devlog 网站数据更新（devlog/src/data/）
- [ ] site-status.json 已更新（play.currentVersion、play.knownIssues、site.lastUpdated）
- [ ] roadmap.ts 已与 ROADMAP.md 同步

### Devlog 内容更新
- [ ] changelog 条目已追加到 devlog/src/content/changelog/
- [ ] [仅 major / minor] devlog 文章已生成到 devlog/src/content/devlog/
- [ ] 60-devlog-draft.md 已生成

### 版本一致性验证
- [ ] 版本号在 PROJECT_STATUS.md、CHANGELOG.md、site-status.json、50-release-note.md 中一致

### 最终检查
- [ ] `check_project_docs.sh` 通过
- [ ] `check_release_wrapup.sh` 通过
- [ ] work item 已从 active/ 移动到 released/

### 线上部署（收尾最后一步）
- [ ] Devlog：构建 + rsync 部署到 looptrain.me
- [ ] LT 游戏：rsync standalone 代码 + pm2 restart
- [ ] 部署验证：`curl https://looptrain.me/api/health` → 200 OK
- [ ] 部署验证：`curl https://looptrain.me/play/game` → 200 OK
