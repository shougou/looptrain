#!/usr/bin/env python3
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
errors = []

for path in root.rglob('*.json'):
    try:
        data = json.loads(path.read_text(encoding='utf-8'))
    except Exception as e:
        errors.append(f'JSON parse error: {path}: {e}')
        continue
    if path.name.endswith('.card.json'):
        if data.get('spec') != 'chara_card_v2':
            errors.append(f'Not chara_card_v2: {path}')
        if 'data' not in data or 'extensions' not in data['data']:
            errors.append(f'Missing data.extensions: {path}')
        if 'looptrain' not in data.get('data', {}).get('extensions', {}):
            errors.append(f'Missing extensions.looptrain: {path}')

if errors:
    print('\n'.join(errors))
    raise SystemExit(1)

print('OK: all JSON files parsed and ST character cards include extensions.looptrain')
