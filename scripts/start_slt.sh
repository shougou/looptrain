#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLT_DIR="$ROOT_DIR/looptrain/standalone"
PORT="${PORT:-3030}"

if [ ! -d "$SLT_DIR" ]; then
  echo "ERROR: Standalone LT directory not found: $SLT_DIR" >&2
  exit 1
fi

cd "$SLT_DIR"

if [ ! -d "node_modules" ]; then
  echo "[SLT] Installing dependencies..."
  npm install
fi

echo "[SLT] Starting Standalone LoopTrain"
echo "[SLT] URL: http://127.0.0.1:${PORT}/"
echo "[SLT] This is the local default runtime. SillyTavern is not required."
PORT="$PORT" npm start
