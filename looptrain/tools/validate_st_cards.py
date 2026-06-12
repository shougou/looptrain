from pathlib import Path
from PIL import Image
import json, base64

root = Path(__file__).resolve().parents[1]
card_dir = root / "st-character-cards"
results = []
for path in sorted(card_dir.glob("*.png")):
    im = Image.open(path)
    text = im.text.get("chara")
    assert text, f"missing chara metadata: {path.name}"
    data = json.loads(base64.b64decode(text).decode("utf-8"))
    assert data.get("spec") == "chara_card_v2"
    name = data["data"]["name"]
    ext = data["data"].get("extensions", {}).get("looptrain", {})
    assert ext.get("npc_id")
    results.append(f"OK {path.name} -> {name} ({ext.get('npc_id')})")
print("\n".join(results))
