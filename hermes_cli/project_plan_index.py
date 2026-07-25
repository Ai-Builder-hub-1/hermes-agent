"""Cross-project plan scanner for the Hermes command center."""

from __future__ import annotations

import json
import os
import re
from hashlib import sha1
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


DEFAULT_PROJECTS_ROOT = Path("/Users/hq/Workspace/projects")
DEFAULT_DASHBOARD_REGISTRY = Path("hermes.dashboards.json")

IGNORED_DIRS = {
    ".cache",
    ".git",
    ".hermes",
    ".mypy_cache",
    ".next",
    ".pytest_cache",
    ".ruff_cache",
    ".turbo",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "vendor",
    "venv",
}

PLAN_NAME_PATTERNS = (
    "plan",
    "plans",
    "readiness",
    "roadmap",
    "backlog",
    "task",
    "tasks",
    "todo",
    "tracking",
    "closeout",
    "status",
)

REFERENCE_ROOTS = {
    "apps",
    "optional-skills",
    "packages",
    "packaging",
    "plugins",
    "providers",
    "skills",
    "tests",
    "ui-tui",
    "web",
    "website",
}
TEMPLATE_MARKERS = {"template", "templates"}
REFERENCE_MARKERS = {"contracts", "standards", "references"}

CHECKBOX_RE = re.compile(r"^\s*(?:[-*]|\d+\.)\s+\[(?P<mark>[ xX~!\-])\]\s+(?P<text>.+?)\s*$")
BULLET_RE = re.compile(r"^\s*(?:[-*]|\d+\.)\s+(?P<text>(?!\[[ xX~!\-]\]).+?)\s*$")
HEADING_RE = re.compile(r"^(?P<marks>#{1,6})\s+(?P<title>.+?)\s*$")
PERCENT_RE = re.compile(r"(?P<value>\d{1,3}(?:\.\d+)?)\s*%")
RATIO_RE = re.compile(r"(?P<done>\d+)\s*/\s*(?P<total>\d+)")

BUILD_WORDS = {
    "add",
    "build",
    "create",
    "implement",
    "migration",
    "schema",
    "test",
    "ui",
    "workflow",
}
INTEGRATION_WORDS = {
    "adapter",
    "api",
    "connector",
    "credential",
    "endpoint",
    "import",
    "ingest",
    "oauth",
    "provider",
    "sync",
    "token",
    "webhook",
}
PRODUCTION_WORDS = {
    "deploy",
    "dns",
    "github",
    "health",
    "hetzner",
    "production",
    "secret",
    "smoke",
    "uptime",
    "verify",
}
DECISION_WORDS = {
    "approve",
    "choose",
    "confirm",
    "decide",
    "decision",
    "manual",
    "owner",
    "select",
}
HUMAN_WORDS = {
    "approval",
    "approve",
    "credential",
    "human",
    "manual",
    "operator",
    "owner",
    "permission",
    "token",
}
BACKLOG_WORDS = {
    "backlog",
    "gap",
    "known issue",
    "remaining",
    "todo",
}
ACTIONABLE_SECTION_WORDS = {
    "action",
    "backlog",
    "blocker",
    "blocked",
    "follow-up",
    "gap",
    "human",
    "known",
    "next",
    "open",
    "remaining",
    "task",
    "todo",
}
ACTIONABLE_BULLET_PREFIXES = (
    "add ",
    "build ",
    "configure ",
    "confirm ",
    "connect ",
    "create ",
    "decide ",
    "deploy ",
    "fix ",
    "implement ",
    "integrate ",
    "migrate ",
    "need ",
    "needs ",
    "resolve ",
    "ship ",
    "standardize ",
    "track ",
    "verify ",
)
NON_ACTIONABLE_BULLET_PREFIXES = (
    "acceptance:",
    "done:",
    "evidence:",
    "example:",
    "note:",
    "owner:",
    "pass:",
    "source:",
    "status:",
    "validation:",
)


@dataclass(frozen=True)
class DashboardProject:
    dashboard_id: str
    project_path: Path
    url: str = ""
    health_url: str = ""


def build_project_plan_index(
    projects_root: str | os.PathLike[str] | None = None,
    registry_path: str | os.PathLike[str] | None = None,
) -> dict[str, Any]:
    """Scan known projects and return a command-center plan index."""

    root = Path(projects_root).expanduser() if projects_root else DEFAULT_PROJECTS_ROOT
    registry = Path(registry_path).expanduser() if registry_path else Path.cwd() / DEFAULT_DASHBOARD_REGISTRY
    dashboards = _load_dashboard_projects(registry)
    projects = _discover_projects(root, dashboards)
    project_summaries = []
    for project_path in projects:
        dashboard = dashboards.get(project_path)
        summary = _summarize_project(project_path, dashboard)
        if summary["documents"] or dashboard is not None:
            project_summaries.append(summary)

    totals = {
        "projects": len(project_summaries),
        "plans": sum(len(project["plans"]) for project in project_summaries),
        "rawDocuments": sum(len(project["documents"]) for project in project_summaries),
        "referenceDocuments": sum(project["documentCounts"]["reference"] for project in project_summaries),
        "templateDocuments": sum(project["documentCounts"]["template"] for project in project_summaries),
        "ignoredDocuments": sum(project["documentCounts"]["ignored"] for project in project_summaries),
        "openItems": sum(project["openItems"] for project in project_summaries),
        "rawOpenItems": sum(project["rawOpenItems"] for project in project_summaries),
        "buildItems": sum(project["remainingCounts"]["build"] for project in project_summaries),
        "integrationItems": sum(project["remainingCounts"]["integration"] for project in project_summaries),
        "productionItems": sum(project["remainingCounts"]["production"] for project in project_summaries),
        "decisionItems": sum(project["remainingCounts"]["decision"] for project in project_summaries),
        "humanItems": sum(project["remainingCounts"]["human"] for project in project_summaries),
        "backlogItems": sum(project["remainingCounts"]["backlog"] for project in project_summaries),
        "blockedItems": sum(project["blockedItems"] for project in project_summaries),
    }

    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "projectsRoot": str(root),
        "registryPath": str(registry),
        "totals": totals,
        "projects": project_summaries,
        "globalRemaining": _global_remaining(project_summaries),
        "workQueue": _global_work_queue(project_summaries),
    }


def _load_dashboard_projects(registry_path: Path) -> dict[Path, DashboardProject]:
    if not registry_path.exists():
        return {}
    try:
        data = json.loads(registry_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}

    projects: dict[Path, DashboardProject] = {}
    raw_dashboards = data.get("dashboards") or {}
    if isinstance(raw_dashboards, dict):
        dashboard_rows = [
            {"id": dashboard_id, **raw}
            for dashboard_id, raw in raw_dashboards.items()
            if isinstance(raw, dict)
        ]
    elif isinstance(raw_dashboards, list):
        dashboard_rows = [raw for raw in raw_dashboards if isinstance(raw, dict)]
    else:
        dashboard_rows = []

    for raw in dashboard_rows:
        dashboard_id = str(raw.get("id") or raw.get("dashboardId") or "")
        project_path = raw.get("projectPath")
        if not project_path and dashboard_id == "nous-hermes-agent.dashboard":
            project_path = registry_path.parent
        if not project_path:
            continue
        path = Path(project_path).expanduser().resolve()
        projects[path] = DashboardProject(
            dashboard_id=dashboard_id,
            project_path=path,
            url=str(raw.get("url") or ""),
            health_url=str(raw.get("healthUrl") or ""),
        )
    return projects


def _discover_projects(root: Path, dashboards: dict[Path, DashboardProject]) -> list[Path]:
    discovered = {path for path in dashboards if path.exists() and path.is_dir()}
    if root.exists() and root.is_dir():
        for child in root.iterdir():
            if child.is_dir() and child.name not in IGNORED_DIRS:
                discovered.add(child.resolve())
    return sorted(discovered, key=lambda path: path.name.lower())


def _summarize_project(project_path: Path, dashboard: DashboardProject | None) -> dict[str, Any]:
    documents = [_summarize_plan(path, project_path) for path in _find_plan_files(project_path)]
    plans = [document for document in documents if document["documentKind"] == "actual"]
    remaining = _empty_category_lists()
    all_items: list[dict[str, Any]] = []
    for plan in plans:
        for item in plan["items"]:
            if item["state"] == "done":
                continue
            all_items.append(item)
            for category in item["categories"]:
                remaining[category].append(item)

    open_items = len(all_items)
    raw_open_items = sum(
        1
        for document in documents
        for item in document["items"]
        if item["state"] != "done"
    )
    completed = sum(plan["completed"] for plan in plans)
    total = sum(plan["total"] for plan in plans)
    completion = round((completed / total) * 100) if total else 0
    blocked_items = sum(1 for item in all_items if item["state"] == "blocked" or item["blocked"])
    human_items = sum(1 for item in all_items if item["humanRequired"])
    document_counts = {
        "actual": len(plans),
        "reference": sum(1 for document in documents if document["documentKind"] == "reference"),
        "template": sum(1 for document in documents if document["documentKind"] == "template"),
        "ignored": sum(1 for document in documents if document["documentKind"] == "ignored"),
    }

    return {
        "name": project_path.name,
        "path": str(project_path),
        "dashboardId": dashboard.dashboard_id if dashboard else "",
        "url": dashboard.url if dashboard else "",
        "healthUrl": dashboard.health_url if dashboard else "",
        "documents": [_strip_plan_items(document) for document in documents],
        "documentCounts": document_counts,
        "plans": [_strip_plan_items(plan) for plan in plans],
        "planWork": [_plan_work_summary(plan) for plan in plans],
        "workItems": _project_work_items(project_path.name, str(project_path), plans),
        "completionPercent": completion,
        "openItems": open_items,
        "rawOpenItems": raw_open_items,
        "blockedItems": blocked_items,
        "humanItems": human_items,
        "remainingCounts": {key: len(value) for key, value in remaining.items()},
        "remaining": {key: value[:25] for key, value in remaining.items()},
        "nextActions": _next_actions(all_items),
    }


def _find_plan_files(project_path: Path) -> list[Path]:
    candidates: list[Path] = []
    for path in _walk_files(project_path):
        if path.suffix.lower() not in {".md", ".mdx", ".txt"}:
            continue
        relative_parts = {part.lower() for part in path.relative_to(project_path).parts}
        stem = path.stem.lower()
        if "docs" in relative_parts or "plans" in relative_parts or "tasks" in relative_parts:
            if any(pattern in stem for pattern in PLAN_NAME_PATTERNS):
                candidates.append(path)
                continue
        if path.name.lower() in {"readme.md", "tasks.md", "todo.md", "backlog.md"}:
            candidates.append(path)
    return sorted(candidates, key=lambda path: str(path.relative_to(project_path)).lower())[:80]


def _walk_files(root: Path) -> Iterable[Path]:
    for current_root, dirs, files in os.walk(root):
        dirs[:] = [name for name in dirs if name not in IGNORED_DIRS]
        for filename in files:
            yield Path(current_root) / filename


def _summarize_plan(path: Path, project_path: Path) -> dict[str, Any]:
    items: list[dict[str, Any]] = []
    headings: list[str] = []
    explicit_percentages: list[float] = []
    ratios: list[tuple[int, int]] = []
    title = path.stem.replace("-", " ").replace("_", " ").title()
    relative_path = str(path.relative_to(project_path))

    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except OSError:
        lines = []

    for line_number, line in enumerate(lines, start=1):
        heading_match = HEADING_RE.match(line)
        if heading_match:
            level = len(heading_match.group("marks"))
            heading = heading_match.group("title").strip()
            headings = headings[: level - 1] + [heading]
            if line_number == 1:
                title = heading

        for percent_match in PERCENT_RE.finditer(line):
            value = float(percent_match.group("value"))
            if 0 <= value <= 100:
                explicit_percentages.append(value)

        for ratio_match in RATIO_RE.finditer(line):
            done = int(ratio_match.group("done"))
            total = int(ratio_match.group("total"))
            if 0 <= done <= total <= 500:
                ratios.append((done, total))

        checkbox_match = CHECKBOX_RE.match(line)
        bullet_match = None if checkbox_match else BULLET_RE.match(line)
        if checkbox_match:
            mark = checkbox_match.group("mark").lower()
            text = checkbox_match.group("text").strip()
            state = "done" if mark == "x" else "blocked" if mark == "!" else "partial" if mark in {"~", "-"} else "open"
        elif bullet_match and _should_capture_bullet(relative_path, bullet_match.group("text"), headings):
            text = bullet_match.group("text").strip()
            state = "blocked" if _looks_blocked(text, " ".join(headings)) else "open"
        else:
            continue
        section = " ".join(headings)
        categories = _categorize_item(text, section, relative_path)
        blocked = state == "blocked" or _looks_blocked(text, section)
        human_required = _needs_human(text, section)
        items.append({
            "id": _item_id(relative_path, line_number, text),
            "text": text,
            "state": state,
            "categories": categories,
            "blocked": blocked,
            "humanRequired": human_required,
            "sourcePath": relative_path,
            "line": line_number,
            "section": " / ".join(headings),
            "planTitle": title,
        })

    completed = sum(1 for item in items if item["state"] == "done")
    partial = sum(1 for item in items if item["state"] == "partial")
    blocked = sum(1 for item in items if item["state"] == "blocked")
    open_count = sum(1 for item in items if item["state"] == "open")
    explicit_completion = round(sum(explicit_percentages) / len(explicit_percentages)) if explicit_percentages else None
    ratio_completion = None
    if ratios:
        done = sum(pair[0] for pair in ratios)
        total = sum(pair[1] for pair in ratios)
        ratio_completion = round((done / total) * 100) if total else None

    if items:
        completion = round((completed / len(items)) * 100)
    elif explicit_completion is not None:
        completion = explicit_completion
    elif ratio_completion is not None:
        completion = ratio_completion
    else:
        completion = 0

    document_kind, document_reason = _classify_document(relative_path, title, len(items))

    return {
        "title": title,
        "relativePath": relative_path,
        "documentKind": document_kind,
        "documentReason": document_reason,
        "completed": completed,
        "partial": partial,
        "blocked": blocked,
        "open": open_count,
        "total": len(items),
        "completionPercent": completion,
        "explicitCompletion": explicit_completion,
        "ratioCompletion": ratio_completion,
        "items": items,
    }


def _classify_document(relative_path: str, title: str, item_count: int) -> tuple[str, str]:
    parts = tuple(part.lower() for part in Path(relative_path).parts)
    name = parts[-1] if parts else relative_path.lower()
    haystack = f"{relative_path} {title}".lower()

    if any(marker in parts or marker in name for marker in TEMPLATE_MARKERS):
        return "template", "Template/reference pattern, not project execution work."
    if "site-packages" in parts or "venv" in parts:
        return "ignored", "Dependency or virtualenv documentation."
    if parts and parts[0] in REFERENCE_ROOTS:
        if "plan" in haystack and parts[0] == "website":
            return "reference", "Website documentation about planning, not this project's active plan."
        if item_count:
            return "reference", "Subpackage, skill, plugin, test, or app documentation with checklist content."
        return "ignored", "Subpackage, skill, plugin, test, or app README/reference document."
    if any(marker in parts for marker in REFERENCE_MARKERS):
        return "reference", "Contract, standard, or reference document."
    if name == "readme.md" and not any(pattern in haystack for pattern in ("plan", "readiness", "roadmap", "backlog", "task", "status")):
        return "ignored", "General README without active planning signals."
    if item_count or any(pattern in haystack for pattern in PLAN_NAME_PATTERNS):
        return "actual", "Actionable project planning, readiness, backlog, roadmap, or task document."
    return "reference", "Planning-adjacent document without actionable checklist items."


def _categorize_item(text: str, section: str, relative_path: str = "") -> list[str]:
    categories = _categories_for_text(text)
    if _looks_backlog(text, section, relative_path) and "backlog" not in categories:
        categories.append("backlog")
    if _needs_human(text, section) and "human" not in categories:
        categories.append("human")
    if categories:
        return categories
    section_categories = [
        category
        for category in _categories_for_text(section)
        if category in {"human", "backlog", "decision"}
    ]
    return section_categories or ["build"]


def _categories_for_text(value: str) -> list[str]:
    haystack = value.lower()
    categories: list[str] = []
    if any(word in haystack for word in BUILD_WORDS):
        categories.append("build")
    if any(word in haystack for word in INTEGRATION_WORDS):
        categories.append("integration")
    if any(word in haystack for word in PRODUCTION_WORDS):
        categories.append("production")
    if any(word in haystack for word in DECISION_WORDS):
        categories.append("decision")
    if any(word in haystack for word in HUMAN_WORDS):
        categories.append("human")
    if any(word in haystack for word in BACKLOG_WORDS):
        categories.append("backlog")
    return categories


def _should_capture_bullet(relative_path: str, text: str, headings: list[str]) -> bool:
    cleaned = text.strip()
    lowered = cleaned.lower()
    if len(cleaned) < 8:
        return False
    if lowered.startswith(("http://", "https://", "`", "|")):
        return False
    if lowered.startswith(NON_ACTIONABLE_BULLET_PREFIXES):
        return False
    path = relative_path.lower()
    section = " ".join(headings).lower()
    if any(word in path for word in ("backlog", "tasks", "task-tracker", "todo")):
        return True
    if any(word in section for word in ACTIONABLE_SECTION_WORDS):
        return True
    return lowered.startswith(ACTIONABLE_BULLET_PREFIXES)


def _looks_blocked(text: str, section: str) -> bool:
    haystack = f"{section} {text}".lower()
    return any(word in haystack for word in ("blocked", "blocker", "waiting", "depends on", "dependency", "missing"))


def _needs_human(text: str, section: str) -> bool:
    haystack = f"{section} {text}".lower()
    return any(word in haystack for word in HUMAN_WORDS)


def _looks_backlog(text: str, section: str, relative_path: str) -> bool:
    haystack = f"{relative_path} {section} {text}".lower()
    return any(word in haystack for word in BACKLOG_WORDS)


def _strip_plan_items(plan: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in plan.items() if key != "items"}


def _item_id(relative_path: str, line_number: int, text: str) -> str:
    digest = sha1(f"{relative_path}:{line_number}:{text}".encode("utf-8")).hexdigest()
    return digest[:12]


def _plan_work_summary(plan: dict[str, Any]) -> dict[str, Any]:
    open_items = [item for item in plan["items"] if item["state"] != "done"]
    counts = _empty_category_counts()
    for item in open_items:
        for category in item["categories"]:
            counts[category] += 1
    return {
        "title": plan["title"],
        "relativePath": plan["relativePath"],
        "completionPercent": plan["completionPercent"],
        "openItems": len(open_items),
        "blockedItems": sum(1 for item in open_items if item["state"] == "blocked" or item["blocked"]),
        "humanItems": sum(1 for item in open_items if item["humanRequired"]),
        "remainingCounts": counts,
        "items": open_items,
    }


def _project_work_items(project_name: str, project_path: str, plans: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for plan in plans:
        for item in plan["items"]:
            if item["state"] == "done":
                continue
            rows.append({
                "project": project_name,
                "projectPath": project_path,
                "planPath": plan["relativePath"],
                "planTitle": plan["title"],
                **item,
            })
    return rows


def _next_actions(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    priority = {"production": 0, "human": 1, "integration": 2, "decision": 3, "backlog": 4, "build": 5}
    return sorted(
        items,
        key=lambda item: (
            0 if item["state"] == "blocked" or item["blocked"] else 1,
            min(priority.get(category, 6) for category in item["categories"]),
        ),
    )[:10]


def _global_remaining(projects: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    remaining = _empty_category_lists()
    for project in projects:
        for category, items in project["remaining"].items():
            for item in items:
                remaining[category].append({"project": project["name"], "projectPath": project["path"], **item})
    return {category: items[:50] for category, items in remaining.items()}


def _global_work_queue(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for project in projects:
        rows.extend(project["workItems"])
    priority = {"production": 0, "human": 1, "integration": 2, "decision": 3, "backlog": 4, "build": 5}
    return sorted(
        rows,
        key=lambda item: (
            0 if item["state"] == "blocked" or item["blocked"] else 1,
            min(priority.get(category, 6) for category in item["categories"]),
            item["project"].lower(),
            item["planPath"].lower(),
            item["line"],
        ),
    )


def _empty_category_counts() -> dict[str, int]:
    return {"build": 0, "integration": 0, "production": 0, "decision": 0, "human": 0, "backlog": 0}


def _empty_category_lists() -> dict[str, list[dict[str, Any]]]:
    return {category: [] for category in _empty_category_counts()}
