# LoopTrain 部署总览

一份文档了解如何部署整个 LoopTrain 项目（Devlog + 游戏运行时）。

---

## 线上环境一览

| 项目 | 线上地址 | 服务器 | 部署方式 |
|------|---------|--------|---------|
| Devlog | `https://looptrain.me/` | <SERVER_IP> | rsync 静态站 |
| LT 游戏 | `https://looptrain.me/play/game` | <SERVER_IP> | Node + pm2 + nginx 反代 |

**服务器**：Alibaba Cloud ECS Ubuntu 22.04，root 用户，需密码登录。

**详细文档**：

| 文档 | 内容 |
|------|------|
| [`looptrain/docs/DEPLOY.md`](looptrain/docs/DEPLOY.md) | LT Standalone 部署（代码上传、.env、pm2、运维） |
| [`devlog/docs/DEPLOY.md`](devlog/docs/DEPLOY.md) | Devlog 部署（构建、rsync、符号链接切换） |
| [`devlog/nginx/looptrain.me.conf`](devlog/nginx/looptrain.me.conf) | 线上 nginx 完整配置 |

---

## 快速部署（全量）

```bash
# 1. Devlog
cd devlog && npm run build && npx astro check
TS=$(date +%Y%m%d%H%M%S)
rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' dist/ <USER>@<SERVER_IP>:/var/www/looptrain-devlog/releases/$TS/
ssh <USER>@<SERVER_IP> "ln -sfn /var/www/looptrain-devlog/releases/$TS /var/www/looptrain-devlog/current"

# 2. LT 游戏
rsync -avz --exclude node_modules --exclude tests --exclude .env -e 'ssh -o StrictHostKeyChecking=no' looptrain/standalone/ <USER>@<SERVER_IP>:/var/www/looptrain-standalone/
ssh <USER>@<SERVER_IP> "pm2 restart looptrain-standalone"

# 3. 验证
curl -s -o /dev/null -w "%{http_code}\n" https://looptrain.me/
curl -s -o /dev/null -w "%{http_code}\n" https://looptrain.me/play/game
curl -s https://looptrain.me/api/health
```

---

## 首次部署（从零开始）

### Devlog

```bash
cd devlog
npm install
npm run build
# 然后参考 devlog/docs/DEPLOY.md 第 2 节上传
```

VPS 上需先创建目录：

```bash
ssh <USER>@<SERVER_IP> "mkdir -p /var/www/looptrain-devlog/releases"
```

### LT 游戏

```bash
# 上传代码
rsync -avz --exclude node_modules --exclude tests -e 'ssh -o StrictHostKeyChecking=no' looptrain/standalone/ <USER>@<SERVER_IP>:/var/www/looptrain-standalone/

# 安装依赖 + 配置 + 启动
ssh <USER>@<SERVER_IP> "
  cd /var/www/looptrain-standalone &&
  npm install --production &&
  pm2 start server.js --name looptrain-standalone
"
```

### nginx

```bash
scp devlog/nginx/looptrain.me.conf <USER>@<SERVER_IP>:/etc/nginx/sites-enabled/looptrain
ssh <USER>@<SERVER_IP> "nginx -t && nginx -s reload"
```

---

## 运维速查

```bash
# 服务状态
ssh <USER>@<SERVER_IP> "pm2 list"

# 游戏健康
curl -s https://looptrain.me/api/health
curl -s https://looptrain.me/api/config  # LLM 状态

# 游戏重启
ssh <USER>@<SERVER_IP> "pm2 restart looptrain-standalone"

# nginx 重载（修改配置后）
scp devlog/nginx/looptrain.me.conf <USER>@<SERVER_IP>:/etc/nginx/sites-enabled/looptrain
ssh <USER>@<SERVER_IP> "nginx -t && nginx -s reload"

# 回滚 Devlog
ssh <USER>@<SERVER_IP> "ln -sfn /var/www/looptrain-devlog/releases/<旧时间戳> /var/www/looptrain-devlog/current"

# 本地验证（部署前必跑）
bash scripts/verify_slt.sh
```
