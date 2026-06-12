#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ST_DIR="${ST_DIR:-$ROOT_DIR/workspace/SillyTavern}"

echo "[LoopTrain] Verifying ST source runtime..."

test -d "$ST_DIR" || { echo "FAIL: ST_DIR missing: $ST_DIR"; exit 1; }
test -f "$ST_DIR/config.yaml" || { echo "FAIL: config.yaml missing"; exit 1; }
grep -q "enableServerPlugins: true" "$ST_DIR/config.yaml" || { echo "FAIL: enableServerPlugins is not true"; exit 1; }

test -f "$ST_DIR/public/scripts/extensions/third-party/LoopTrain/index.js" || { echo "FAIL: LoopTrain extension missing"; exit 1; }
test -f "$ST_DIR/plugins/looptrain/index.js" || { echo "FAIL: LoopTrain server plugin missing"; exit 1; }
test -d "$ST_DIR/looptrain_imports/character_cards" || { echo "FAIL: import materials missing"; exit 1; }

node --check "$ST_DIR/public/scripts/extensions/third-party/LoopTrain/index.js"
node --check "$ST_DIR/plugins/looptrain/engine.js"

echo "OK: ST source runtime structure is ready."
