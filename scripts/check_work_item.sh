#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_BASE="$ROOT/docs/work"
WI_ID="${1:-}"

if [ -z "$WI_ID" ]; then
  echo "Usage: check_work_item.sh <LT-YYYYMMDD-slug>"
  echo "Example: check_work_item.sh LT-20260619-goal-action-system"
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
    echo "  PASS: $label ($file)"
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

echo "Checking work item: $WI_ID"
echo "Directory: $WI_DIR"
echo ""

# 1. 00-idea.md
check_nonempty "$WI_DIR/00-idea.md" "00-idea.md exists and non-empty"

# 2. 10-spec.md + acceptance criteria
check_nonempty "$WI_DIR/10-spec.md" "10-spec.md exists and non-empty"
check_contains "$WI_DIR/10-spec.md" "验收标准" "10-spec.md contains acceptance criteria section"

# 3. 20-plan.md + file change list
check_nonempty "$WI_DIR/20-plan.md" "20-plan.md exists and non-empty"
check_contains "$WI_DIR/20-plan.md" "文件变更" "20-plan.md contains file change list"

# 4. 30-implementation-log.md
check_nonempty "$WI_DIR/30-implementation-log.md" "30-implementation-log.md exists and non-empty"

# 5. 40-review.md + pass conclusion
check_nonempty "$WI_DIR/40-review.md" "40-review.md exists and non-empty"
check_contains "$WI_DIR/40-review.md" "通过" "40-review.md contains pass conclusion"

# 6. 50-release-note.md (optional — only for release stage)
if [ -f "$WI_DIR/50-release-note.md" ]; then
  check_nonempty "$WI_DIR/50-release-note.md" "50-release-note.md exists and non-empty"
  check_contains "$WI_DIR/50-release-note.md" "发布检查" "50-release-note.md contains release checklist"
else
  echo "  SKIP: 50-release-note.md not yet created (pre-release stage)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Result: $PASS passed, $FAIL failed"
if [ "$FAIL" -gt 0 ]; then
  echo "VERDICT: FAIL — $FAIL check(s) did not pass"
  exit 1
else
  echo "VERDICT: PASS"
  exit 0
fi
