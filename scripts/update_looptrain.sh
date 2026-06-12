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

if [ -d "$ST_DIR/.git" ] && [ -f "$ST_DIR/public/index.html" ]; then
  git -C "$ST_DIR" checkout -- public/index.html
  echo "[LoopTrain] Restored ST public/index.html before boot-hide injection"
fi

if [ -f "$ROOT_DIR/scripts/boot-hide.html" ] && [ -f "$ST_DIR/public/index.html" ]; then
  python3 - "$ST_DIR/public/index.html" "$ROOT_DIR/scripts/boot-hide.html" <<'PY'
from pathlib import Path
import sys
index_path = Path(sys.argv[1])
snippet_path = Path(sys.argv[2])
boot_tokens = (
    'LOOPTRAIN_BOOT_SNIPPET',
    'lt-game-boot',
    'lt-boot-hide-st',
    'lt-boot-overlay',
    'lt-boot-pulse',
    'lt-boot-fade-in',
    'looptrain:game-ready',
    'looptrain:game-error',
    'lt-game-ready',
    'lt-boot-error-msg',
    'if(o)o.remove',
)
lines = index_path.read_text(encoding='utf-8').splitlines()
clean = []
skipping = False
for line in lines:
    if 'LOOPTRAIN_BOOT_SNIPPET_START' in line:
        skipping = True
        continue
    if 'LOOPTRAIN_BOOT_SNIPPET_END' in line:
        skipping = False
        continue
    if skipping:
        continue
    if any(token in line for token in boot_tokens):
        continue
    clean.append(line)
snippet = snippet_path.read_text(encoding='utf-8').splitlines()
for idx, line in enumerate(clean):
    if '<head>' in line:
        clean[idx + 1:idx + 1] = snippet
        break
else:
    raise SystemExit('ST index.html missing <head>')
index_path.write_text('\n'.join(clean) + '\n', encoding='utf-8')
PY
  echo "[LoopTrain] Boot-hide overlay refreshed in ST index.html"
fi

echo "OK: LoopTrain updated. Restart SillyTavern."
