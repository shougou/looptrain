#!/usr/bin/env python3
"""Validate the SLT (Standalone LoopTrain) local package."""
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors = []

required = [
    'standalone/package.json',
    'standalone/server.js',
    'standalone/engine.js',
    'standalone/public/index.html',
    'standalone/public/app.js',
    'standalone/public/style.css',
    'standalone/tests/smoke_test.js',
    'materials/looptrain/episode/trial_001.episode.json',
    'materials/looptrain/clues/trial_001_clues.json',
    'materials/looptrain/rules/trial_001.rules.json',
    'materials/looptrain/scenes/carriage_7.scene.json',
]

for rel in required:
    if not (ROOT / rel).exists():
        errors.append(f'MISSING {rel}')

for path in [ROOT / 'materials' / 'looptrain', ROOT / 'standalone']:
    if path.exists():
        for json_path in path.rglob('*.json'):
            if any(part in {'node_modules', 'dist', '.astro'} for part in json_path.parts):
                continue
            try:
                json.loads(json_path.read_text(encoding='utf-8'))
            except Exception as exc:
                errors.append(f'JSON_ERROR {json_path.relative_to(ROOT)}: {exc}')

node_tests = [
    ROOT / 'tests/engine_flow_test.js',
    ROOT / 'tests/hidden_node_test.js',
    ROOT / 'tests/dialogue_turn_limit_test.js',
]
for test_file in node_tests:
    if test_file.exists():
        cp = subprocess.run(['node', str(test_file)], cwd=str(ROOT), text=True, capture_output=True)
        if cp.returncode != 0:
            errors.append(f'NODE_TEST_FAILED {test_file.name}: {cp.stderr or cp.stdout}')

standalone_dir = ROOT / 'standalone'
if standalone_dir.exists():
    cp = subprocess.run(['npm', 'run', 'check'], cwd=str(standalone_dir), text=True, capture_output=True)
    if cp.returncode != 0:
        errors.append(f'STANDALONE_CHECK_FAILED: {cp.stderr or cp.stdout}')
    cp = subprocess.run(['npm', 'test'], cwd=str(standalone_dir), text=True, capture_output=True)
    if cp.returncode != 0:
        errors.append(f'STANDALONE_TEST_FAILED: {cp.stderr or cp.stdout}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)

print('OK: Standalone LoopTrain package validated')
