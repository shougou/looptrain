#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEVLOG_DIR="$ROOT_DIR/devlog"
REMOTE="<USER>@<SERVER_IP>"
REMOTE_ROOT="/var/www/looptrain-devlog"
BRANCH="$(git -C "$ROOT_DIR" branch --show-current)"
UPSTREAM="$(git -C "$ROOT_DIR" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' 2>/dev/null || true)"

if [ -z "$UPSTREAM" ]; then
  echo "ERROR: current branch has no upstream; refusing to deploy stale content." >&2
  exit 1
fi

git -C "$ROOT_DIR" fetch --quiet origin "$BRANCH"

BEHIND="$(git -C "$ROOT_DIR" rev-list --count "HEAD..$UPSTREAM")"
if [ "$BEHIND" != "0" ]; then
  echo "ERROR: local branch is behind $UPSTREAM by $BEHIND commit(s)." >&2
  echo "Fetch/merge/rebase before deploying, otherwise rsync --delete may remove remote-only articles." >&2
  exit 1
fi

if ! git -C "$ROOT_DIR" diff --quiet || ! git -C "$ROOT_DIR" diff --cached --quiet; then
  echo "ERROR: tracked working tree has uncommitted changes; commit or stash before deploying." >&2
  exit 1
fi

python3 "$ROOT_DIR/scripts/check_docs_governance.py"

cd "$DEVLOG_DIR"
npm run build
npx astro check

test -d dist

TS="$(date +%Y%m%d%H%M%S)"
rsync -avz --delete -e 'ssh -o StrictHostKeyChecking=no' \
  dist/ "$REMOTE:$REMOTE_ROOT/releases/$TS/"
ssh "$REMOTE" "ln -sfn $REMOTE_ROOT/releases/$TS $REMOTE_ROOT/current && readlink -f $REMOTE_ROOT/current"

echo "Devlog deployed: $TS"
