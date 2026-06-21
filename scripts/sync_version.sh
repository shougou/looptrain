#!/usr/bin/env bash
# sync_version.sh — 从 VERSION 文件同步版本号到所有派生位置
#
# 用法: bash scripts/sync_version.sh
#
# 读取 VERSION 文件，将版本号写入 11 个派生位置。
# 详见 10-spec.md §5。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT/VERSION"

if [ ! -f "$VERSION_FILE" ] || [ ! -s "$VERSION_FILE" ]; then
  echo "ERROR: VERSION file not found or empty at $VERSION_FILE"
  exit 1
fi

# 读取版本号（去除可能的尾部换行）
VERSION=$(cat "$VERSION_FILE" | tr -d '\n\r')

# 验证格式
if ! echo "$VERSION" | grep -qE '^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9-]+)?$'; then
  echo "ERROR: VERSION file content '$VERSION' does not match required format v<major>.<minor>.<patch>-<slug>"
  exit 1
fi

# 计算 npm 语义版本（去除 v 前缀和 -slug 后缀）
NPM_VERSION=$(echo "$VERSION" | sed 's/^v//' | sed 's/-.*$//')

echo "Syncing version: $VERSION (npm: $NPM_VERSION)"
echo ""

PASS=0
FAIL=0

sync_file() {
  local file="$1" label="$2" sed_expr="$3"
  local relpath="${file#$ROOT/}"

  if [ ! -f "$file" ]; then
    echo "  FAIL: $label — file not found: $relpath"
    FAIL=$((FAIL + 1))
    return
  fi

  # 执行 sed 替换
  if sed -E -i "$sed_expr" "$file"; then
    echo "  PASS: $label ($relpath)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label — sed error in $relpath"
    FAIL=$((FAIL + 1))
  fi
}

# ── 2. MANIFEST.json ──
sync_file "$ROOT/MANIFEST.json" "MANIFEST.json looptrain_version" \
  's/"looptrain_version":\s*"[^"]+"/"looptrain_version": "'"$VERSION"'"/'

# ── 3. standalone/package.json ──
sync_file "$ROOT/looptrain/standalone/package.json" "package.json version" \
  's/"version":\s*"[^"]+"/"version": "'"$NPM_VERSION"'"/'

# ── 4. server.js health endpoint: version: '...' ──
sync_file "$ROOT/looptrain/standalone/server.js" "server.js health endpoint" \
  "s/(version:\\s*)'[^']*'/\\1'$VERSION'/"

# ── 5a. server.js startup log: LoopTrain Standalone v0.6.0 ──
sync_file "$ROOT/looptrain/standalone/server.js" "server.js startup log" \
  's/LoopTrain Standalone v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9-]+)?/LoopTrain Standalone '"$VERSION"'/'

# ── 5b. server.js engine log: Engine: v0.6.0 ──
sync_file "$ROOT/looptrain/standalone/server.js" "server.js engine log" \
  's/Engine: v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9-]+)?/Engine: '"$VERSION"'/'

# ── 6. app.js header comment: LoopTrain Standalone v0.8.0 ──
sync_file "$ROOT/looptrain/standalone/public/app.js" "app.js header comment" \
  's/LoopTrain Standalone v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9-]+)?/LoopTrain Standalone '"$VERSION"'/'

# ── 7. app.js LT_RUNTIME_VERSION ──
sync_file "$ROOT/looptrain/standalone/public/app.js" "app.js LT_RUNTIME_VERSION" \
  "s/(LT_RUNTIME_VERSION\\s*=\\s*)'[^']*'/\\1'$VERSION'/"

# ── 8. audio-manager.js header: LoopTrain v0.5.1 ──
sync_file "$ROOT/looptrain/standalone/public/audio-manager.js" "audio-manager.js header" \
  's/LoopTrain v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9-]+)?/LoopTrain '"$VERSION"'/'

# ── 9. portrait-intro.js header: PortraitIntro — v0.7.1 ──
sync_file "$ROOT/looptrain/standalone/public/portrait-intro.js" "portrait-intro.js header" \
  's/PortraitIntro — v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9-]+)?/PortraitIntro — '"$VERSION"'/'

# ── 12. site-status.json currentVersion ──
sync_file "$ROOT/devlog/src/data/site-status.json" "site-status.json currentVersion" \
  's/"currentVersion":\s*"[^"]+"/"currentVersion": "'"$VERSION"'"/'

# ── 13. AGENT.md §2 当前版本 ──
# 只替换 §2 章节内的版本号（在 "## 2. 当前版本" 和下一个 "## " 之间）
AGENT_MD="$ROOT/looptrain/AGENT.md"
if [ -f "$AGENT_MD" ]; then
  TEMP_FILE=$(mktemp)
  awk -v ver="$VERSION" '
    /^## 2\. 当前版本/ { in_section = 1 }
    /^## [0-9]/ && in_section && !/^## 2\. 当前版本/ { in_section = 0 }
    in_section && /v[0-9]+\.[0-9]+(\.[0-9]+)?(-[a-z0-9-]+)?/ {
      gsub(/v[0-9]+\.[0-9]+(\.[0-9]+)?(-[a-z0-9-]+)?/, ver)
    }
    { print }
  ' "$AGENT_MD" > "$TEMP_FILE"
  if mv "$TEMP_FILE" "$AGENT_MD"; then
    echo "  PASS: AGENT.md §2 version ($VERSION)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: AGENT.md §2 version — mv error"
    FAIL=$((FAIL + 1))
    rm -f "$TEMP_FILE"
  fi
else
  echo "  FAIL: AGENT.md — file not found"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "sync_version.sh: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "VERDICT: FAIL"
  exit 1
else
  echo "VERDICT: PASS"
  exit 0
fi
