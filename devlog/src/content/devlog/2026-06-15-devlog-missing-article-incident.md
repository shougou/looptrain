---
title: "一次 Devlog 文章丢失事故：本地分支落后远端时不要部署"
date: "2026-06-15T16:49:48+08:00"
version: "v0.5.0-standalone"
status: "done"
tags:
  - 工程实践
  - 文档治理
  - 部署复盘
summary: "记录一次真实的 Devlog 文章丢失事故：Narrative State Runtime 文章存在于远端分支和旧线上 release，但本地未同步远端更新，后续部署时被 rsync --delete 从当前线上版本中移除。"
---

今天发现一个很具体的问题：

```text
https://looptrain.me/devlog/narrative-state-runtime/
```

这个页面本来应该显示《Narrative State Runtime：LoopTrain 的记忆系统设计》。但线上访问时，页面没有显示这篇文章，而是落到了站点首页。

这不是内容渲染的小问题。它暴露的是一个更危险的问题：**静态站部署时，如果本地不是远端最新状态，`rsync --delete` 会忠实地把远端已有、但本地缺失的页面删掉。**

## 现象

缺失的是这篇文章：

```text
devlog/src/content/devlog/2026-06-15-narrative-state-runtime.md
```

线上曾经有对应页面：

```text
/devlog/narrative-state-runtime/
```

但当前线上版本里没有它。访问 URL 时返回 `200`，但那不是文章页，而是 Astro 静态站的 fallback 页面。

第一反应很容易误判：是不是 Astro collection 没有加载？是不是 slug 生成错了？是不是 nginx 配置把路由吃掉了？

实际都不是。

## 排查过程

先看旧线上 release。

服务器上还保留了历史发布目录：

```text
/var/www/looptrain-devlog/releases/
```

在旧 release 里找到了文章产物：

```text
/var/www/looptrain-devlog/releases/20260615133435/devlog/narrative-state-runtime/index.html
```

这说明文章确实发布过，不是记忆错误。

再看当前线上 release：

```text
/var/www/looptrain-devlog/current
→ /var/www/looptrain-devlog/releases/20260615161002
```

当前 release 里没有：

```text
devlog/narrative-state-runtime/index.html
```

于是问题缩小到：旧 release 有，新 release 没有。

接着查本地仓库。最初本地 `origin/lt-standalone-mvp` 停在旧 commit：

```text
f51b867 Devlog 内容: 增加 LoopTrain 长期规划
```

但 GitHub 远端实际已经多了一个 commit：

```text
bc44398 Devlog 内容: 增加 Narrative State Runtime 设计
```

这个 commit 里正好包含：

```text
devlog/src/content/devlog/2026-06-15-narrative-state-runtime.md
```

也就是说，本地不是缺文件，而是**本地远端引用过期**，并且本地分支和远端分支已经分叉。

分叉状态是：

```text
共同祖先 f51b867
├── 远端：bc44398  增加 Narrative State Runtime 文章
└── 本地：5 个文档治理 commit
```

本地后续基于旧状态继续构建并发布 Devlog。因为本地没有那篇文章，所以 `dist/` 里也没有它。

部署命令使用：

```bash
rsync -avz --delete dist/ root@server:/var/www/looptrain-devlog/releases/<timestamp>/
ln -sfn releases/<timestamp> current
```

`rsync --delete` 没有做错。它只是严格同步本地 `dist/`。问题是本地 `dist/` 本身就是不完整的。

## 根因

根因不是 Astro，也不是 nginx，也不是 git clone 漏文件。

根因是：

> 发布前没有确认本地分支是否落后远端，导致用一个缺少远端文章的本地构建产物覆盖了线上 current release。

更具体地说：

1. 远端分支已经有 `bc44398`，新增 Narrative State Runtime 文章。
2. 本地没有 fetch/merge 这个 commit。
3. 本地继续做文档治理并构建 Devlog。
4. 新构建产物缺少 `narrative-state-runtime` 页面。
5. 部署时 `rsync --delete` 把这个缺失状态同步到了新 release。
6. `current` 切换后，线上文章消失。

## 修复

修复分两步。

第一步，把远端 commit 合回本地：

```bash
git fetch origin lt-standalone-mvp
git merge origin/lt-standalone-mvp
```

合并后，本地恢复：

```text
devlog/src/content/devlog/2026-06-15-narrative-state-runtime.md
```

重新构建后，`dist/` 中出现：

```text
dist/devlog/narrative-state-runtime/index.html
```

第二步，补一个受保护部署脚本：

```text
scripts/deploy_devlog.sh
```

以后发布 Devlog 不再直接手写 `rsync`，而是运行：

```bash
bash scripts/deploy_devlog.sh
```

这个脚本会先做几件事：

1. 检查当前分支是否有 upstream。
2. fetch 当前远端分支。
3. 如果本地落后远端，拒绝部署。
4. 如果 tracked 工作区有未提交变更，拒绝部署。
5. 运行文档治理检查器。
6. 运行 Astro build/check。
7. 全部通过后才 rsync 到新 release，并切换 `current`。

核心保护在这里：

```bash
BEHIND="$(git -C "$ROOT_DIR" rev-list --count "HEAD..$UPSTREAM")"
if [ "$BEHIND" != "0" ]; then
  echo "ERROR: local branch is behind $UPSTREAM by $BEHIND commit(s)." >&2
  echo "Fetch/merge/rebase before deploying, otherwise rsync --delete may remove remote-only articles." >&2
  exit 1
fi
```

这不是复杂 CI，只是一个小闸门。但它挡住了这次事故的根因。

## 验证

修复后重新发布，线上验证通过：

```text
200 https://looptrain.me/devlog/narrative-state-runtime/
```

并确认页面包含：

```text
Narrative State Runtime
```

同时新增的正式文档区也正常：

```text
/design/
/technical/
/decisions/
```

本地检查：

```bash
python3 scripts/check_docs_governance.py
npm run build
npx astro check
```

结果：

```text
0 errors
0 warnings
0 hints
```

## 这次事故留下的规则

以后发布 Devlog，不能再直接执行裸 `rsync --delete`。

必须先回答三个问题：

```text
本地是否落后远端？
本地 tracked 工作区是否干净？
本地 dist 是否由当前完整源码构建？
```

如果任意一个答案不确定，就不能发布。

这次问题不大，只丢了一篇文章，而且旧 release 还在，可以恢复。但它提醒我：静态站部署看起来简单，真正危险的是它太忠实。你给它什么 `dist/`，它就把什么变成线上事实。

所以，部署不是上传文件。部署是把当前本地事实宣布为线上事实。

如果本地事实不完整，线上也会不完整。
