#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Patch SillyTavern config.yaml for LoopTrain validation.
No external PyYAML dependency; only updates top-level keys used by this validation package.
"""
from __future__ import annotations
import argparse
from pathlib import Path
import re

def set_top_level_key(text: str, key: str, value: str) -> str:
    pattern = re.compile(rf"^({re.escape(key)}\s*:\s*).*$", re.MULTILINE)
    line = f"{key}: {value}"
    if pattern.search(text):
        return pattern.sub(line, text, count=1)
    if text and not text.endswith("\n"):
        text += "\n"
    return text + line + "\n"

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("config_yaml")
    ap.add_argument("--listen", choices=["true", "false"], default=None,
                    help="For local validation keep false. For remote host set true only behind auth/reverse proxy.")
    ap.add_argument("--port", default=None)
    args = ap.parse_args()

    path = Path(args.config_yaml)
    if not path.exists():
        raise SystemExit(f"config.yaml not found: {path}")

    text = path.read_text(encoding="utf-8")
    text = set_top_level_key(text, "enableServerPlugins", "true")
    if args.listen is not None:
        text = set_top_level_key(text, "listen", args.listen)
    if args.port:
        text = set_top_level_key(text, "port", str(args.port))

    path.write_text(text, encoding="utf-8")
    print(f"Patched {path}: enableServerPlugins=true" + (f", listen={args.listen}" if args.listen else ""))

if __name__ == "__main__":
    main()
