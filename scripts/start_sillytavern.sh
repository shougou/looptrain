#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ST_DIR="${ST_DIR:-$ROOT_DIR/workspace/SillyTavern}"
if [ ! -d "$ST_DIR" ]; then
  echo "ERROR: SillyTavern not found. Run scripts/setup_linux.sh first."
  exit 1
fi
cd "$ST_DIR"
echo "[LoopTrain] Starting SillyTavern from $ST_DIR"
if [ -x "./start.sh" ]; then
  bash ./start.sh
else
  npm run start
fi
