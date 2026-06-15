# LoopTrain Devlog 部署文档

## 概述

Devlog 是 Astro 静态站点，构建产物为纯 HTML/CSS/JS。

- **线上地址**：`https://looptrain.me`
- **服务器**：Alibaba Cloud ECS `<SERVER_IP>`（root 用户）
- **部署路径**：`/var/www/looptrain-devlog/`
- **部署方式**：rsync + 符号链接（`current → releases/<timestamp>`）

---

## 1. 构建

```bash
cd devlog
npm install
npm run build          # 输出到 dist/
npx astro check        # 类型检查
```

---

## 2. 部署

```bash
bash scripts/deploy_devlog.sh
```

该脚本会先 fetch 当前 upstream，若本地分支落后远端则拒绝部署，避免 `rsync --delete` 删除远端已有但本地缺失的文章。脚本通过检查后才会构建、上传 `dist/` 到新 release，并原子切换 `current` 符号链接。

旧版本保留在 `/var/www/looptrain-devlog/releases/`，可按需清理。

---

## 3. 验证

```bash
# 版本号
curl -s https://looptrain.me/ | grep -o 'v[0-9.]*[^"]*'

# 关键页面
curl -s -o /dev/null -w "%{http_code}\n" https://looptrain.me/
curl -s -o /dev/null -w "%{http_code}\n" https://looptrain.me/changelog/v0.5.0-standalone/
curl -s -o /dev/null -w "%{http_code}\n" https://looptrain.me/devlog/
```

全部应返回 `200`。

---

## 4. nginx 配置

线上完整配置文件：`devlog/nginx/looptrain.me.conf`  
VPS 上路径：`/etc/nginx/sites-enabled/looptrain`

关键路由（当前实际状态）：

| 路径 | 行为 |
|------|------|
| `/` | 静态站点（`/var/www/looptrain-devlog/current`） |
| `/play/game` | 代理到 SLT `http://127.0.0.1:3030/`（游戏入口） |
| `/style.css`、`/app.js` | SLT 静态文件 → `http://127.0.0.1:3030` |
| `/api/` | SLT 游戏 API → `http://127.0.0.1:3030` |
| `/assets/` | SLT 立绘/背景 → `http://127.0.0.1:3030` |
| `/?looptrain=game` | ST 旧版兼容（仍在 `http://127.0.0.1:8000`） |

更新 nginx：

```bash
scp devlog/nginx/looptrain.me.conf <USER>@<SERVER_IP>:/etc/nginx/sites-enabled/looptrain
ssh <USER>@<SERVER_IP> "nginx -t && nginx -s reload"
```

> LT standalone 的完整部署文档：`looptrain/docs/DEPLOY.md`

---

## 5. 回滚

```bash
# 查看所有发布版本
ssh <USER>@<SERVER_IP> "ls /var/www/looptrain-devlog/releases/"

# 回滚到上一个版本（例）
ssh <USER>@<SERVER_IP> "ln -sfn /var/www/looptrain-devlog/releases/20260613120104 /var/www/looptrain-devlog/current"
```

无需 reload nginx（符号链接切换是原子的）。

---

## 6. 常见问题

**Q: 新 devlog 条目不显示？**

确认 frontmatter 包含必填字段：`title`, `date`, `version`, `status`, `tags`, `summary`。

**Q: 部署后页面空白？**

先跑 `npx astro check`，确认无类型错误。再检查 `dist/` 目录是否有 `index.html`。
