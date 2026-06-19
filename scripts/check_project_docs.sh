#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_DIR="$ROOT/docs/project"
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

echo "Checking steady-state documents..."
echo ""

for doc in PROJECT_STATUS.md ROADMAP.md KNOWN_ISSUES.md CHANGELOG.md ARCHITECTURE.md GAME_DESIGN.md; do
  check_nonempty "$PROJECT_DIR/$doc" "$doc"
done

# Check version consistency: PROJECT_STATUS version vs CHANGELOG latest
STATUS_VER=$(grep -oP 'v\d+\.\d+[^\s]*' "$PROJECT_DIR/PROJECT_STATUS.md" | head -1 || echo "unknown")
CHANGELOG_LATEST=$(grep -oP '^## v\d+[^\s]+' "$PROJECT_DIR/CHANGELOG.md" | head -1 | sed 's/^## //' || echo "unknown")
echo ""
echo "Version check: PROJECT_STATUS=$STATUS_VER, CHANGELOG latest=$CHANGELOG_LATEST"
if [ "$STATUS_VER" != "unknown" ] && [ "$CHANGELOG_LATEST" != "unknown" ]; then
  if echo "$CHANGELOG_LATEST" | grep -qF "$STATUS_VER"; then
    echo "  PASS: Version consistent"
    PASS=$((PASS + 1))
  else
    echo "  WARN: Version mismatch (not a hard failure)"
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Result: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "VERDICT: FAIL — $FAIL document(s) missing or empty"
  exit 1
else
  echo "VERDICT: PASS"
  exit 0
fi
