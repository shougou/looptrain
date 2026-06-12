#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# LoopTrain-ST 云服务器一键部署脚本
# 支持: Ubuntu 20.04+ / Debian 11+
# ============================================================

# ---- 配置变量 ----
ST_DIR="${ST_DIR:-/opt/looptrain-st/workspace/SillyTavern}"
ST_BRANCH="${ST_BRANCH:-release}"
ST_REPO="${ST_REPO:-https://github.com/SillyTavern/SillyTavern.git}"
DOMAIN="${DOMAIN:-}"                # 域名（必填）
ST_PASSWORD="${ST_PASSWORD:-}"       # ST 访问密码（必填，至少 8 位）
LOOPTRAIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---- 颜色 ----
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

log()  { echo -e "${GREEN}[LoopTrain]${NC} $*"; }
warn() { echo -e "${YELLOW}[LoopTrain]${NC} $*"; }
err()  { echo -e "${RED}[LoopTrain]${NC} $*"; exit 1; }

# ---- 环境检查 ----
command -v git  >/dev/null 2>&1 || err "请先安装 git"
command -v node >/dev/null 2>&1 || err "请先安装 Node.js latest LTS"
command -v npm  >/dev/null 2>&1 || err "请先安装 npm"

if [[ "$EUID" -ne 0 ]]; then
    warn "建议使用 root 或 sudo 运行此脚本，否则 nginx/certbot/pm2 安装会跳过。"
fi

if [[ -z "$DOMAIN" ]]; then
    read -rp "请输入你的域名（例如 looptrain.example.com）：" DOMAIN
fi
if [[ -z "$DOMAIN" ]]; then
    err "域名不能为空"
fi

if [[ -z "$ST_PASSWORD" ]]; then
    read -rsp "请输入 SillyTavern 访问密码（至少 8 位）：" ST_PASSWORD
    echo
fi
if [[ ${#ST_PASSWORD} -lt 8 ]]; then
    err "密码不能少于 8 位"
fi

# ---- 1. 安装系统依赖 ----
log "1/7 安装系统依赖..."
if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq
    apt-get install -y -qq nginx certbot python3-certbot-nginx python3

    # 安装 pm2
    if ! command -v pm2 >/dev/null 2>&1; then
        npm install -g pm2
    fi

    # 配置防火墙
    if command -v ufw >/dev/null 2>&1; then
        ufw allow 80/tcp   || true
        ufw allow 443/tcp  || true
        ufw deny  8000/tcp || true
        warn "防火墙已配置: 开放 80/443，禁止直接访问 8000"
    fi

elif command -v yum >/dev/null 2>&1; then
    warn "检测到 CentOS/RHEL，nginx/certbot 配置请手动完成。"
else
    warn "未检测到 apt 或 yum，请手动安装 nginx、certbot、pm2。"
fi

# ---- 2. 拉取 SillyTavern ----
log "2/7 准备 SillyTavern 运行环境..."
if [[ ! -d "$ST_DIR/.git" ]]; then
    mkdir -p "$(dirname "$ST_DIR")"
    git clone "$ST_REPO" -b "$ST_BRANCH" "$ST_DIR"
else
    log "SillyTavern 已存在，更新..."
    git -C "$ST_DIR" fetch origin
    git -C "$ST_DIR" checkout "$ST_BRANCH"
    git -C "$ST_DIR" pull --ff-only || true
fi

cd "$ST_DIR"

if [[ ! -f "config.yaml" ]]; then
    if [[ -f "default/config.yaml" ]]; then
        cp default/config.yaml config.yaml
    else
        npm run init || true
    fi
fi

log "安装 SillyTavern 依赖..."
npm install

# ---- 3. 配置 ST 生产环境 ----
log "3/7 配置 SillyTavern 生产环境..."
python3 "$LOOPTRAIN_ROOT/scripts/patch_config.py" "$ST_DIR/config.yaml" --listen false

# 设置访问密码
python3 - "$ST_DIR/config.yaml" "$ST_PASSWORD" <<'PYEOF'
import sys, re
path, pw = sys.argv[1], sys.argv[2]
text = open(path).read()
text = re.sub(r'(?m)^(\s*whitelistMode\s*:\s*).*', r'\1false', text, count=1)
text = re.sub(r'(?m)^(\s*authentication\s*:\s*).*', r'\1true', text, count=1)
text = re.sub(r'(?m)^(\s*password\s*:\s*).*', r'\1' + repr(pw).strip("'"), text, count=1)
open(path, 'w').write(text)
print('ST config: whitelistMode=false, authentication=true, password=***')
PYEOF

# ---- 4. 安装 LoopTrain ----
log "4/7 安装 LoopTrain..."
rm -rf "$ST_DIR/public/scripts/extensions/third-party/LoopTrain"
mkdir -p "$ST_DIR/public/scripts/extensions/third-party"
cp -R "$LOOPTRAIN_ROOT/looptrain/st-extension/LoopTrain" "$ST_DIR/public/scripts/extensions/third-party/LoopTrain"

rm -rf "$ST_DIR/plugins/looptrain"
mkdir -p "$ST_DIR/plugins"
cp -R "$LOOPTRAIN_ROOT/looptrain/st-server-plugin/looptrain" "$ST_DIR/plugins/looptrain"

rm -rf "$ST_DIR/looptrain_imports"
mkdir -p "$ST_DIR/looptrain_imports"
cp -R "$LOOPTRAIN_ROOT/runtime_imports/." "$ST_DIR/looptrain_imports/" || true

# ---- 5. 配置 Nginx ----
log "5/7 配置 Nginx 反向代理..."
NGINX_CONF="/etc/nginx/sites-available/looptrain"
NGINX_ENABLED="/etc/nginx/sites-enabled/looptrain"

if [[ ! -d "/etc/nginx/sites-available" ]]; then
    mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
fi

sed "s/\${DOMAIN}/${DOMAIN}/g" "$LOOPTRAIN_ROOT/scripts/nginx_looptrain.conf" > "$NGINX_CONF"

# 先注释掉 SSL 部分，获取证书后再启用
sed -i '/listen 443/,/^}/d' "$NGINX_CONF"

ln -sf "$NGINX_CONF" "$NGINX_ENABLED" 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true

nginx -t && systemctl reload nginx || warn "nginx 配置测试失败，请检查"

# ---- 6. 获取 SSL 证书 ----
log "6/7 获取 SSL 证书..."
if command -v certbot >/dev/null 2>&1; then
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@${DOMAIN}" || warn "SSL 证书获取失败，请手动运行 certbot"
    systemctl reload nginx || true
else
    warn "certbot 未安装，跳过 SSL。请手动配置 HTTPS。"
fi

# ---- 7. 启动服务 ----
log "7/7 启动 SillyTavern (pm2)..."
pm2 delete looptrain-st 2>/dev/null || true
pm2 start "$ST_DIR/server.js" \
    --name looptrain-st \
    --cwd "$ST_DIR" \
    --log "$ST_DIR/pm2.log"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup 2>/dev/null || true

# ---- 完成 ----
echo
echo "============================================================"
echo -e "  ${GREEN}LoopTrain-ST 部署完成${NC}"
echo "============================================================"
echo
echo "  访问地址:  https://${DOMAIN}/?looptrain=game"
echo "  管理地址:  https://${DOMAIN}/"
echo "  访问密码:  ${ST_PASSWORD}"
echo
echo "  常用命令:"
echo "    pm2 status             查看服务状态"
echo "    pm2 logs looptrain-st  查看日志"
echo "    pm2 restart looptrain-st 重启服务"
echo
echo "  LoopTrain 更新:"
echo "    bash ${LOOPTRAIN_ROOT}/scripts/update_looptrain.sh"
echo "    pm2 restart looptrain-st"
echo
echo "  安全提醒:"
echo "    - 请在浏览器首次访问后修改密码"
echo "    - 定期更新系统和依赖"
echo "    - 监控 DeepSeek API 使用量"
echo "============================================================"
