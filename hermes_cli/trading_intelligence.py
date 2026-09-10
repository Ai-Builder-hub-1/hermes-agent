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
COMMAND_CENTER_CONTRACT_VERSION = "trading-command-center.v1"


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


async def trading_command_center(limit: Any = 10) -> dict[str, Any]:
    """Return the normalized backend contract for a cross-system trading UI.

    This read model is intentionally conservative: Nous aggregates and
    normalizes project-owned summaries, events, and controls, but does not
    infer permission to trade or submit live orders.
    """
    bounded_limit = max(1, min(50, _to_int(limit, 10)))
    summary, events, controls = await asyncio.gather(
        trading_intelligence_summary(),
        trading_intelligence_events(bounded_limit),
        trading_intelligence_controls(),
    )
    projects = _as_list(summary.get("projects"))
    normalized_events = _as_list(events.get("events"))
    normalized_controls = _as_list(controls.get("controls"))
    lanes = _command_lanes(projects)
    blockers = _as_list(summary.get("blockers"))
    recommendations = _as_list(summary.get("recommendations"))
    action_queue = _action_queue(normalized_controls, blockers)
    daily_metrics = _daily_metrics_snapshot(projects, summary, normalized_events, action_queue)
    return {
        "id": "trading-command-center",
        "contractVersion": COMMAND_CENTER_CONTRACT_VERSION,
        "sourceContractVersion": CONTRACT_VERSION,
        "frontendContractVersion": "2026-09-10.v1",
        "title": "Trading Command Center",
        "generatedAt": _now(),
        "status": summary.get("status") or "unknown",
        "liveTradingLocked": summary.get("liveTradingLocked") is not False,
        "summary": _command_summary(summary, lanes, action_queue),
        "lanes": lanes,
        "capital": _capital_snapshot(projects),
        "pnl": _pnl_snapshot(projects),
        "risk": _risk_snapshot(projects, summary),
        "positions": _position_snapshot(projects),
        "strategies": _strategy_snapshot(projects),
        "dailyMetrics": daily_metrics,
        "dailySeries": _daily_series_snapshot(daily_metrics, projects),
        "recentEvents": normalized_events[:bounded_limit],
        "actionQueue": action_queue,
        "freshness": _freshness_snapshot(projects),
        "blockers": blockers,
        "recommendations": recommendations,
        "sourceProjects": projects,
        "sourceRoutes": {
            "summary": "/api/trading-intelligence/summary",
            "events": "/api/trading-intelligence/events",
            "controls": "/api/trading-intelligence/controls",
            "control": "/api/trading-intelligence/control",
            "headTrader": "/api/head-trader/summary",
        },
        "frontendBuildNotes": [
            "Render lane status from the lanes array, not from project names.",
            "Render daily aggregate KPI cards from dailyMetrics so cash left, buying power, risk, and same-day P/L stay consistent across sources.",
            "Use dailyMetrics.bySource[].capitalSemantics before labeling a cash value as real broker cash; Khashi may report an internal simulated bankroll, not Kalshi production or demo cash.",
            "Treat liveTradingLocked=true as the default safety posture.",
            "Use sourceProjects[].summary for project-specific drilldowns when a normalized field is null.",
            "Route all risky actions through Head Trader or /api/trading-intelligence/control; never submit live orders from this endpoint.",
        ],
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
        "version": "2026-09-10.v2",
        "basePath": "/api/trading-intelligence",
        "endpoints": [
            {"method": "GET", "path": "/command-center?limit=10", "purpose": "Normalized cross-system backend contract for the one-screen trading/investing cockpit."},
            {"method": "GET", "path": "/summary", "purpose": "Fleet-level project status, KPI rollup, tabs, blockers, recommendations."},
            {"method": "GET", "path": "/events?limit=10", "purpose": "Merged latest events from Investing System and Khashi VC."},
            {"method": "GET", "path": "/controls", "purpose": "Namespaced project control catalog."},
            {"method": "POST", "path": "/control", "purpose": "Proxy a project-owned control request. Use dry-run/preview first."},
        ],
        "primaryEndpoint": "/api/trading-intelligence/command-center?limit=10",
        "uiSections": ["overview", "daily KPI ribbon", "capital semantics", "source comparison", "daily trend", "pnl and risk", "strategy quality", "latest events", "controls"],
        "commandCenterContract": {
            "summary": {
                "purpose": "Top-line aggregate cards.",
                "recommendedCards": ["cashLeftUsd", "buyingPowerUsd", "totalEquityUsd", "realizedPnlTodayUsd", "openRiskUsd", "riskAdjustedCashLeftUsd", "openTrades", "humanActionsRequired"],
            },
            "dailyMetrics": {
                "purpose": "Current UTC-day aggregate metrics across Investing System and Khashi VC.",
                "requiredRendering": "Always render coverage and source semantics beside cash totals. Null means unknown, not zero.",
                "fields": ["date", "cashLeftUsd", "cashLeftKnown", "buyingPowerUsd", "totalEquityUsd", "portfolioValueUsd", "openRiskUsd", "riskAdjustedCashLeftUsd", "realizedPnlTodayUsd", "realizedPnlUsd", "unrealizedPnlUsd", "netPnlUsd", "openTrades", "closedTrades", "eventsToday", "humanActionsRequired", "coverage", "capitalSemantics", "bySource"],
            },
            "dailySeries": {
                "purpose": "Chart-ready daily trend points. Render cash left, P/L, open risk, and action count over time.",
                "minimumBehavior": "If only one point exists, render a single-day state with today's numbers and a note that history is collecting.",
                "fields": ["date", "cashLeftUsd", "buyingPowerUsd", "totalEquityUsd", "openRiskUsd", "riskAdjustedCashLeftUsd", "realizedPnlTodayUsd", "netPnlUsd", "openTrades", "closedTrades", "humanActionsRequired", "eventsToday", "coverage", "bySource"],
            },
            "capitalSemantics": {
                "rules": [
                    "Do not label aggregate cash as withdrawable unless bySource confirms isRealBrokerCash=true for the source.",
                    "Khashi cash may be null, internal simulated bankroll, Kalshi demo cash, or Kalshi production cash; the label must come from bySource[].capitalSource.",
                    "Never present Khashi internal paper bankroll as real Kalshi cash.",
                ],
            },
        },
        "safety": {
            "liveTradingLocked": True,
            "copy": "This control plane never submits live broker orders.",
        },
    }


def _command_summary(summary: dict[str, Any], lanes: list[dict[str, Any]], action_queue: list[dict[str, Any]]) -> dict[str, Any]:
    kpis = summary.get("kpis") if isinstance(summary.get("kpis"), dict) else {}
    return {
        "totalCapitalKnown": any(lane.get("capitalKnown") for lane in lanes),
        "activeSystems": sum(1 for lane in lanes if lane.get("available") and lane.get("status") in {"ready", "watch"}),
        "blockedSystems": sum(1 for lane in lanes if lane.get("status") in {"blocked", "unavailable"}),
        "openPositions": _first_present_number(kpis, "openPositions", "openTrades"),
        "openTrades": _first_present_number(kpis, "openTrades", "openPositions"),
        "closedTrades": _first_present_number(kpis, "closedTrades", "reviewedTrades"),
        "cashLeftUsd": _first_present_number(kpis, "cashLeftUsd", "cashUsd", "availableCashUsd", "cashAvailable"),
        "cashLeftKnown": _first_present_number(kpis, "cashLeftUsd", "cashUsd", "availableCashUsd", "cashAvailable", "buyingPowerUsd", "buyingPower") is not None,
        "buyingPowerUsd": _first_present_number(kpis, "buyingPowerUsd", "buyingPower"),
        "totalEquityUsd": _first_present_number(kpis, "totalEquityUsd", "accountEquityUsd", "portfolioValueUsd"),
        "openRiskUsd": _first_present_number(kpis, "openRiskUsd"),
        "realizedPnlTodayUsd": _first_present_number(kpis, "realizedPnlTodayUsd", "realizedPnlToday", "realizedPnlUsd"),
        "realizedPnlUsd": _first_present_number(kpis, "realizedPnlUsd", "realizedPnlToday"),
        "unrealizedPnlUsd": _first_present_number(kpis, "unrealizedPnlUsd"),
        "maxDrawdownUsd": _first_present_number(kpis, "maxDrawdownUsd"),
        "strategyCandidates": _first_present_number(kpis, "strategyCandidates", "paperCandidates"),
        "humanActionsRequired": len(action_queue),
    }


def _command_lanes(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_project = {project.get("projectId"): project for project in projects if isinstance(project, dict)}
    investing = by_project.get("investing-system", {})
    khashi = by_project.get("khashi-vc", {})
    return [
        _lane(
            "leon_long_term",
            "Leon Long-Term Investing",
            "long_term_investing",
            investing,
            "Portfolio quality, thesis strength, concentration, valuation, trimming/add candidates, and long-term capital allocation.",
            ["portfolioValueUsd", "cashUsd", "holdings", "concentrationRisk", "thesisQualityScore", "valuationRiskScore"],
        ),
        _lane(
            "leon_short_term_opportunity",
            "Leon Short-Term Opportunity",
            "tactical_portfolio_actions",
            investing,
            "Short-term trims, adds, catalysts, realized/unrealized P/L, and portfolio action governance.",
            ["trimCandidates", "addCandidates", "actionQueue", "unrealizedPnlUsd", "realizedPnlUsd"],
        ),
        _lane(
            "oanda_fx_trading",
            "OANDA FX Trading",
            "fx_trading",
            investing,
            "Runtime status, account risk, open FX trades, strategy quality, trade lifecycle, and promotion state.",
            ["openTrades", "closedTrades", "openRiskUsd", "realizedPnlUsd", "accountEquityUsd", "strategyCandidates"],
        ),
        _lane(
            "khashi_perpetual_trading",
            "Khashi Perpetual Trading",
            "prediction_market_perpetuals",
            khashi,
            "15-minute/perpetual market data freshness, shadow trades, strategy quality, promotion gates, and storage posture.",
            ["liveMarkets", "openTrades", "closedTrades", "paperCandidates", "realizedPnlUsd", "openRiskUsd"],
        ),
    ]


def _lane(
    lane_id: str,
    label: str,
    kind: str,
    project: dict[str, Any],
    purpose: str,
    expected_metrics: list[str],
) -> dict[str, Any]:
    kpis = project.get("kpis") if isinstance(project.get("kpis"), dict) else {}
    summary = project.get("summary") if isinstance(project.get("summary"), dict) else {}
    present_metrics = [metric for metric in expected_metrics if _nested_get(kpis, metric) is not None or _nested_get(summary, metric) is not None]
    return {
        "id": lane_id,
        "label": label,
        "kind": kind,
        "sourceProject": project.get("projectId"),
        "sourceLabel": project.get("label"),
        "available": bool(project.get("available")),
        "status": str(project.get("status") or "unavailable"),
        "purpose": purpose,
        "capitalKnown": any(_first_present_number(kpis, key) is not None for key in ("portfolioValueUsd", "accountEquityUsd", "cashUsd", "buyingPowerUsd")),
        "liveTradingLocked": project.get("liveTradingLocked") is not False,
        "kpis": kpis,
        "metricCoverage": {
            "expected": expected_metrics,
            "present": present_metrics,
            "missing": [metric for metric in expected_metrics if metric not in present_metrics],
        },
        "blockers": _as_list(project.get("blockers")),
        "recommendations": _as_list(project.get("recommendations"))[:5],
        "sourceRoutes": project.get("sourceRoutes", {}),
    }


def _capital_snapshot(projects: list[dict[str, Any]]) -> dict[str, Any]:
    by_lane = []
    for project in projects:
        kpis = project.get("kpis") if isinstance(project.get("kpis"), dict) else {}
        by_lane.append({
            "sourceProject": project.get("projectId"),
            "capitalKnown": any(_first_present_number(kpis, key) is not None for key in ("portfolioValueUsd", "accountEquityUsd", "cashUsd", "buyingPowerUsd")),
            "portfolioValueUsd": _first_present_number(kpis, "portfolioValueUsd", "accountValueUsd"),
            "accountEquityUsd": _first_present_number(kpis, "accountEquityUsd", "equityUsd"),
            "cashUsd": _first_present_number(kpis, "cashUsd", "cashLeftUsd", "availableCashUsd", "cashAvailable"),
            "cashLeftUsd": _first_present_number(kpis, "cashLeftUsd", "cashUsd", "availableCashUsd", "cashAvailable"),
            "buyingPowerUsd": _first_present_number(kpis, "buyingPowerUsd", "buyingPower"),
            "openRiskUsd": _first_present_number(kpis, "openRiskUsd"),
        })
    return {
        "known": any(row["capitalKnown"] for row in by_lane),
        "portfolioValueUsd": _sum(row.get("portfolioValueUsd") for row in by_lane),
        "accountEquityUsd": _sum(row.get("accountEquityUsd") for row in by_lane),
        "cashUsd": _sum(row.get("cashUsd") for row in by_lane),
        "cashLeftUsd": _sum(row.get("cashLeftUsd") for row in by_lane),
        "buyingPowerUsd": _sum(row.get("buyingPowerUsd") for row in by_lane),
        "openRiskUsd": _sum(row.get("openRiskUsd") for row in by_lane),
        "bySource": by_lane,
    }


def _pnl_snapshot(projects: list[dict[str, Any]]) -> dict[str, Any]:
    by_source = []
    for project in projects:
        kpis = project.get("kpis") if isinstance(project.get("kpis"), dict) else {}
        by_source.append({
            "sourceProject": project.get("projectId"),
            "realizedPnlTodayUsd": _first_present_number(kpis, "realizedPnlTodayUsd", "realizedPnlToday"),
            "realizedPnlUsd": _first_present_number(kpis, "realizedPnlUsd", "strategyGrossPnl"),
            "unrealizedPnlUsd": _first_present_number(kpis, "unrealizedPnlUsd"),
            "spreadAdjustedPnlUsd": _first_present_number(kpis, "spreadAdjustedPnlUsd"),
            "maxDrawdownUsd": _first_present_number(kpis, "maxDrawdownUsd"),
        })
    return {
        "realizedPnlTodayUsd": _sum(row.get("realizedPnlTodayUsd") for row in by_source),
        "realizedPnlUsd": _sum(row.get("realizedPnlUsd") for row in by_source),
        "unrealizedPnlUsd": _sum(row.get("unrealizedPnlUsd") for row in by_source),
        "spreadAdjustedPnlUsd": _sum(row.get("spreadAdjustedPnlUsd") for row in by_source),
        "maxDrawdownUsd": _min_number(row.get("maxDrawdownUsd") for row in by_source),
        "bySource": by_source,
    }


def _daily_metrics_snapshot(
    projects: list[dict[str, Any]],
    summary: dict[str, Any],
    events: list[dict[str, Any]],
    action_queue: list[dict[str, Any]],
) -> dict[str, Any]:
    generated_at = str(summary.get("generatedAt") or _now())
    date = generated_at[:10]
    by_source = []
    for project in projects:
        kpis = project.get("kpis") if isinstance(project.get("kpis"), dict) else {}
        cash_left = _first_present_number(kpis, "cashLeftUsd", "cashUsd", "availableCashUsd", "cashAvailable")
        buying_power = _first_present_number(kpis, "buyingPowerUsd", "buyingPower")
        open_risk = _first_present_number(kpis, "openRiskUsd")
        realized_today = _first_present_number(kpis, "realizedPnlTodayUsd", "realizedPnlToday", "realizedPnlUsd")
        unrealized = _first_present_number(kpis, "unrealizedPnlUsd")
        by_source.append({
            "sourceProject": project.get("projectId"),
            "sourceLabel": project.get("label"),
            "status": project.get("status") or "unknown",
            "cashLeftUsd": cash_left,
            "cashLeftKnown": cash_left is not None,
            "buyingPowerUsd": buying_power,
            "capitalSource": _first_present_text(kpis, "capitalSource", "paperCapitalSource"),
            "capitalSemantics": _first_present_text(kpis, "capitalSemantics", "paperCapitalSemantics"),
            "isRealBrokerCash": kpis.get("isRealBrokerCash") if isinstance(kpis.get("isRealBrokerCash"), bool) else None,
            "isKalshiDemoCash": kpis.get("isKalshiDemoCash") if isinstance(kpis.get("isKalshiDemoCash"), bool) else None,
            "kalshiProductionCashUsd": _first_present_number(kpis, "kalshiProductionCashUsd"),
            "kalshiDemoCashUsd": _first_present_number(kpis, "kalshiDemoCashUsd"),
            "paperBankrollUsd": _first_present_number(kpis, "paperBankrollUsd"),
            "totalEquityUsd": _first_present_number(kpis, "totalEquityUsd", "accountEquityUsd", "portfolioValueUsd"),
            "portfolioValueUsd": _first_present_number(kpis, "portfolioValueUsd", "accountValueUsd"),
            "openRiskUsd": open_risk,
            "riskAdjustedCashLeftUsd": round(cash_left - (open_risk or 0), 2) if cash_left is not None else None,
            "realizedPnlTodayUsd": realized_today,
            "realizedPnlUsd": _first_present_number(kpis, "realizedPnlUsd", "strategyGrossPnl"),
            "unrealizedPnlUsd": unrealized,
            "netPnlUsd": _sum((realized_today, unrealized)),
            "openTrades": _first_present_number(kpis, "openTrades", "openPositions"),
            "closedTrades": _first_present_number(kpis, "closedTrades", "reviewedTrades"),
            "dailyLossLimitUsd": _first_present_number(kpis, "dailyLossLimitUsd"),
            "dailyLossRemainingUsd": _first_present_number(kpis, "dailyLossRemainingUsd"),
        })
    cash_left_total = _sum(row.get("cashLeftUsd") for row in by_source)
    open_risk_total = _sum(row.get("openRiskUsd") for row in by_source)
    realized_today_total = _sum(row.get("realizedPnlTodayUsd") for row in by_source)
    unrealized_total = _sum(row.get("unrealizedPnlUsd") for row in by_source)
    return {
        "date": date,
        "generatedAt": generated_at,
        "cashLeftUsd": cash_left_total,
        "cashLeftKnown": any(row.get("cashLeftKnown") for row in by_source),
        "buyingPowerUsd": _sum(row.get("buyingPowerUsd") for row in by_source),
        "totalEquityUsd": _sum(row.get("totalEquityUsd") for row in by_source),
        "portfolioValueUsd": _sum(row.get("portfolioValueUsd") for row in by_source),
        "openRiskUsd": open_risk_total,
        "riskAdjustedCashLeftUsd": round(cash_left_total - (open_risk_total or 0), 2) if cash_left_total is not None else None,
        "realizedPnlTodayUsd": realized_today_total,
        "realizedPnlUsd": _sum(row.get("realizedPnlUsd") for row in by_source),
        "unrealizedPnlUsd": unrealized_total,
        "netPnlUsd": _sum((realized_today_total, unrealized_total)),
        "openTrades": _sum(row.get("openTrades") for row in by_source),
        "closedTrades": _sum(row.get("closedTrades") for row in by_source),
        "eventsToday": sum(1 for event in events if str(event.get("occurredAt") or "").startswith(date)),
        "humanActionsRequired": len(action_queue),
        "coverage": {
            "cashLeft": _coverage_label(by_source, "cashLeftUsd"),
            "buyingPower": _coverage_label(by_source, "buyingPowerUsd"),
            "totalEquity": _coverage_label(by_source, "totalEquityUsd"),
            "dailyPnl": _coverage_label(by_source, "realizedPnlTodayUsd"),
            "risk": _coverage_label(by_source, "openRiskUsd"),
        },
        "capitalSemantics": {
            "realBrokerCashSources": sum(1 for row in by_source if row.get("isRealBrokerCash") is True),
            "kalshiDemoCashSources": sum(1 for row in by_source if row.get("isKalshiDemoCash") is True),
            "internalPaperBankrollSources": sum(1 for row in by_source if row.get("capitalSource") == "internal-khashi-paper-bankroll"),
            "note": "Aggregate cash can include real broker cash and internal simulated bankrolls; inspect bySource before presenting it as withdrawable or live-trading cash.",
        },
        "bySource": by_source,
    }


def _daily_series_snapshot(daily_metrics: dict[str, Any], projects: list[dict[str, Any]]) -> dict[str, Any]:
    points_by_date: dict[str, dict[str, Any]] = {}
    for project in projects:
        for point in _source_daily_points(project):
            date = str(point.get("date") or point.get("day") or "")[:10]
            if not date:
                continue
            row = points_by_date.setdefault(date, {"date": date, "bySource": []})
            row["bySource"].append({
                "sourceProject": project.get("projectId"),
                "cashLeftUsd": _first_present_number(point, "cashLeftUsd", "cashUsd", "availableCashUsd", "cashAvailable"),
                "buyingPowerUsd": _first_present_number(point, "buyingPowerUsd", "buyingPower"),
                "totalEquityUsd": _first_present_number(point, "totalEquityUsd", "accountEquityUsd", "portfolioValueUsd"),
                "openRiskUsd": _first_present_number(point, "openRiskUsd"),
                "realizedPnlTodayUsd": _first_present_number(point, "realizedPnlTodayUsd", "realizedPnlToday", "realizedPnlUsd"),
                "netPnlUsd": _first_present_number(point, "netPnlUsd"),
                "openTrades": _first_present_number(point, "openTrades", "openPositions"),
                "closedTrades": _first_present_number(point, "closedTrades", "reviewedTrades"),
            })

    if daily_metrics.get("date"):
        today = str(daily_metrics["date"])
        row = points_by_date.setdefault(today, {"date": today, "bySource": []})
        row["current"] = True
        if not row.get("bySource"):
            row["bySource"] = daily_metrics.get("bySource", [])

    points = []
    for date, row in sorted(points_by_date.items()):
        source_rows = _as_list(row.get("bySource"))
        if row.get("current"):
            points.append({
                "date": date,
                "current": True,
                "cashLeftUsd": daily_metrics.get("cashLeftUsd"),
                "cashLeftKnown": daily_metrics.get("cashLeftKnown"),
                "buyingPowerUsd": daily_metrics.get("buyingPowerUsd"),
                "totalEquityUsd": daily_metrics.get("totalEquityUsd"),
                "portfolioValueUsd": daily_metrics.get("portfolioValueUsd"),
                "openRiskUsd": daily_metrics.get("openRiskUsd"),
                "riskAdjustedCashLeftUsd": daily_metrics.get("riskAdjustedCashLeftUsd"),
                "realizedPnlTodayUsd": daily_metrics.get("realizedPnlTodayUsd"),
                "realizedPnlUsd": daily_metrics.get("realizedPnlUsd"),
                "unrealizedPnlUsd": daily_metrics.get("unrealizedPnlUsd"),
                "netPnlUsd": daily_metrics.get("netPnlUsd"),
                "openTrades": daily_metrics.get("openTrades"),
                "closedTrades": daily_metrics.get("closedTrades"),
                "eventsToday": daily_metrics.get("eventsToday"),
                "humanActionsRequired": daily_metrics.get("humanActionsRequired"),
                "coverage": daily_metrics.get("coverage"),
                "bySource": source_rows,
            })
            continue
        cash_left = _sum(source.get("cashLeftUsd") for source in source_rows)
        open_risk = _sum(source.get("openRiskUsd") for source in source_rows)
        realized_today = _sum(source.get("realizedPnlTodayUsd") for source in source_rows)
        points.append({
            "date": date,
            "current": False,
            "cashLeftUsd": cash_left,
            "cashLeftKnown": cash_left is not None,
            "buyingPowerUsd": _sum(source.get("buyingPowerUsd") for source in source_rows),
            "totalEquityUsd": _sum(source.get("totalEquityUsd") for source in source_rows),
            "openRiskUsd": open_risk,
            "riskAdjustedCashLeftUsd": round(cash_left - (open_risk or 0), 2) if cash_left is not None else None,
            "realizedPnlTodayUsd": realized_today,
            "netPnlUsd": _sum(source.get("netPnlUsd") for source in source_rows) or realized_today,
            "openTrades": _sum(source.get("openTrades") for source in source_rows),
            "closedTrades": _sum(source.get("closedTrades") for source in source_rows),
            "humanActionsRequired": None,
            "eventsToday": None,
            "coverage": {
                "cashLeft": _coverage_label(source_rows, "cashLeftUsd"),
                "buyingPower": _coverage_label(source_rows, "buyingPowerUsd"),
                "totalEquity": _coverage_label(source_rows, "totalEquityUsd"),
                "dailyPnl": _coverage_label(source_rows, "realizedPnlTodayUsd"),
                "risk": _coverage_label(source_rows, "openRiskUsd"),
            },
            "bySource": source_rows,
        })

    return {
        "id": "trading-command-center-daily-series",
        "granularity": "day",
        "timezone": "UTC",
        "historyStatus": "history_available" if any(not point.get("current") for point in points) else "current_day_only",
        "points": points,
        "recommendedCharts": [
            {"id": "cash-left", "label": "Cash left by day", "series": ["cashLeftUsd", "riskAdjustedCashLeftUsd"]},
            {"id": "daily-pnl", "label": "Daily P/L", "series": ["realizedPnlTodayUsd", "netPnlUsd"]},
            {"id": "risk", "label": "Open risk", "series": ["openRiskUsd"]},
        ],
    }


def _source_daily_points(project: dict[str, Any]) -> list[dict[str, Any]]:
    candidates = [
        _nested_get(project, "dailySeries.points"),
        _nested_get(project, "dailyMetrics.points"),
        _nested_get(project, "summary.dailySeries.points"),
        _nested_get(project, "summary.dailyMetrics.points"),
    ]
    for candidate in candidates:
        if isinstance(candidate, list):
            return [point for point in candidate if isinstance(point, dict)]
    return []


def _risk_snapshot(projects: list[dict[str, Any]], summary: dict[str, Any]) -> dict[str, Any]:
    kpis = summary.get("kpis") if isinstance(summary.get("kpis"), dict) else {}
    return {
        "status": "blocked" if _as_list(summary.get("blockers")) else "watch" if summary.get("status") == "watch" else "ready",
        "liveTradingLocked": summary.get("liveTradingLocked") is not False,
        "openRiskUsd": _first_present_number(kpis, "openRiskUsd"),
        "dailyLossLimitStatus": _coverage_status(projects, ("dailyLossLimitUsd", "dailyLossRemainingUsd")),
        "weeklyLossLimitStatus": _coverage_status(projects, ("weeklyLossLimitUsd", "weeklyLossRemainingUsd")),
        "maxConcurrentExposureStatus": _coverage_status(projects, ("maxConcurrentExposureUsd", "openRiskUsd")),
        "killSwitchStatus": "known" if any("kill" in " ".join(map(str, _as_list(project.get("recommendations")) + _as_list(project.get("blockers")))).lower() for project in projects) else "needs_source_detail",
        "blockers": _as_list(summary.get("blockers")),
    }


def _position_snapshot(projects: list[dict[str, Any]]) -> dict[str, Any]:
    rows = []
    for project in projects:
        summary = project.get("summary") if isinstance(project.get("summary"), dict) else {}
        positions = _as_list(summary.get("positions")) or _as_list(summary.get("openPositions")) or _as_list(summary.get("trades"))
        for index, position in enumerate(positions[:25]):
            if not isinstance(position, dict):
                continue
            rows.append({
                "id": str(position.get("id") or position.get("tradeId") or f"{project.get('projectId')}-position-{index}"),
                "sourceProject": project.get("projectId"),
                "instrument": position.get("instrument") or position.get("ticker") or position.get("symbol"),
                "kind": position.get("kind") or position.get("assetClass") or position.get("type"),
                "status": position.get("status") or position.get("state"),
                "quantity": position.get("quantity") or position.get("units") or position.get("size"),
                "notionalUsd": position.get("notionalUsd"),
                "unrealizedPnlUsd": position.get("unrealizedPnlUsd"),
                "raw": position,
            })
    return {"count": len(rows), "rows": rows[:50], "coverage": "source_positions" if rows else "summary_only"}


def _strategy_snapshot(projects: list[dict[str, Any]]) -> dict[str, Any]:
    rows = []
    for project in projects:
        summary = project.get("summary") if isinstance(project.get("summary"), dict) else {}
        for collection_key in ("strategies", "strategyQuality", "strategyRows", "topStrategies"):
            for index, strategy in enumerate(_as_list(summary.get(collection_key))):
                if not isinstance(strategy, dict):
                    continue
                rows.append({
                    "id": str(strategy.get("id") or strategy.get("strategyId") or f"{project.get('projectId')}-strategy-{index}"),
                    "sourceProject": project.get("projectId"),
                    "status": strategy.get("status") or strategy.get("readiness"),
                    "scoredTrades": strategy.get("scoredTrades") or strategy.get("trades") or strategy.get("reviewedTrades"),
                    "winRate": strategy.get("winRate"),
                    "expectancy": strategy.get("expectancy") or strategy.get("averagePnlCents") or strategy.get("averageSpreadAdjustedPnlCents"),
                    "maxDrawdown": strategy.get("maxDrawdown") or strategy.get("maxDrawdownCents"),
                    "raw": strategy,
                })
    return {"count": len(rows), "rows": rows[:50], "coverage": "source_strategy_rows" if rows else "summary_only"}


def _freshness_snapshot(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for project in projects:
        summary = project.get("summary") if isinstance(project.get("summary"), dict) else {}
        freshness = summary.get("freshness") if isinstance(summary.get("freshness"), dict) else {}
        rows.append({
            "sourceProject": project.get("projectId"),
            "available": bool(project.get("available")),
            "status": project.get("status") or "unavailable",
            "latencyMs": project.get("latencyMs"),
            "generatedAt": summary.get("generatedAt") or summary.get("asOf"),
            "latestMarketDataAt": freshness.get("latestMarketDataAt"),
            "latestAccountAt": freshness.get("latestAccountAt"),
            "latestStrategyAt": freshness.get("latestStrategyAt"),
            "latestProofAt": freshness.get("latestProofAt"),
            "sourceBaseUrl": project.get("sourceBaseUrl"),
        })
    return rows


def _action_queue(controls: list[dict[str, Any]], blockers: list[Any]) -> list[dict[str, Any]]:
    queue = []
    for index, blocker in enumerate(blockers[:20]):
        queue.append({
            "id": f"blocker-{index}",
            "type": "blocker_review",
            "status": "waiting_for_human",
            "severity": "high",
            "title": str(blocker),
            "recommendedAction": "Review source blocker before enabling additional trading automation.",
            "sourceProject": _project_from_text(str(blocker)),
            "control": None,
        })
    for control in controls:
        if not isinstance(control, dict):
            continue
        permission = str(control.get("permissionLevel") or control.get("permission") or "")
        risk = str(control.get("riskLevel") or control.get("risk") or "")
        if permission in {"approval_required", "hard_gate"} or risk in {"high", "critical"}:
            queue.append({
                "id": str(control.get("namespacedId") or control.get("id")),
                "type": "control_approval",
                "status": "available",
                "severity": risk or "medium",
                "title": str(control.get("label") or control.get("id")),
                "recommendedAction": "Route through Head Trader or the project-owned control endpoint.",
                "sourceProject": control.get("projectId"),
                "control": control,
            })
    return queue[:50]


def _coverage_status(projects: list[dict[str, Any]], keys: tuple[str, ...]) -> str:
    for project in projects:
        kpis = project.get("kpis") if isinstance(project.get("kpis"), dict) else {}
        if any(_first_present_number(kpis, key) is not None for key in keys):
            return "known"
    return "needs_source_detail"


def _project_from_text(text: str) -> str | None:
    lowered = text.lower()
    if "khashi" in lowered or "kalshi" in lowered:
        return "khashi-vc"
    if "investing" in lowered or "oanda" in lowered or "leon" in lowered:
        return "investing-system"
    return None


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
        "portfolioValueUsd": _sum(_first_number(project, "portfolioValueUsd", "accountValueUsd") for project in projects),
        "accountEquityUsd": _sum(_first_number(project, "accountEquityUsd", "equityUsd") for project in projects),
        "totalEquityUsd": _sum(_first_number(project, "totalEquityUsd", "accountEquityUsd", "portfolioValueUsd") for project in projects),
        "cashLeftUsd": _sum(_first_number(project, "cashLeftUsd", "cashUsd", "availableCashUsd", "cashAvailable") for project in projects),
        "buyingPowerUsd": _sum(_first_number(project, "buyingPowerUsd", "buyingPower") for project in projects),
        "openTrades": _sum(project.get("kpis", {}).get("openTrades") for project in projects),
        "closedTrades": _sum(_first_number(project, "closedTrades", "reviewedTrades") for project in projects),
        "realizedPnlTodayUsd": _sum(_first_number(project, "realizedPnlTodayUsd", "realizedPnlToday") for project in projects),
        "realizedPnlUsd": _sum(_first_number(project, "realizedPnlUsd", "realizedPnlToday", "strategyGrossPnl") for project in projects),
        "unrealizedPnlUsd": _sum(_first_number(project, "unrealizedPnlUsd") for project in projects),
        "openRiskUsd": _sum(project.get("kpis", {}).get("openRiskUsd") for project in projects),
        "maxDrawdownUsd": _min_number(_first_number(project, "maxDrawdownUsd") for project in projects),
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


def _first_present_number(values: dict[str, Any], *keys: str) -> float | None:
    if not isinstance(values, dict):
        return None
    for key in keys:
        value = values.get(key)
        if isinstance(value, bool):
            continue
        if isinstance(value, (int, float)):
            return float(value)
    return None


def _first_present_text(values: dict[str, Any], *keys: str) -> str | None:
    if not isinstance(values, dict):
        return None
    for key in keys:
        value = values.get(key)
        if isinstance(value, str) and value.strip():
            return value
    return None


def _sum(values: Any) -> float | None:
    numbers = [float(value) for value in values if isinstance(value, (int, float))]
    return round(sum(numbers), 2) if numbers else None


def _min_number(values: Any) -> float | None:
    numbers = [float(value) for value in values if isinstance(value, (int, float))]
    return round(min(numbers), 2) if numbers else None


def _coverage_label(rows: list[dict[str, Any]], key: str) -> str:
    if not rows:
        return "missing"
    known = sum(1 for row in rows if row.get(key) is not None)
    if known == len(rows):
        return "known"
    if known:
        return "partial"
    return "missing"


def _nested_get(values: dict[str, Any], key: str) -> Any:
    if not isinstance(values, dict):
        return None
    if key in values:
        return values[key]
    current: Any = values
    for part in key.split("."):
        if not isinstance(current, dict) or part not in current:
            return None
        current = current[part]
    return current


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
