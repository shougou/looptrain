# LoopTrain Standalone 部署文档

> **注意**: 服务器地址和用户名已移至 `.env.deploy`（不入 git）。复制 `.env.deploy.example` 填入真实值。下文 `<SERVER_IP>` 和 `<USER>` 为占位符。

## 概述

LoopTrain Standalone (SLT) 是独立 Node.js 游戏运行时，不依赖 SillyTavern。

- **服务器**：Alibaba Cloud ECS `<SERVER_IP>`（root 用户）
- **部署路径**：`/var/www/looptrain-standalone/`
- **进程管理**：pm2（进程名 `looptrain-standalone`）
- **端口**：`127.0.0.1:3030`（仅本地监听，由 nginx 反向代理对外）

---

## 1. 首次部署

```bash
# 上传代码（从项目根目录）
rsync -avz --exclude node_modules --exclude tests \
  -e 'ssh -o StrictHostKeyChecking=no' \
  looptrain/standalone/ <USER>@<SERVER_IP>:/var/www/looptrain-standalone/

# 安装依赖
ssh <USER>@<SERVER_IP> "cd /var/www/looptrain-standalone && npm install --production"

# 创建 .env（LLM 配置，不提交到 git）
cat > /tmp/lt-env << 'EOF'
LLM_ENABLED=true
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-pro
LLM_MAX_TOKENS=512
LLM_TEMPERATURE=0.7
PORT=3030
EOF
scp /tmp/lt-env <USER>@<SERVER_IP>:/var/www/looptrain-standalone/.env
rm /tmp/lt-env

# 语法检查
ssh <USER>@<SERVER_IP> "cd /var/www/looptrain-standalone && node --check server.js && node --check engine.js"

# 启动
ssh <USER>@<SERVER_IP> "cd /var/www/looptrain-standalone && pm2 start server.js --name looptrain-standalone"
```

---

## 2. 更新部署（代码变更后）

```bash
# 上传并重启
rsync -avz --exclude node_modules --exclude tests --exclude .env \
  -e 'ssh -o StrictHostKeyChecking=no' \
  looptrain/standalone/ <USER>@<SERVER_IP>:/var/www/looptrain-standalone/
ssh <USER>@<SERVER_IP> "pm2 restart looptrain-standalone"
```

如果只改了某个前端文件（`public/app.js`、`public/style.css`、`public/index.html`），可以只上传该文件：

```bash
scp looptrain/standalone/public/app.js <USER>@<SERVER_IP>:/var/www/looptrain-standalone/public/
ssh <USER>@<SERVER_IP> "pm2 restart looptrain-standalone"
```

---

## 3. 日常运维

```bash
# 查看状态
ssh <USER>@<SERVER_IP> "pm2 list"

# 查看日志
ssh <USER>@<SERVER_IP> "pm2 logs looptrain-standalone --lines 30"

# 重启
ssh <USER>@<SERVER_IP> "pm2 restart looptrain-standalone"

# 停止
ssh <USER>@<SERVER_IP> "pm2 stop looptrain-standalone"

# 健康检查
curl -s https://looptrain.me/api/health
# → {"ok":true,"engine":"looptrain","version":"0.5-standalone-mvp","mode":"standalone"}

# LLM 状态
curl -s https://looptrain.me/api/config
# → {"llm_enabled":true,"llm_provider":"deepseek"}
```

---

## 4. 切换 LLM / Mock 模式

编辑 VPS 上的 `.env`：

```bash
ssh <USER>@<SERVER_IP> "nano /var/www/looptrain-standalone/.env"
```

```
LLM_ENABLED=true   # 启用 LLM（需 API Key）
LLM_ENABLED=false  # Mock 模式（无需 Key）
```

改完重启：

```bash
ssh <USER>@<SERVER_IP> "pm2 restart looptrain-standalone --update-env"
```

---

## 5. nginx 配置

线上完整 nginx 配置见：`devlog/nginx/looptrain.me.conf`

SLT 相关路由（在 VPS 上  `/etc/nginx/sites-enabled/looptrain`）：

| 路径 | 目标 |
|------|------|
| `/play/game` | `http://127.0.0.1:3030/`（游戏入口） |
| `/style.css`、`/app.js`、`/favicon.ico` | `http://127.0.0.1:3030`（SLT 静态文件） |
| `/api/` | `http://127.0.0.1:3030`（游戏 API） |
| `/assets/` | `http://127.0.0.1:3030`（立绘和背景图） |

ST 旧版（`/?looptrain=game`）仍可走 8000 端口，作为兼容保留。

更新 nginx 后：

```bash
scp devlog/nginx/looptrain.me.conf <USER>@<SERVER_IP>:/etc/nginx/sites-enabled/looptrain
ssh <USER>@<SERVER_IP> "nginx -t && nginx -s reload"
```

---

## 6. 本地验证（部署前必做）

```bash
bash scripts/verify_slt.sh
```

验证内容：语法检查 → 引擎冒烟测试 → HTTP 健康检查 → 页面不含 SillyTavern。

---

## 常见问题

**Q: 页面 CSS 丢失？**

检查 HTML 中 `<base href="/" />` 是否存在。如果缺失，相对路径的 `style.css` 在 `/play/game` 代理下会解析到 `/play/style.css` 而非 `/style.css`。

**Q: LLM 不工作？**

```bash
curl -s https://looptrain.me/api/config | grep llm_enabled
```
返回 `false` 则 `.env` 中 `LLM_ENABLED` 不是 `true`，或重启时未带 `--update-env`。
