#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLT_DIR="$ROOT_DIR/looptrain/standalone"
PORT="${PORT:-3030}"
LOG_FILE="${LOG_FILE:-/tmp/lt-server.log}"
PID_FILE="${PID_FILE:-/tmp/lt-server.pid}"

if [ ! -d "$SLT_DIR" ]; then
  echo "ERROR: Standalone LT directory not found: $SLT_DIR" >&2
  exit 1
fi

cd "$SLT_DIR"

if [ ! -d "node_modules" ]; then
  echo "[SLT] Installing dependencies..."
  npm install
fi

# Check if already running
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "[SLT] Already running (PID: $(cat $PID_FILE))"
  echo "[SLT] URL: http://127.0.0.1:${PORT}/"
  exit 0
fi

echo "[SLT] Starting Standalone LoopTrain"
echo "[SLT] URL: http://127.0.0.1:${PORT}/"
echo "[SLT] This is the local default runtime. SillyTavern is not required."

# Use nohup for background persistence
PORT="$PORT" nohup node server.js > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

echo "[SLT] Server started with PID: $SERVER_PID"
echo "[SLT] Logs: tail -f $LOG_FILE"

# Wait a moment and verify it's still running
sleep 2
if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "[SLT] Server is running successfully"
else
  echo "[SLT] ERROR: Server failed to start. Check logs: $LOG_FILE"
  rm -f "$PID_FILE"
  exit 1
fi
