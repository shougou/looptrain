#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
errors = []

required = [
    'st-extension/LoopTrain/manifest.json',
    'st-extension/LoopTrain/index.js',
    'st-extension/LoopTrain/style.css',
    'st-extension/LoopTrain/xiaoning_fear.png',
    'st-server-plugin/looptrain/index.js',
    'st-server-plugin/looptrain/engine.js',
    'materials/looptrain/episode/trial_001.episode.json',
    'materials/st_import/character_cards/xiaoning.card.json',
    'mock-harness/index.html',
]

for rel in required:
    if not (ROOT / rel).exists():
        errors.append(f'MISSING {rel}')

for path in ROOT.rglob('*.json'):
    try:
        json.loads(path.read_text(encoding='utf-8'))
    except Exception as exc:
        errors.append(f'JSON_ERROR {path.relative_to(ROOT)}: {exc}')

for card in (ROOT / 'materials/st_import/character_cards').glob('*.json'):
    data = json.loads(card.read_text(encoding='utf-8'))
    if data.get('spec') == 'chara_card_v2':
        ext = data.get('data', {}).get('extensions', {}).get('looptrain')
        if not ext:
            errors.append(f'CARD_NO_LOOPTRAIN_EXTENSION {card.name}')

node_tests = [
    ROOT / 'tests/engine_flow_test.js',
    ROOT / 'tests/hidden_node_test.js',
]
for t in node_tests:
    if t.exists():
        cp = subprocess.run(['node', str(t)], cwd=str(ROOT), text=True, capture_output=True)
        if cp.returncode != 0:
            errors.append(f'NODE_TEST_FAILED {t.name}: {cp.stderr or cp.stdout}')

if errors:
    print('\n'.join(errors))
    sys.exit(1)
print('OK: LoopTrain-ST package validated')
