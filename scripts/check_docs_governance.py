#!/usr/bin/env python3
"""Lightweight documentation governance checks for LoopTrain.

This script intentionally has no third-party dependencies. It validates the
minimum rules documented in TBD/0000-document-governance.md:

- TBD drafts need basic draft metadata.
- Devlog articles need schema-required fields and precise dates for sorting.
- Public Markdown should not contain obvious secrets.
- Legacy ST terms should be explicitly marked as legacy/history when used.

The checker is a guardrail, not a full content reviewer. It prints actionable
errors/warnings and exits non-zero only for hard failures.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]

TBD_DIR = ROOT / "TBD"
DEVLOG_DIR = ROOT / "devlog" / "src" / "content" / "devlog"
CHARACTERS_DIR = ROOT / "devlog" / "src" / "content" / "characters"
FORMAL_DOC_DIRS = (
    ROOT / "devlog" / "src" / "content" / "design",
    ROOT / "devlog" / "src" / "content" / "technical",
    ROOT / "devlog" / "src" / "content" / "decisions",
)
TBD_REQUIRED_FIELDS = ("status", "type", "topic", "created", "updated")
DEVLOG_REQUIRED_FIELDS = ("title", "date", "version", "status", "summary")
FORMAL_DOC_REQUIRED_FIELDS = (
    "title",
    "date",
    "status",
    "version",
    "lastVerified",
    "scope",
    "spoilerLevel",
    "summary",
)
DEVLOG_ALLOWED_STATUS = {"idea", "planning", "doing", "done", "paused", "cancelled"}
FORMAL_DOC_ALLOWED_STATUS = {"current", "planned", "stale", "legacy", "deprecated"}
FORMAL_DOC_ALLOWED_SPOILER = {"none", "light", "internal", "core"}
CHARACTER_ALLOWED_SPOILER = {"none", "mild", "critical"}

LEGACY_PATTERNS = (
    "SillyTavern",
    "ST Extension",
    "ST Server Plugin",
    "/api/plugins/looptrain",
    "?looptrain=game",
)
LEGACY_CONTEXT = ("legacy", "历史", "不代表当前", "旧", "已移除", "不再")

SECRET_PATTERNS = (
    re.compile(r"sk-[A-Za-z0-9_-]{16,}"),
    re.compile(r"(?i)(api[_-]?key|secret|password)\s*[:=]\s*['\"]?[A-Za-z0-9_./+-]{12,}"),
    re.compile(r"-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----"),
)

ISO_DATE_WITH_TIME = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$")
YAML_LINE = re.compile(r"^([A-Za-z0-9_-]+):\s*(.*)$")


@dataclass(frozen=True)
class Issue:
    severity: str
    path: Path
    message: str

    def format(self) -> str:
        rel = self.path.relative_to(ROOT)
        return f"[{self.severity}] {rel}: {self.message}"


def markdown_files(directory: Path) -> Iterable[Path]:
    if not directory.exists():
        return ()
    return sorted(directory.rglob("*.md"))


def parse_frontmatter(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}, text

    data: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        match = YAML_LINE.match(line)
        if match:
            key, raw_value = match.groups()
            data[key] = raw_value.strip().strip('"\'')
    return data, text


def check_required_fields(
    path: Path,
    frontmatter: dict[str, str],
    fields: tuple[str, ...],
    severity: str = "ERROR",
) -> list[Issue]:
    return [
        Issue(severity, path, f"missing frontmatter field `{field}`")
        for field in fields
        if not frontmatter.get(field)
    ]


def check_tbd(path: Path) -> list[Issue]:
    frontmatter, text = parse_frontmatter(path)
    severity = "ERROR" if path.name.startswith("000") else "WARN"
    issues = check_required_fields(path, frontmatter, TBD_REQUIRED_FIELDS, severity)

    status = frontmatter.get("status")
    if status and status not in {"draft", "reviewing", "accepted", "rejected", "superseded"}:
        issues.append(Issue("ERROR", path, f"unexpected TBD status `{status}`"))

    issues.extend(check_secrets(path, text))
    return issues


def check_devlog(path: Path) -> list[Issue]:
    frontmatter, text = parse_frontmatter(path)
    issues = check_required_fields(path, frontmatter, DEVLOG_REQUIRED_FIELDS)

    status = frontmatter.get("status")
    if status and status not in DEVLOG_ALLOWED_STATUS:
        issues.append(Issue("ERROR", path, f"devlog status `{status}` is not allowed"))

    date = frontmatter.get("date")
    if date and not ISO_DATE_WITH_TIME.match(date):
        severity = "ERROR" if path.name.startswith("2026-06-15-") else "WARN"
        issues.append(Issue(severity, path, "devlog `date` must include time and timezone for stable sorting"))

    issues.extend(check_secrets(path, text))
    issues.extend(check_legacy_terms(path, text, frontmatter))
    return issues


def check_character(path: Path) -> list[Issue]:
    frontmatter, text = parse_frontmatter(path)
    issues: list[Issue] = []
    spoiler = frontmatter.get("spoilerLevel")
    if spoiler and spoiler not in CHARACTER_ALLOWED_SPOILER:
        issues.append(Issue("ERROR", path, f"unexpected character spoilerLevel `{spoiler}`"))
    issues.extend(check_secrets(path, text))
    return issues


def check_formal_doc(path: Path) -> list[Issue]:
    frontmatter, text = parse_frontmatter(path)
    issues = check_required_fields(path, frontmatter, FORMAL_DOC_REQUIRED_FIELDS)

    status = frontmatter.get("status")
    if status and status not in FORMAL_DOC_ALLOWED_STATUS:
        issues.append(Issue("ERROR", path, f"formal doc status `{status}` is not allowed"))

    spoiler = frontmatter.get("spoilerLevel")
    if spoiler and spoiler not in FORMAL_DOC_ALLOWED_SPOILER:
        issues.append(Issue("ERROR", path, f"formal doc spoilerLevel `{spoiler}` is not allowed"))

    date = frontmatter.get("date")
    if date and not ISO_DATE_WITH_TIME.match(date):
        issues.append(Issue("ERROR", path, "formal doc `date` must include time and timezone for stable sorting"))

    issues.extend(check_secrets(path, text))
    issues.extend(check_legacy_terms(path, text, frontmatter))
    return issues


def check_secrets(path: Path, text: str) -> list[Issue]:
    issues: list[Issue] = []
    for pattern in SECRET_PATTERNS:
        if pattern.search(text):
            issues.append(Issue("ERROR", path, "possible secret or private key pattern found"))
    return issues


def check_legacy_terms(path: Path, text: str, frontmatter: dict[str, str]) -> list[Issue]:
    if not any(term in text for term in LEGACY_PATTERNS):
        return []
    if frontmatter.get("status") == "legacy":
        return []
    if any(marker in text for marker in LEGACY_CONTEXT):
        return []
    return [Issue("WARN", path, "legacy ST/SillyTavern term appears without explicit legacy/history context")]


def collect_issues() -> list[Issue]:
    issues: list[Issue] = []

    for path in markdown_files(TBD_DIR):
        issues.extend(check_tbd(path))

    for path in markdown_files(DEVLOG_DIR):
        issues.extend(check_devlog(path))

    for path in markdown_files(CHARACTERS_DIR):
        issues.extend(check_character(path))

    for directory in FORMAL_DOC_DIRS:
        for path in markdown_files(directory):
            issues.extend(check_formal_doc(path))

    return issues


def main() -> int:
    issues = collect_issues()
    errors = [issue for issue in issues if issue.severity == "ERROR"]
    warnings = [issue for issue in issues if issue.severity == "WARN"]

    for issue in issues:
        print(issue.format())

    print(
        f"Documentation governance check: {len(errors)} error(s), {len(warnings)} warning(s)."
    )
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
