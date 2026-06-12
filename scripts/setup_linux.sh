#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ST_DIR="${ST_DIR:-$ROOT_DIR/workspace/SillyTavern}"
BRANCH="${ST_BRANCH:-release}"
REPO="${ST_REPO:-https://github.com/SillyTavern/SillyTavern.git}"

echo "[LoopTrain] Root: $ROOT_DIR"
echo "[LoopTrain] SillyTavern dir: $ST_DIR"
echo "[LoopTrain] Branch: $BRANCH"

command -v git >/dev/null 2>&1 || { echo "ERROR: git is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js latest LTS is required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "ERROR: npm is required"; exit 1; }

if [ ! -d "$ST_DIR/.git" ]; then
  mkdir -p "$(dirname "$ST_DIR")"
  echo "[LoopTrain] Cloning SillyTavern..."
  git clone "$REPO" -b "$BRANCH" "$ST_DIR"
else
  echo "[LoopTrain] SillyTavern already exists. Pulling latest $BRANCH..."
  git -C "$ST_DIR" fetch origin
  git -C "$ST_DIR" checkout "$BRANCH"
  git -C "$ST_DIR" pull --ff-only || true
fi

cd "$ST_DIR"

if [ ! -f "config.yaml" ]; then
  if [ -f "default/config.yaml" ]; then
    cp default/config.yaml config.yaml
    echo "[LoopTrain] Created config.yaml from default/config.yaml"
  else
    echo "[LoopTrain] Running npm run init to create config.yaml..."
    npm run init || true
  fi
fi

echo "[LoopTrain] Installing SillyTavern dependencies..."
npm install

python3 "$ROOT_DIR/scripts/patch_config.py" "$ST_DIR/config.yaml" --listen false

echo "[LoopTrain] Installing LoopTrain Extension..."
mkdir -p "$ST_DIR/public/scripts/extensions/third-party"
rm -rf "$ST_DIR/public/scripts/extensions/third-party/LoopTrain"
cp -R "$ROOT_DIR/looptrain/st-extension/LoopTrain" "$ST_DIR/public/scripts/extensions/third-party/LoopTrain"

echo "[LoopTrain] Installing LoopTrain Server Plugin..."
mkdir -p "$ST_DIR/plugins"
rm -rf "$ST_DIR/plugins/looptrain"
cp -R "$ROOT_DIR/looptrain/st-server-plugin/looptrain" "$ST_DIR/plugins/looptrain"

echo "[LoopTrain] Preparing import materials..."
rm -rf "$ST_DIR/looptrain_imports"
mkdir -p "$ST_DIR/looptrain_imports"
cp -R "$ROOT_DIR/runtime_imports/." "$ST_DIR/looptrain_imports/"

echo
echo "[LoopTrain] Done."
echo "Next:"
echo "  1) Start ST: bash $ROOT_DIR/scripts/start_sillytavern.sh"
echo "  2) Open ST and import cards from: $ST_DIR/looptrain_imports/character_cards"
echo "  3) Import world info/book from: $ST_DIR/looptrain_imports/world_info and world_books"
echo "  4) Configure DeepSeek V4 Pro in ST"
echo "  5) Open LoopTrain and switch to 回复：ST LLM"
