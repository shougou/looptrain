#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ST_DIR="${ST_DIR:-$ROOT_DIR/workspace/SillyTavern}"

test -d "$ST_DIR" || { echo "ERROR: ST_DIR missing: $ST_DIR"; exit 1; }

echo "[LoopTrain] Updating LoopTrain files in existing ST..."
rm -rf "$ST_DIR/public/scripts/extensions/third-party/LoopTrain"
mkdir -p "$ST_DIR/public/scripts/extensions/third-party"
cp -R "$ROOT_DIR/looptrain/st-extension/LoopTrain" "$ST_DIR/public/scripts/extensions/third-party/LoopTrain"

rm -rf "$ST_DIR/plugins/looptrain"
mkdir -p "$ST_DIR/plugins"
cp -R "$ROOT_DIR/looptrain/st-server-plugin/looptrain" "$ST_DIR/plugins/looptrain"

rm -rf "$ST_DIR/looptrain_imports"
mkdir -p "$ST_DIR/looptrain_imports"
cp -R "$ROOT_DIR/runtime_imports/." "$ST_DIR/looptrain_imports/"

python3 "$ROOT_DIR/scripts/patch_config.py" "$ST_DIR/config.yaml" --listen false

echo "OK: LoopTrain updated. Restart SillyTavern."
