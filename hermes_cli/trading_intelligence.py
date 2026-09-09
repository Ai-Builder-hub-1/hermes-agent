"""Trading intelligence control-plane aggregation for the Hermes dashboard."""

from __future__ import annotations

import asyncio
from datetime import datetime, timezone
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


CONTRACT_VERSION = "trading-intelligence-control-plane.v1"
FRONTEND_CONTRACT_VERSION = "2026-09-08.v1"


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


def default_sources() -> list[dict[str, Any]]:
    return [
        {
            "projectId": "investing-system",
            "label": "Investing System",
            "baseUrls": [
                _env("INVESTING_SYSTEM_API_BASE_URL"),
                "http://investing-system:3102",
                "http://127.0.0.1:3102",
            ],
            "authToken": _env("INVESTING_SYSTEM_API_READ_TOKEN")
            or _env("INVESTING_SYSTEM_API_ADMIN_TOKEN")
            or _env("INVESTING_SYSTEM_API_TOKEN"),
            "adminToken": _env("INVESTING_SYSTEM_API_ADMIN_TOKEN")
            or _env("INVESTING_SYSTEM_API_TOKEN"),
            "routes": {
                "summary": "/trading-desk/command-center/summary",
                "events": "/trading-desk/command-center/events",
                "controls": "/trading-desk/command-center/controls",
                "control": "/trading-desk/command-center/control",
            },
        },
        {
            "projectId": "khashi-vc",
            "label": "Khashi VC",
            "baseUrls": [
                _env("KHASHI_VC_API_BASE_URL"),
                "http://khashi:3101",
                "http://127.0.0.1:3101",
            ],
            "authToken": _env("KHASHI_VC_API_READ_TOKEN")
            or _env("KHASHI_VC_API_ADMIN_TOKEN")
            or _env("KHASHI_VC_API_TOKEN"),
            "adminToken": _env("KHASHI_VC_API_ADMIN_TOKEN") or _env("KHASHI_VC_API_TOKEN"),
            "routes": {
                "summary": "/api/roc/trading-command-center/summary",
                "events": "/api/roc/trading-command-center/events",
                "controls": "/api/roc/trading-command-center/controls",
                "control": "/api/roc/trading-command-center/control",
            },
        },
    ]


async def trading_intelligence_summary() -> dict[str, Any]:
    generated_at = _now()
    projects = await asyncio.gather(
        *[_project_summary(source) for source in default_sources()]
    )
    blockers = [
        f"{project['label']}: {blocker}"
        for project in projects
        for blocker in _as_list(project.get("blockers"))
    ]
    recommendations = _unique(
        f"{project['label']}: {recommendation}"
        for project in projects
        for recommendation in _as_list(project.get("recommendations"))
    )[:20]
    status = _fleet_status(projects)
    return {
        "id": "trading-intelligence-control-plane-summary",
        "contractVersion": CONTRACT_VERSION,
        "frontendContractVersion": FRONTEND_CONTRACT_VERSION,
        "title": "Trading Intelligence Control Plane Summary",
        "generatedAt": generated_at,
        "status": status,
        "liveTradingLocked": all(project.get("liveTradingLocked") is not False for project in projects),
        "kpis": _aggregate_kpis(projects),
        "projects": projects,
        "tabs": [
            {"id": "overview", "label": "Overview", "status": status, "projectIds": [project["projectId"] for project in projects]},
            {"id": "investing-system", "label": "Investing System", "status": _project_status(projects, "investing-system"), "projectIds": ["investing-system"]},
            {"id": "khashi-vc", "label": "Khashi VC", "status": _project_status(projects, "khashi-vc"), "projectIds": ["khashi-vc"]},
            {"id": "pnl-risk", "label": "P/L and Risk", "status": "watch" if blockers else "ready", "projectIds": [project["projectId"] for project in projects]},
            {"id": "strategy-quality", "label": "Strategy Quality", "status": "watch" if blockers else "ready", "projectIds": [project["projectId"] for project in projects]},
            {"id": "events", "label": "Latest Events", "status": "ready", "projectIds": [project["projectId"] for project in projects]},
            {"id": "controls", "label": "Controls", "status": "ready", "projectIds": [project["projectId"] for project in projects]},
        ],
        "blockers": blockers,
        "recommendations": recommendations,
    }


async def trading_intelligence_events(limit: Any = 10) -> dict[str, Any]:
    bounded_limit = max(1, min(50, _to_int(limit, 10)))
    results = await asyncio.gather(
        *[_project_events(source, bounded_limit) for source in default_sources()]
    )
    events = [event for batch in results for event in batch]
    events.sort(key=lambda event: event.get("occurredAt", ""), reverse=True)
    return {
        "id": "trading-intelligence-control-plane-events",
        "contractVersion": CONTRACT_VERSION,
        "title": "Trading Intelligence Control Plane Events",
        "generatedAt": _now(),
        "limit": bounded_limit,
        "events": events[:bounded_limit],
    }


async def trading_intelligence_controls() -> dict[str, Any]:
    projects = await asyncio.gather(
        *[_project_controls(source) for source in default_sources()]
    )
    return {
        "id": "trading-intelligence-control-plane-controls",
        "contractVersion": CONTRACT_VERSION,
        "title": "Trading Intelligence Control Plane Controls",
        "generatedAt": _now(),
        "safety": {
            "liveTradingLocked": True,
            "submitLiveOrderAvailable": False,
            "projectOwnedControlsOnly": True,
            "note": "Nous proxies explicit project-owned control requests; it does not submit trades.",
        },
        "projects": projects,
        "controls": [control for project in projects for control in project.get("controls", [])],
    }


async def trading_intelligence_control(payload: dict[str, Any]) -> dict[str, Any]:
    action = str(payload.get("action") or "")
    explicit_project_id = payload.get("projectId") if isinstance(payload.get("projectId"), str) else None
    if ":" in action:
        project_id, local_action = action.split(":", 1)
    else:
        project_id, local_action = explicit_project_id, action
    source = next((item for item in default_sources() if item["projectId"] == project_id), None)
    if not source or not local_action:
        return {
            "id": "trading-intelligence-control-plane-control",
            "contractVersion": CONTRACT_VERSION,
            "generatedAt": _now(),
            "status": "rejected",
            "error": "Unknown project or action. Use projectId plus action, or a namespaced action like investing-system:pause_oanda_runtime.",
            "requested": payload,
        }
    body = {**payload, "action": local_action, "actorId": payload.get("actorId") or "nous-hermes-control-plane"}
    result = await _request_source(source, source["routes"]["control"], method="POST", body=body, admin=True)
    return {
        "id": "trading-intelligence-control-plane-control",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "status": "proxied" if result["ok"] else "failed",
        "projectId": source["projectId"],
        "action": local_action,
        "httpStatus": result["status"],
        "sourceBaseUrl": result.get("baseUrl"),
        "error": result.get("error"),
        "result": result.get("payload"),
    }


def trading_intelligence_frontend_spec() -> dict[str, Any]:
    return {
        "name": "Trading Intelligence Control Plane",
        "version": FRONTEND_CONTRACT_VERSION,
        "basePath": "/api/trading-intelligence",
        "endpoints": [
            {"method": "GET", "path": "/summary", "purpose": "Fleet-level project status, KPI rollup, tabs, blockers, recommendations."},
            {"method": "GET", "path": "/events?limit=10", "purpose": "Merged latest events from Investing System and Khashi VC."},
            {"method": "GET", "path": "/controls", "purpose": "Namespaced project control catalog."},
            {"method": "POST", "path": "/control", "purpose": "Proxy a project-owned control request. Use dry-run/preview first."},
        ],
        "uiSections": ["overview", "project cards", "pnl and risk", "strategy quality", "latest events", "controls"],
        "safety": {
            "liveTradingLocked": True,
            "copy": "This control plane never submits live broker orders.",
        },
    }


async def _project_summary(source: dict[str, Any]) -> dict[str, Any]:
    result = await _request_source(source, source["routes"]["summary"])
    summary = _unwrap_payload(result.get("payload"))
    return {
        "projectId": source["projectId"],
        "label": source["label"],
        "sourceBaseUrl": result.get("baseUrl"),
        "available": result["ok"],
        "httpStatus": result["status"],
        "latencyMs": result["latencyMs"],
        "error": result.get("error"),
        "summary": summary,
        "status": _normalize_project_status(summary.get("status") if isinstance(summary, dict) else None) if result["ok"] else "unavailable",
        "liveTradingLocked": summary.get("liveTradingLocked") is not False if isinstance(summary, dict) and result["ok"] else True,
        "kpis": summary.get("kpis", {}) if isinstance(summary, dict) and result["ok"] else {},
        "tabs": summary.get("tabs", []) if isinstance(summary, dict) and result["ok"] else [],
        "blockers": _as_list(summary.get("blockers")) if isinstance(summary, dict) and result["ok"] else [f"{source['label']} command-center summary is unavailable: {result.get('error')}"],
        "recommendations": _as_list(summary.get("recommendations")) if isinstance(summary, dict) and result["ok"] else [f"Check {source['label']} API base URL, auth token, and service health."],
        "sourceRoutes": summary.get("sourceRoutes", source["routes"]) if isinstance(summary, dict) and result["ok"] else source["routes"],
    }


async def _project_events(source: dict[str, Any], limit: int) -> list[dict[str, Any]]:
    result = await _request_source(source, f"{source['routes']['events']}?limit={limit}")
    if not result["ok"]:
        return [_source_unavailable_event(source, result.get("error"))]
    payload = _unwrap_payload(result.get("payload"))
    return [_normalize_event(event, source) for event in _as_list(payload.get("events") if isinstance(payload, dict) else [])]


async def _project_controls(source: dict[str, Any]) -> dict[str, Any]:
    result = await _request_source(source, source["routes"]["controls"])
    payload = _unwrap_payload(result.get("payload"))
    controls = []
    if isinstance(payload, dict):
        for control in _as_list(payload.get("controls")):
            if not isinstance(control, dict):
                continue
            controls.append({
                **control,
                "namespacedId": f"{source['projectId']}:{control.get('id')}",
                "projectId": source["projectId"],
                "projectLabel": source["label"],
            })
    return {
        "projectId": source["projectId"],
        "label": source["label"],
        "available": result["ok"],
        "error": result.get("error"),
        "controls": controls,
        "safety": payload.get("safety", {}) if isinstance(payload, dict) else {},
    }


async def _request_source(
    source: dict[str, Any],
    route: str,
    *,
    method: str = "GET",
    body: dict[str, Any] | None = None,
    admin: bool = False,
) -> dict[str, Any]:
    started = datetime.now(timezone.utc)
    auth_token = source.get("adminToken" if admin or method != "GET" else "authToken") or ""
    headers = {"Accept": "application/json"}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")
    last_error = "source_unavailable"
    last_status = 0
    for base_url in _source_base_urls(source):
        result = await asyncio.to_thread(_request_json_sync, base_url, route, method, headers, data)
        result["latencyMs"] = int((datetime.now(timezone.utc) - started).total_seconds() * 1000)
        if result["ok"]:
            return result
        last_error = result.get("error") or last_error
        last_status = result.get("status") or last_status
        if last_status in {401, 403}:
            return result
    return {"ok": False, "status": last_status, "latencyMs": int((datetime.now(timezone.utc) - started).total_seconds() * 1000), "payload": None, "error": last_error, "baseUrl": None}


def _request_json_sync(base_url: str, route: str, method: str, headers: dict[str, str], data: bytes | None) -> dict[str, Any]:
    url = urllib.parse.urljoin(_ensure_trailing_slash(base_url), route.lstrip("/"))
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            text = response.read().decode("utf-8")
            return {"ok": 200 <= response.status < 300, "status": response.status, "payload": json.loads(text) if text else None, "error": None, "baseUrl": base_url}
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", "replace")
        payload = None
        try:
            payload = json.loads(text) if text else None
        except json.JSONDecodeError:
            payload = {"raw": text[:500]}
        return {"ok": False, "status": exc.code, "payload": payload, "error": f"HTTP {exc.code}", "baseUrl": base_url}
    except Exception as exc:
        return {"ok": False, "status": 0, "payload": None, "error": str(exc), "baseUrl": base_url}


def _aggregate_kpis(projects: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "projectsAvailable": sum(1 for project in projects if project.get("available")),
        "projectsTotal": len(projects),
        "openTrades": _sum(project.get("kpis", {}).get("openTrades") for project in projects),
        "closedTrades": _sum(_first_number(project, "closedTrades", "reviewedTrades") for project in projects),
        "realizedPnlUsd": _sum(_first_number(project, "realizedPnlUsd", "realizedPnlToday", "strategyGrossPnl") for project in projects),
        "openRiskUsd": _sum(project.get("kpis", {}).get("openRiskUsd") for project in projects),
        "liveMarkets": _sum(project.get("kpis", {}).get("liveMarkets") for project in projects),
        "strategyCandidates": _sum(project.get("kpis", {}).get("paperCandidates") for project in projects),
        "liveTradingLocked": all(project.get("liveTradingLocked") is not False for project in projects),
        "blockers": sum(len(project.get("blockers", [])) for project in projects),
    }


def _fleet_status(projects: list[dict[str, Any]]) -> str:
    if any(not project.get("available") or project.get("status") in {"blocked", "unavailable"} for project in projects):
        return "blocked"
    if any(project.get("status") in {"watch", "partial", "degraded"} for project in projects):
        return "watch"
    return "ready"


def _normalize_event(event: Any, source: dict[str, Any]) -> dict[str, Any]:
    event = event if isinstance(event, dict) else {}
    return {
        "id": str(event.get("id") or f"{source['projectId']}-event"),
        "sourceProject": str(event.get("sourceProject") or source["projectId"]),
        "sourceSystem": str(event.get("sourceSystem") or source["projectId"]),
        "stream": str(event.get("stream") or event.get("type") or "event"),
        "type": str(event.get("type") or event.get("stream") or "event"),
        "status": str(event.get("status") or "info"),
        "severity": str(event.get("severity") or "info"),
        "title": str(event.get("title") or event.get("type") or "Event"),
        "occurredAt": _normalize_date(event.get("occurredAt") or event.get("timestamp")),
        "instrument": event.get("instrument"),
        "summary": str(event.get("summary") or ""),
        "links": event.get("links") if isinstance(event.get("links"), dict) else {},
        "rawRef": event.get("rawRef") if isinstance(event.get("rawRef"), dict) else {},
    }


def _source_unavailable_event(source: dict[str, Any], error: str | None) -> dict[str, Any]:
    return {
        "id": f"{source['projectId']}-unavailable-{int(datetime.now(timezone.utc).timestamp())}",
        "sourceProject": source["projectId"],
        "sourceSystem": "nous-hermes-agent",
        "stream": "source-health",
        "type": "source_unavailable",
        "status": "blocked",
        "severity": "error",
        "title": f"{source['label']} unavailable",
        "occurredAt": _now(),
        "instrument": None,
        "summary": error or "Source command-center endpoint did not respond.",
        "links": {"summary": source["routes"]["summary"]},
        "rawRef": {"baseUrls": _source_base_urls(source)},
    }


def _source_base_urls(source: dict[str, Any]) -> list[str]:
    return _unique(str(url).rstrip("/") for url in source.get("baseUrls", []) if str(url or "").strip())


def _project_status(projects: list[dict[str, Any]], project_id: str) -> str:
    for project in projects:
        if project.get("projectId") == project_id:
            return str(project.get("status") or "unavailable")
    return "unavailable"


def _normalize_project_status(status: Any) -> str:
    text = str(status or "unknown")
    lowered = text.lower()
    if any(word in lowered for word in ("blocked", "locked", "critical", "fail")):
        return "blocked"
    if any(word in lowered for word in ("watch", "partial", "degraded", "collecting", "stale")):
        return "watch"
    if any(word in lowered for word in ("ready", "healthy", "reporting", "pass")):
        return "ready"
    return text


def _unwrap_payload(payload: Any) -> Any:
    if isinstance(payload, dict) and "data" in payload:
        return payload["data"]
    return payload


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _first_number(project: dict[str, Any], *keys: str) -> float | None:
    """First key that is actually present and numeric.

    A source that legitimately reports ``0`` (flat realized P/L, zero closed
    trades) must not fall through to the next alias — an ``or`` chain would
    treat that ``0`` as missing and the fleet KPI would render "No data"
    instead of zero.
    """
    kpis = project.get("kpis") or {}
    if not isinstance(kpis, dict):
        return None
    for key in keys:
        value = kpis.get(key)
        if isinstance(value, bool):
            continue
        if isinstance(value, (int, float)):
            return float(value)
    return None


def _sum(values: Any) -> float | None:
    numbers = [float(value) for value in values if isinstance(value, (int, float))]
    return round(sum(numbers), 2) if numbers else None


def _unique(values: Any) -> list[Any]:
    seen = set()
    result = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _normalize_date(value: Any) -> str:
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
        except ValueError:
            pass
    return _now()


def _to_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _ensure_trailing_slash(value: str) -> str:
    return value if value.endswith("/") else f"{value}/"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
