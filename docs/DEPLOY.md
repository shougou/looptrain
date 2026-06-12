# LoopTrain-ST 云服务器部署指南

## 架构概览

```
用户 https://域名
    │
    ▼
Nginx (443 HTTPS, Let's Encrypt SSL)
    │ proxy_pass http://127.0.0.1:8000
    ▼
SillyTavern (localhost:8000, pm2 守护)
    ├── LoopTrain UI Extension
    └── LoopTrain Server Plugin
```

## 前置条件

| 要求 | 说明 |
|---|---|
| 云服务器 | 1 核 2G 起，推荐 2 核 4G |
| 操作系统 | Ubuntu 20.04+ / Debian 11+ |
| 域名 | 已解析到服务器 IP |
| 防火墙 | 开放 80、443 端口 |
| DeepSeek API Key | 用于 LLM 对话 |

## 快速部署（推荐）

### 1. 上传项目到服务器

```bash
# 在本地打包
cd /path/to/looptrain_st_source_runtime_v0.4
tar czf ../looptrain-st.tar.gz --exclude=workspace --exclude=.git .

# 上传到服务器
scp ../looptrain-st.tar.gz root@你的服务器IP:/opt/
```

### 2. 解压并部署

```bash
ssh root@你的服务器IP

cd /opt
tar xzf looptrain-st.tar.gz
cd looptrain_st_source_runtime_v0.4

# 一键部署
DOMAIN=你的域名 ST_PASSWORD=你的密码 bash scripts/deploy_setup.sh
```

> 不传 DOMAIN/ST_PASSWORD 环境变量时，脚本会交互式询问。

### 3. 配置 DeepSeek

浏览器访问 `https://你的域名/`，输入访问密码后：

1. 进入 ST 设置 → API 配置
2. API Type: Chat Completion
3. Chat Completion Source: Custom (OpenAI-compatible)
4. Base URL: `https://api.deepseek.com`
5. Model: `deepseek-v4-pro`
6. API Key: 你的 DeepSeek Key

### 4. 导入角色卡

1. ST 管理界面 → 角色管理 → 导入角色
2. 导入 `looptrain_imports/character_cards/` 目录下的 `.STcard.png` 文件
3. 导入世界书 `looptrain_imports/world_books/looptrain_trial_character_book.json`

### 5. 进入游戏

```
https://你的域名/?looptrain=game
```

## 手动部署

如果一键脚本不适用，按以下顺序手动操作：

### 1. 安装依赖

```bash
# Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt-get install -y nodejs

# Nginx + Certbot
apt-get install -y nginx certbot python3-certbot-nginx python3

# pm2
npm install -g pm2
```

### 2. 拉取 SillyTavern

```bash
mkdir -p /opt/looptrain-st/workspace
git clone https://github.com/SillyTavern/SillyTavern.git -b release \
    /opt/looptrain-st/workspace/SillyTavern
cd /opt/looptrain-st/workspace/SillyTavern
npm install
```

### 3. 安装 LoopTrain

```bash
bash /opt/looptrain_st_source_runtime_v0.4/scripts/update_looptrain.sh
```

### 4. 配置 ST

编辑 `workspace/SillyTavern/config.yaml`：

```yaml
listen: false                          # 仅本机，由 nginx 代理
enableServerPlugins: true
whitelistMode: false
authentication: true
password: "你的强密码"
```

### 5. 配置 Nginx

```bash
cp scripts/nginx_looptrain.conf /etc/nginx/sites-available/looptrain
# 替换 ${DOMAIN} 为你的域名
sed -i 's/${DOMAIN}/你的域名/g' /etc/nginx/sites-available/looptrain
ln -s /etc/nginx/sites-available/looptrain /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 6. 获取 SSL 证书

```bash
certbot --nginx -d 你的域名
```

### 7. 启动服务

```bash
cd /opt/looptrain-st/workspace/SillyTavern
pm2 start server.js --name looptrain-st
pm2 save
pm2 startup
```

## 防火墙配置

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 8000/tcp      # 禁止直接访问 ST 端口
ufw enable
```

## 更新 LoopTrain

```bash
# 上传新版源码到服务器后
bash scripts/update_looptrain.sh
pm2 restart looptrain-st
```

## 日常运维

| 操作 | 命令 |
|---|---|
| 查看服务状态 | `pm2 status` |
| 查看日志 | `pm2 logs looptrain-st` |
| 重启服务 | `pm2 restart looptrain-st` |
| 停止服务 | `pm2 stop looptrain-st` |
| SSL 续期 | `certbot renew --quiet` |
| nginx 重载 | `systemctl reload nginx` |

## 安全清单

- [ ] ST 设置了强密码（8 位以上）
- [ ] `listen: false`（通过 nginx 代理）
- [ ] `whitelistMode: false`（nginx 层已防护）
- [ ] HTTPS 已配置（Let's Encrypt）
- [ ] 8000 端口不对外开放
- [ ] DeepSeek API Key 仅在 ST 设置中配置
- [ ] LoopTrain 代码中不包含 API Key
- [ ] 定期 `apt update && apt upgrade`
- [ ] 监控服务器资源使用

## 故障排查

| 现象 | 检查 |
|---|---|
| 无法访问 | `systemctl status nginx`、`pm2 status`、防火墙 |
| 403 错误 | ST 访问密码是否正确 |
| SSL 证书过期 | `certbot renew --dry-run` |
| LLM 无回复 | ST 中 DeepSeek API Key 是否有效 |
| Server Plugin 未连接 | `config.yaml` 中 `enableServerPlugins: true` |
| 页面空白 | 浏览器控制台 `window.LoopTrain.getDiagnostics()` |

## 推荐服务器配置

| 场景 | 配置 | 月费参考 |
|---|---|---|
| 试玩/测试 | 1 核 2G | ¥30-50 |
| 小规模公测 | 2 核 4G | ¥60-100 |
| 正式运营 | 4 核 8G | ¥200+ |

推荐腾讯云轻量应用服务器 / 阿里云 ECS / AWS Lightsail，选 Ubuntu 22.04 镜像。
