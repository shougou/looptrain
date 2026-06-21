#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SLT_DIR="$ROOT_DIR/looptrain/standalone"
PORT="${PORT:-3030}"
BASE_URL="http://127.0.0.1:${PORT}"

cd "$SLT_DIR"

echo "[SLT] Syntax and smoke tests"
npm run check
npm test

echo "[SLT] Materials validation"
python3 "$ROOT_DIR/looptrain/materials/tools/validate_materials.py"

echo "[SLT] Playwright E2E tests"
cd "$SLT_DIR" && npx playwright test

echo "[SLT] HTTP checks"
python3 - <<PY
import json
import urllib.request

base = "${BASE_URL}"
checks = [
    ("/", "text/html"),
    ("/api/health", "application/json"),
    ("/api/npcs", "application/json"),
]

for path, expected in checks:
    url = base + path
    with urllib.request.urlopen(url, timeout=5) as response:
        status = response.status
        content_type = response.headers.get("content-type", "")
        body = response.read().decode("utf-8", "ignore")
        print(status, path, content_type)
        if status != 200:
            raise SystemExit(f"{path} returned {status}")
        if expected not in content_type:
            raise SystemExit(f"{path} expected {expected}, got {content_type}")
        if path == "/api/health":
            data = json.loads(body)
            if not data.get("ok") or data.get("mode") != "standalone":
                raise SystemExit(f"health endpoint is not standalone: {data}")
        if path == "/" and "SillyTavern" in body:
            raise SystemExit("Standalone HTML unexpectedly contains SillyTavern")
PY

echo "[SLT] OK: local standalone runtime verified at ${BASE_URL}"
