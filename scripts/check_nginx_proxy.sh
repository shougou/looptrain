#!/usr/bin/env bash
# check_nginx_proxy.sh — 验证 index.html 引用的所有静态文件都有 nginx 代理规则
#
# 背景：nginx 使用白名单模式（每个文件单独 location）时，新增文件容易遗漏代理规则。
# 使用 prefix match（location ^~ /play/game）后，此检查主要验证 index.html 中没有 <base href="/">
# 和相对路径是否正确。

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INDEX_HTML="$ROOT_DIR/looptrain/standalone/public/index.html"
NGINX_CONF="$ROOT_DIR/devlog/nginx/looptrain.me.conf"

ERRORS=0

# ── Check 1: index.html must NOT have <base href="/"> ──
if grep -q '<base href="/"' "$INDEX_HTML" 2>/dev/null; then
    echo "FAIL: $INDEX_HTML contains <base href=\"/\">"
    echo "  This causes all relative URLs to resolve against root path (/),"
    echo "  bypassing the /play/game/ nginx prefix match."
    echo "  Fix: Remove <base href=\"/\"> tag."
    ((ERRORS++))
else
    echo "PASS: No <base href=\"/\"> found in index.html"
fi

# ── Check 2: nginx must use prefix match for /play/game proxy (not exact match) ──
# (exclude redirect rules which legitimately use exact match)
PROXY_MATCH=$(awk '/location = \/play\/game \{/{found=1} found{if(/proxy_pass/){print "exact-match"; exit}} found{if(/\}/){found=0}}' "$NGINX_CONF" 2>/dev/null || true)
if [ "$PROXY_MATCH" = "exact-match" ]; then
    echo "FAIL: $NGINX_CONF uses 'location = /play/game' with proxy_pass"
    echo "  Exact match only handles /play/game, not /play/game/ui-stage.js."
    echo "  Fix: Use 'location ^~ /play/game' (prefix match) for proxy"
    ((ERRORS++))
else
    echo "PASS: nginx uses prefix match for /play/game proxy"
fi

# ── Check 3: nginx must have redirect from /play/game to /play/game/ ──
if ! grep -q 'return 301 /play/game/;' "$NGINX_CONF" 2>/dev/null; then
    echo "FAIL: $NGINX_CONF missing redirect from /play/game to /play/game/"
    echo "  Without trailing slash, relative URLs resolve to wrong paths."
    echo "  Fix: Add 'location = /play/game { return 301 /play/game/; }'"
    ((ERRORS++))
else
    echo "PASS: nginx has /play/game -> /play/game/ redirect"
fi

# ── Check 4: index.html script src must be relative paths (not absolute) ──
ABSOLUTE_SRCS=$(grep -oP 'src="\K/[^"]+' "$INDEX_HTML" 2>/dev/null | grep -v '^/components/' || true)
if [ -n "$ABSOLUTE_SRCS" ]; then
    echo "FAIL: $INDEX_HTML contains absolute paths in script src:"
    echo "$ABSOLUTE_SRCS" | sed 's/^/  /'
    echo "  Absolute paths bypass the /play/game/ prefix match."
    echo "  Fix: Use relative paths (e.g., 'ui-stage.js' not '/ui-stage.js')"
    ((ERRORS++))
else
    echo "PASS: All script src are relative paths"
fi

# ── Check 5: nginx must NOT have white-list static file locations ──
# (they are now handled by the prefix match, keeping them is redundant and confusing)
WL_COUNT=0
if grep -q 'location = /.*\.(js|css)' "$NGINX_CONF" 2>/dev/null; then
    WL_COUNT=$(grep 'location = /.*\.(js|css)' "$NGINX_CONF" 2>/dev/null | wc -l)
fi
if [ "$WL_COUNT" -gt 0 ]; then
    echo "WARN: $NGINX_CONF has $WL_COUNT white-list location rules for static files"
    echo "  These are redundant if prefix match is used, but harmless."
    echo "  Consider removing them for clarity."
    # This is a warning, not an error
else
    echo "PASS: No redundant white-list static file locations"
fi

# ── Summary ──
if [ "$ERRORS" -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "All nginx proxy checks passed"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Result: $ERRORS error(s) found"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi
