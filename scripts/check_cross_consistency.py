#!/usr/bin/env python3
"""Cross-document consistency checker for LoopTrain.

Checks that documentation claims match actual codebase state:
1. PROJECT_STRUCTURE.md referenced directories exist
2. looptrain/AGENT.md §4 listed files exist
3. Root README.md "尚未具备" vs PROJECT_STATUS "已完成" contradictions
4. CHANGELOG "Removed" section IDs still in code → WARN
5. CHANGELOG "Added" section IDs missing from code → WARN

Exit code: 0 = no ERROR, 1 = has ERROR. WARN does not affect exit code.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class Issue:
    severity: str
    check: str
    message: str

    def format(self) -> str:
        return f"[{self.severity}] {self.check}: {self.message}"


def collect_issues() -> list[Issue]:
    issues: list[Issue] = []
    issues.extend(check_project_structure_dirs())
    issues.extend(check_agent_md_files())
    issues.extend(check_readme_vs_status())
    issues.extend(check_changelog_removed())
    issues.extend(check_changelog_added())
    return issues


# ── Check 1: PROJECT_STRUCTURE.md referenced directories exist ──

def check_project_structure_dirs() -> list[Issue]:
    issues: list[Issue] = []
    path = ROOT / "PROJECT_STRUCTURE.md"
    if not path.exists():
        return [Issue("ERROR", "check-1-structure-dirs", "PROJECT_STRUCTURE.md not found")]

    text = path.read_text(encoding="utf-8")
    dir_pattern = re.compile(r'[├└]──\s+([a-zA-Z0-9_.-]+)/\s')
    referenced_dirs = set(dir_pattern.findall(text))

    skip_dirs = {'node_modules', 'dist', '.astro', '__pycache__', '.git'}
    for dirname in sorted(referenced_dirs):
        if dirname in skip_dirs:
            continue
        found_anywhere = False
        for root_dir in [ROOT, ROOT / "looptrain", ROOT / "looptrain" / "standalone",
                         ROOT / "looptrain" / "materials", ROOT / "looptrain" / "materials" / "looptrain",
                         ROOT / "looptrain" / "materials" / "runtime",
                         ROOT / "devlog", ROOT / "devlog" / "src",
                         ROOT / "docs"]:
            if (root_dir / dirname).is_dir():
                found_anywhere = True
                break
        if not found_anywhere:
            issues.append(Issue("ERROR", "check-1-structure-dirs",
                                f"PROJECT_STRUCTURE.md references '{dirname}/' but directory does not exist anywhere in project"))

    if not issues:
        issues.append(Issue("PASS", "check-1-structure-dirs",
                            "All referenced directories exist"))
    return issues


# ── Check 2: looptrain/AGENT.md §4 listed files exist ──

def check_agent_md_files() -> list[Issue]:
    issues: list[Issue] = []
    path = ROOT / "looptrain" / "AGENT.md"
    if not path.exists():
        return [Issue("ERROR", "check-2-agent-files", "looptrain/AGENT.md not found")]

    text = path.read_text(encoding="utf-8")
    section_match = re.search(r'## 4\..*?(?=\n## \d)', text, re.DOTALL)
    if not section_match:
        return [Issue("WARN", "check-2-agent-files", "Could not find §4 in AGENT.md")]

    section = section_match.group()
    file_pattern = re.compile(r'[├└│]+\s+([a-zA-Z0-9_./-]+\.[a-z]+)')
    referenced_files = set(file_pattern.findall(section))

    base = ROOT / "looptrain"
    for relpath in sorted(referenced_files):
        candidates = [base / relpath, base / "standalone" / relpath, base / "materials" / relpath]
        if not any(c.exists() for c in candidates):
            issues.append(Issue("ERROR", "check-2-agent-files",
                                f"AGENT.md §4 references '{relpath}' but file not found"))

    if not issues:
        issues.append(Issue("PASS", "check-2-agent-files",
                            "All referenced files in AGENT.md §4 exist"))
    return issues


# ── Check 3: README.md "尚未具备" vs PROJECT_STATUS "已完成" contradictions ──

def check_readme_vs_status() -> list[Issue]:
    issues: list[Issue] = []
    readme_path = ROOT / "README.md"
    status_path = ROOT / "docs" / "project" / "PROJECT_STATUS.md"

    if not readme_path.exists() or not status_path.exists():
        return [Issue("WARN", "check-3-readme-status", "README.md or PROJECT_STATUS.md not found")]

    readme_text = readme_path.read_text(encoding="utf-8")
    status_text = status_path.read_text(encoding="utf-8")

    readme_section = re.search(r'### SLT 尚未具备\s*\n(.*?)(?=\n###|\n---|\Z)', readme_text, re.DOTALL)
    if not readme_section:
        return [Issue("WARN", "check-3-readme-status", "Could not find 'SLT 尚未具备' section in README.md")]

    readme_not_done = readme_section.group(1)

    status_section = re.search(r'## 最近完成\s*\n(.*?)(?=\n## |\Z)', status_text, re.DOTALL)
    if not status_section:
        return [Issue("WARN", "check-3-readme-status", "Could not find '最近完成' section in PROJECT_STATUS.md")]

    status_done = status_section.group(1)

    contradiction_terms = {
        "音效": "音效系统",
        "内容完全外置化": "内容外置化",
        "内容外置": "内容外置化",
        "LLM Bridge": "LLM Bridge",
        "Playwright": "Playwright",
    }

    for term, label in contradiction_terms.items():
        if term in readme_not_done and label in status_done:
            issues.append(Issue("WARN", "check-3-readme-status",
                                f"README.md lists '{label}' as '尚未具备' but PROJECT_STATUS.md lists it as '最近完成'"))

    if not issues:
        issues.append(Issue("PASS", "check-3-readme-status",
                            "No contradictions between README.md and PROJECT_STATUS.md"))
    return issues


# ── Check 4: CHANGELOG "Removed" section IDs still in code ──

def check_changelog_removed() -> list[Issue]:
    issues: list[Issue] = []
    changelog_path = ROOT / "docs" / "project" / "CHANGELOG.md"
    if not changelog_path.exists():
        return [Issue("WARN", "check-4-changelog-removed", "CHANGELOG.md not found")]

    text = changelog_path.read_text(encoding="utf-8")
    removed_sections = re.findall(r'### Removed\s*\n(.*?)(?=\n###|\n## |\Z)', text, re.DOTALL)

    id_pattern = re.compile(r'[a-z_]+(?:_[a-z]+)+')
    name_pattern = re.compile(r'[^\s（）()]+（([a-z_]+)）')

    removed_ids: set[str] = set()
    for section in removed_sections:
        for match in name_pattern.finditer(section):
            removed_ids.add(match.group(1))
        for match in id_pattern.finditer(section):
            uid = match.group()
            if len(uid) > 5 and '_' in uid:
                removed_ids.add(uid)

    search_dirs = [ROOT / "looptrain" / "standalone", ROOT / "looptrain" / "materials" / "runtime"]
    for rid in sorted(removed_ids):
        if rid in ('standalone_mvp',):
            continue
        found = False
        for search_dir in search_dirs:
            if not search_dir.exists():
                continue
            for filepath in search_dir.rglob("*"):
                if filepath.is_file() and filepath.suffix in ('.js', '.json', '.ts', '.html'):
                    if 'node_modules' in str(filepath) or '/dist/' in str(filepath):
                        continue
                    try:
                        content = filepath.read_text(encoding="utf-8")
                        if rid in content:
                            found = True
                            break
                    except (UnicodeDecodeError, PermissionError):
                        pass
            if found:
                break
        if found:
            issues.append(Issue("WARN", "check-4-changelog-removed",
                                f"CHANGELOG says '{rid}' was removed, but it still appears in code"))

    if not issues:
        issues.append(Issue("PASS", "check-4-changelog-removed",
                            "No removed IDs found in code"))
    return issues


# ── Check 5: CHANGELOG "Added" section IDs missing from code ──

def check_changelog_added() -> list[Issue]:
    issues: list[Issue] = []
    changelog_path = ROOT / "docs" / "project" / "CHANGELOG.md"
    if not changelog_path.exists():
        return [Issue("WARN", "check-5-changelog-added", "CHANGELOG.md not found")]

    text = changelog_path.read_text(encoding="utf-8")
    added_sections = re.findall(r'### Added\s*\n(.*?)(?=\n###|\n## |\Z)', text, re.DOTALL)

    feature_terms = {
        "GoalEngine": "GoalEngine",
        "SaveMeta": "SaveMeta",
        "lt:save:": "lt:save:",
        "CommandRegistry": "CommandRegistry",
        "PortraitIntro": "PortraitIntro",
    }

    added_text = "\n".join(added_sections)
    claimed_features: list[str] = []
    for term, label in feature_terms.items():
        if term in added_text:
            claimed_features.append(label)

    search_dirs = [ROOT / "looptrain" / "standalone", ROOT / "looptrain" / "materials" / "runtime"]
    for feature in claimed_features:
        search_term = feature
        found = False
        for search_dir in search_dirs:
            if not search_dir.exists():
                continue
            for filepath in search_dir.rglob("*"):
                if filepath.is_file() and filepath.suffix in ('.js', '.json', '.ts', '.html'):
                    if 'node_modules' in str(filepath) or '/dist/' in str(filepath):
                        continue
                    try:
                        content = filepath.read_text(encoding="utf-8")
                        if search_term.lower() in content.lower():
                            found = True
                            break
                    except (UnicodeDecodeError, PermissionError):
                        pass
            if found:
                break
        if not found:
            issues.append(Issue("WARN", "check-5-changelog-added",
                                f"CHANGELOG says '{feature}' was added, but not found in code"))

    if not issues:
        issues.append(Issue("PASS", "check-5-changelog-added",
                            "All added features found in code"))
    return issues


def main() -> int:
    issues = collect_issues()

    for issue in issues:
        print(issue.format())

    errors = [i for i in issues if i.severity == "ERROR"]
    warnings = [i for i in issues if i.severity == "WARN"]
    passes = [i for i in issues if i.severity == "PASS"]

    print()
    print(f"Cross-consistency check: {len(errors)} error(s), {len(warnings)} warning(s), {len(passes)} pass(s).")
    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
