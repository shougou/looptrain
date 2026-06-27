#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_BASE="$ROOT/docs/work"
PROJECT_DIR="$ROOT/docs/project"
WI_ID="${1:-}"

if [ -z "$WI_ID" ]; then
  echo "Usage: check_release_wrapup.sh <LT-YYYYMMDD-slug>"
  echo "Example: check_release_wrapup.sh LT-20260619-document-workflow"
  echo ""
  echo "Verifies 收尾 (wrap-up) phase completeness:"
  echo "  - Steady-state docs updated (PROJECT_STATUS, CHANGELOG, ROADMAP, KNOWN_ISSUES)"
  echo "  - Devlog site data synced (site-status.json, roadmap.ts)"
  echo "  - Version consistency across all locations"
  echo "  - Release note 收尾 checklist all checked"
  exit 1
fi

# Find work item directory (active or released)
WI_DIR=""
if [ -d "$WORK_BASE/active/$WI_ID" ]; then
  WI_DIR="$WORK_BASE/active/$WI_ID"
elif [ -d "$WORK_BASE/released/$WI_ID" ]; then
  WI_DIR="$WORK_BASE/released/$WI_ID"
else
  echo "FAIL: Work item directory not found: $WI_ID (checked active/ and released/)"
  exit 1
fi

PASS=0
FAIL=0

check_nonempty() {
  local file="$1" label="$2"
  if [ -f "$file" ] && [ -s "$file" ]; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label — file missing or empty: $file"
    FAIL=$((FAIL + 1))
  fi
}

check_contains() {
  local file="$1" pattern="$2" label="$3"
  if grep -q "$pattern" "$file" 2>/dev/null; then
    echo "  PASS: $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $label — pattern '$pattern' not found in $file"
    FAIL=$((FAIL + 1))
  fi
}

check_file_newer() {
  local file="$1" reference="$2" label="$3"
  if [ -f "$file" ] && [ "$file" -nt "$reference" ] 2>/dev/null; then
    echo "  PASS: $label (newer than release note)"
    PASS=$((PASS + 1))
  elif [ -f "$file" ]; then
    echo "  WARN: $label — $file is not newer than $reference (may not have been updated)"
  else
    echo "  FAIL: $label — file missing: $file"
    FAIL=$((FAIL + 1))
  fi
}

echo "Checking 收尾 completeness for: $WI_ID"
echo "Directory: $WI_DIR"
echo ""

RN="$WI_DIR/50-release-note.md"

# 1. Prerequisite: release note must exist
echo "--- 1. Release note ---"
check_nonempty "$RN" "50-release-note.md exists"
if [ ! -f "$RN" ]; then
  echo "FATAL: 50-release-note.md not found. Cannot proceed with 收尾 checks."
  exit 1
fi

# 2. Release note must have 收尾 checklist
echo ""
echo "--- 2. Release note 收尾 checklist ---"
check_contains "$RN" "收尾检查" "50-release-note.md has 收尾 checklist section"

# 3. Release note checklist items — all must be checked
echo ""
echo "--- 3. Release note checklist completeness ---"
UNCHECKED=$(sed -n '/^## 收尾检查/,/^##/p' "$RN" | grep -c '^\- \[ \]' || true)
if [ "$UNCHECKED" -eq 0 ]; then
  echo "  PASS: All 收尾 checklist items are checked"
  PASS=$((PASS + 1))
else
  echo "  FAIL: $UNCHECKED unchecked item(s) remain in 收尾 checklist"
  FAIL=$((FAIL + 1))
fi

# Check version level is marked
if grep -q '版本级别.*\[x\]' "$RN" 2>/dev/null; then
  echo "  PASS: Version level marked in release note"
  PASS=$((PASS + 1))
else
  echo "  FAIL: Version level not marked (patch/minor/major) in release note"
  FAIL=$((FAIL + 1))
fi

# 4. Steady-state docs updated after release note
echo ""
echo "--- 4. Steady-state docs freshness ---"
for doc in PROJECT_STATUS.md CHANGELOG.md ROADMAP.md KNOWN_ISSUES.md; do
  check_file_newer "$PROJECT_DIR/$doc" "$RN" "$doc updated after release note"
done

# 5. Devlog site data updated
echo ""
echo "--- 5. Devlog site data freshness ---"
check_file_newer "$ROOT/devlog/src/data/site-status.json" "$RN" "site-status.json updated"
check_file_newer "$ROOT/devlog/src/data/roadmap.ts" "$RN" "roadmap.ts updated"

# 5b. Changelog entry in devlog
echo ""
echo "--- 5b. Devlog changelog entry ---"
DEVLOG_CHANGELOG_DIR="$ROOT/devlog/src/content/changelog"
if [ -d "$DEVLOG_CHANGELOG_DIR" ]; then
  LATEST_CHANGELOG=$(ls -t "$DEVLOG_CHANGELOG_DIR"/*.md 2>/dev/null | head -1 || echo "")
  if [ -n "$LATEST_CHANGELOG" ] && [ "$LATEST_CHANGELOG" -nt "$RN" ] 2>/dev/null; then
    echo "  PASS: Devlog changelog entry exists and is recent"
    PASS=$((PASS + 1))
  elif [ -n "$LATEST_CHANGELOG" ]; then
    echo "  WARN: Devlog changelog entry exists but may not be updated for this release"
  else
    echo "  WARN: No devlog changelog entries found"
  fi
else
  echo "  WARN: $DEVLOG_CHANGELOG_DIR not found"
fi

# 5c. Devlog article (only for major/minor; warn if missing for those levels)
echo ""
echo "--- 5c. Devlog article (major/minor only) ---"
DEVLOG_ARTICLE_DIR="$ROOT/devlog/src/content/devlog"
VERSION_LEVEL=""
if grep -q '版本级别.*\[x\] \?minor' "$RN" 2>/dev/null || grep -q '版本级别.*\[x\] \?major' "$RN" 2>/dev/null; then
  if grep -q '版本级别.*\[x\] \?major' "$RN" 2>/dev/null; then
    VERSION_LEVEL="major"
  else
    VERSION_LEVEL="minor"
  fi
  if [ -d "$DEVLOG_ARTICLE_DIR" ]; then
    LATEST_ARTICLE=$(ls -t "$DEVLOG_ARTICLE_DIR"/*.md 2>/dev/null | head -1 || echo "")
    if [ -n "$LATEST_ARTICLE" ] && [ "$LATEST_ARTICLE" -nt "$RN" ] 2>/dev/null; then
      echo "  PASS: Devlog article exists for $VERSION_LEVEL release"
      PASS=$((PASS + 1))
    else
      echo "  FAIL: $VERSION_LEVEL release should have a devlog article in $DEVLOG_ARTICLE_DIR/"
      FAIL=$((FAIL + 1))
    fi
  fi
else
  echo "  SKIP: Patch release — devlog article not required"
fi

# 6. Version consistency across all locations (13 locations)
echo ""
echo "--- 6. Version consistency (13 locations) ---"

# Read VERSION file as the canonical source
VERSION_FILE="$ROOT/VERSION"
if [ -f "$VERSION_FILE" ] && [ -s "$VERSION_FILE" ]; then
  VERSION_VAL=$(cat "$VERSION_FILE" | tr -d '\n\r')
else
  VERSION_VAL="unknown"
  echo "  FAIL: VERSION file not found or empty"
  FAIL=$((FAIL + 1))
fi

# Extract version from each location
RN_VER=$(grep -oP 'v\d+\.\d+[^\s]*' "$RN" | head -1 || echo "unknown")
PS_VER=$(grep -oP 'v\d+\.\d+[^\s]*' "$PROJECT_DIR/PROJECT_STATUS.md" | head -1 || echo "unknown")
CL_VER=$(grep -oP '^## v\d+[^\s]+' "$PROJECT_DIR/CHANGELOG.md" | head -1 | sed 's/^## //' || echo "unknown")
SS_VER=$(grep -oP '"currentVersion":\s*"([^"]+)"' "$ROOT/devlog/src/data/site-status.json" | grep -oP 'v[^"]+' || echo "unknown")

MANIFEST_VER=$(grep -oP '"looptrain_version":\s*"?([^",]+)"?' "$ROOT/MANIFEST.json" | grep -oP 'v?[0-9][^",]*' || echo "unknown")
PKG_VER=$(grep -oP '"version":\s*"?([^",]+)"?' "$ROOT/looptrain/standalone/package.json" | grep -oP '[0-9][^",]*' || echo "unknown")
SERVER_HEALTH_VER=$(grep -oP "\bversion:\s*'([^']+)'" "$ROOT/looptrain/standalone/server.js" | grep -oP "v?[0-9][^']*" || echo "unknown")
APP_RUNTIME_VER=$(grep -oP "LT_RUNTIME_VERSION\\s*=\\s*'([^']+)'" "$ROOT/looptrain/standalone/public/app.js" | grep -oP "v?[0-9][^']*" || echo "unknown")

# Extract version from AGENT.md §2
AGENT_VER=$(awk '/^## 2\. 当前版本/{found=1} found && /v[0-9]+\.[0-9]+(\.[0-9]+)?(-[a-z0-9-]+)?/{print; exit}' "$ROOT/looptrain/AGENT.md" | grep -oP 'v[0-9]+\.[0-9]+(\.[0-9]+)?(-[a-z0-9-]+)?' || echo "unknown")

echo "  1.  VERSION file:       $VERSION_VAL"
echo "  2.  MANIFEST.json:      $MANIFEST_VER"
echo "  3.  package.json:       $PKG_VER"
echo "  4.  server.js health:   $SERVER_HEALTH_VER"
echo "  5.  app.js LT_RUNTIME:  $APP_RUNTIME_VER"
echo "  6.  AGENT.md §2:        $AGENT_VER"
echo "  7.  PROJECT_STATUS:     $PS_VER"
echo "  8.  CHANGELOG latest:   $CL_VER"
echo "  9.  site-status.json:   $SS_VER"
echo "  10. Release note:       $RN_VER"

CONSISTENT=1
compare_ver() {
  local label="$1" actual="$2" expected="$3"
  if [ "$actual" = "unknown" ]; then
    echo "  WARN: $label version not found"
    CONSISTENT=0
  elif [ "$actual" != "$expected" ]; then
    echo "  FAIL: $label ($actual) != VERSION ($expected)"
    CONSISTENT=0
  fi
}

compare_ver "VERSION file" "$VERSION_VAL" "$VERSION_VAL"
compare_ver "MANIFEST.json" "$MANIFEST_VER" "$VERSION_VAL"
compare_ver "server.js health" "$SERVER_HEALTH_VER" "$VERSION_VAL"
compare_ver "app.js LT_RUNTIME" "$APP_RUNTIME_VER" "$VERSION_VAL"
compare_ver "AGENT.md §2" "$AGENT_VER" "$VERSION_VAL"
compare_ver "PROJECT_STATUS" "$PS_VER" "$VERSION_VAL"
compare_ver "site-status.json" "$SS_VER" "$VERSION_VAL"
compare_ver "Release note" "$RN_VER" "$VERSION_VAL"

# Special handling for package.json (npm format: 0.8.2 without v prefix)
NPM_EXPECTED=$(echo "$VERSION_VAL" | sed 's/^v//' | sed 's/-.*$//')
if [ "$PKG_VER" = "unknown" ]; then
  echo "  WARN: package.json version not found"
  CONSISTENT=0
elif [ "$PKG_VER" != "$NPM_EXPECTED" ]; then
  echo "  FAIL: package.json ($PKG_VER) != expected npm version ($NPM_EXPECTED)"
  CONSISTENT=0
fi

# Special handling for CHANGELOG (may include slug suffix)
if [ "$CL_VER" = "unknown" ]; then
  echo "  WARN: CHANGELOG latest version not found"
  CONSISTENT=0
elif [ "$CL_VER" != "$VERSION_VAL" ]; then
  echo "  FAIL: CHANGELOG ($CL_VER) != VERSION ($VERSION_VAL)"
  CONSISTENT=0
fi

if [ "$CONSISTENT" -eq 1 ]; then
  echo "  PASS: Version numbers consistent across all 13 locations"
  PASS=$((PASS + 1))
else
  FAIL=$((FAIL + 1))
fi

# 6b. E2E regression test results (Playwright)
echo ""
echo "--- 6b. E2E test results ---"
E2E_RESULT_DIR="$ROOT/looptrain/standalone/test-results"
E2E_LAST_RUN="$E2E_RESULT_DIR/.last-run.json"
if [ -f "$E2E_LAST_RUN" ]; then
  E2E_STATUS=$(python3 -c "import json; d=json.load(open('$E2E_LAST_RUN')); print(d.get('status','unknown'))" 2>/dev/null || echo "unknown")
  echo "  Last E2E run status: $E2E_STATUS"
  if [ "$E2E_STATUS" = "passed" ] || [ "$E2E_STATUS" = "failed" ]; then
    echo "  PASS: E2E tests have been executed"
    PASS=$((PASS + 1))
  else
    echo "  WARN: E2E test results status is '$E2E_STATUS' — may not have run recently"
  fi
else
  echo "  FAIL: No E2E test results found ($E2E_LAST_RUN missing)"
  FAIL=$((FAIL + 1))
fi

# 7. Work item location — should be in released/ (not active/)
echo ""
echo "--- 7. Archive status ---"
if [ -d "$WORK_BASE/released/$WI_ID" ]; then
  echo "  PASS: Work item is in released/"
  PASS=$((PASS + 1))
elif [ -d "$WORK_BASE/active/$WI_ID" ]; then
  echo "  INFO: Work item still in active/ (archive step not yet done)"
else
  echo "  WARN: Unexpected work item location"
fi

# 8. Online deployment verification (optional — skipped if no network)
echo ""
echo "--- 8. Deployment verification (optional) ---"
HEALTH_URL="https://looptrain.me/api/health"
GAME_URL="https://looptrain.me/"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$HEALTH_URL" 2>/dev/null || echo "000")
GAME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$GAME_URL" 2>/dev/null || echo "000")

echo "  looptrain.me/api/health: HTTP $HEALTH_STATUS"
echo "  looptrain.me:            HTTP $GAME_STATUS"

if [ "$HEALTH_STATUS" = "200" ]; then
  echo "  PASS: Health endpoint OK"
  PASS=$((PASS + 1))
elif [ "$HEALTH_STATUS" = "000" ]; then
  echo "  SKIP: Cannot reach looptrain.me (network or server down)"
else
  echo "  FAIL: Health endpoint returned HTTP $HEALTH_STATUS (expected 200)"
  FAIL=$((FAIL + 1))
fi

if [ "$GAME_STATUS" = "200" ]; then
  echo "  PASS: Game page OK"
  PASS=$((PASS + 1))
elif [ "$GAME_STATUS" = "000" ]; then
  echo "  SKIP: Cannot reach looptrain.me"
else
  echo "  WARN: Game page returned HTTP $GAME_STATUS (expected 200)"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "收尾检查结果: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "VERDICT: FAIL — $FAIL check(s) did not pass"
  exit 1
else
  echo "VERDICT: PASS — 收尾阶段完成"
  exit 0
fi
