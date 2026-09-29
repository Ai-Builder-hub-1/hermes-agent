"""Portfolio-level trading intelligence contracts for Hermes."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


CONTRACT_VERSION = "trading-portfolio-intelligence.v1"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def portfolio_intelligence_summary() -> dict[str, Any]:
    from hermes_cli.trading_intelligence import trading_command_center

    command = await trading_command_center(limit=10)
    return portfolio_intelligence_from_command(command)


def portfolio_intelligence_from_command(command: dict[str, Any]) -> dict[str, Any]:
    daily = command.get("dailyMetrics") if isinstance(command.get("dailyMetrics"), dict) else {}
    capital = command.get("capital") if isinstance(command.get("capital"), dict) else {}
    risk = command.get("risk") if isinstance(command.get("risk"), dict) else {}
    positions = command.get("positions") if isinstance(command.get("positions"), dict) else {}
    source_projects = [project for project in command.get("sourceProjects") or [] if isinstance(project, dict)]
    exposures = _exposures(daily, positions, source_projects)
    total_known_value = _sum(row.get("knownValueUsd") for row in exposures)
    open_risk = _number(daily.get("openRiskUsd")) or _number(capital.get("openRiskUsd")) or _number(risk.get("openRiskUsd"))
    cash_left = _number(daily.get("cashLeftUsd")) or _number(capital.get("cashLeftUsd"))
    real_cash = _sum(row.get("cashLeftUsd") for row in exposures if row.get("capitalType") == "real-broker-cash")
    internal_bankroll = _sum(row.get("cashLeftUsd") for row in exposures if row.get("capitalType") == "internal-paper-bankroll")
    missing = [row for row in exposures if row.get("coverage") != "known"]
    concentration = _concentration(exposures, total_known_value)
    broker_coverage = _broker_coverage(source_projects)
    allocation_recommendations = _allocation_recommendations(
        command=command,
        exposures=exposures,
        missing=missing,
        open_risk=open_risk,
        cash_left=cash_left,
        concentration=concentration,
        broker_coverage=broker_coverage,
    )
    health = "critical" if any(item["priority"] == "critical" for item in allocation_recommendations) else "warning" if allocation_recommendations else "ready"
    return {
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "health": health,
        "liveTradingLocked": command.get("liveTradingLocked") is not False,
        "summary": {
            "capitalKnown": bool(daily.get("cashLeftKnown") or capital.get("known")),
            "cashLeftUsd": cash_left,
            "buyingPowerUsd": _number(daily.get("buyingPowerUsd")) or _number(capital.get("buyingPowerUsd")),
            "realBrokerCashUsd": real_cash,
            "internalPaperBankrollUsd": internal_bankroll,
            "openRiskUsd": open_risk,
            "riskAdjustedCashLeftUsd": _number(daily.get("riskAdjustedCashLeftUsd")),
            "knownExposureUsd": total_known_value,
            "exposureCoverage": "known" if exposures and not missing else "partial" if exposures else "missing",
            "brokerCoverage": broker_coverage["status"],
            "concentrationRisk": concentration["risk"],
            "allocationPosture": "blocked" if health == "critical" else "review" if health == "warning" else "ready",
        },
        "exposures": exposures,
        "riskOffice": {
            "status": risk.get("status") or health,
            "liveTradingLocked": command.get("liveTradingLocked") is not False,
            "killSwitchStatus": risk.get("killSwitchStatus") or "needs_source_detail",
            "dailyLossLimitStatus": risk.get("dailyLossLimitStatus") or "unknown",
            "weeklyLossLimitStatus": risk.get("weeklyLossLimitStatus") or "unknown",
            "maxConcurrentExposureStatus": risk.get("maxConcurrentExposureStatus") or "unknown",
            "blockers": list(command.get("blockers") or []) + list(risk.get("blockers") or []),
        },
        "brokerCoverage": broker_coverage,
        "concentration": concentration,
        "allocationRecommendations": allocation_recommendations,
        "dissentingEvidence": _dissenting_evidence(command, missing, broker_coverage),
        "sourceRoutes": {
            "commandCenter": "/api/trading-intelligence/command-center",
            "risk": "/trading/risk",
            "evidence": "/trading/evidence",
        },
    }


def _exposures(daily: dict[str, Any], positions: dict[str, Any], source_projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_source = daily.get("bySource") if isinstance(daily.get("bySource"), list) else []
    position_rows = positions.get("rows") if isinstance(positions.get("rows"), list) else []
    rows: list[dict[str, Any]] = []
    for source in by_source:
        if not isinstance(source, dict):
            continue
        project_id = str(source.get("sourceProject") or "unknown")
        capital_source = str(source.get("capitalSource") or "")
        capital_type = "real-broker-cash" if source.get("isRealBrokerCash") is True else "internal-paper-bankroll" if capital_source == "internal-khashi-paper-bankroll" else "unknown"
        source_positions = [row for row in position_rows if isinstance(row, dict) and row.get("sourceProject") == project_id]
        known_value = _number(source.get("totalEquityUsd")) or _number(source.get("portfolioValueUsd")) or _number(source.get("cashLeftUsd"))
        rows.append({
            "id": f"exposure-{project_id}",
            "sourceProject": project_id,
            "label": str(source.get("sourceLabel") or project_id),
            "assetClass": _asset_class(project_id, source_positions),
            "coverage": "known" if known_value is not None or source_positions else "missing",
            "capitalType": capital_type,
            "capitalSemantics": str(source.get("capitalSemantics") or "Capital semantics missing."),
            "cashLeftUsd": _number(source.get("cashLeftUsd")),
            "buyingPowerUsd": _number(source.get("buyingPowerUsd")),
            "knownValueUsd": known_value,
            "openRiskUsd": _number(source.get("openRiskUsd")),
            "netPnlUsd": _number(source.get("netPnlUsd")),
            "openPositions": len(source_positions),
            "liveTradingLocked": True,
        })
    if rows:
        return rows
    for project in source_projects:
        project_id = str(project.get("projectId") or "unknown")
        rows.append({
            "id": f"exposure-{project_id}",
            "sourceProject": project_id,
            "label": str(project.get("label") or project_id),
            "assetClass": _asset_class(project_id, []),
            "coverage": "missing",
            "capitalType": "unknown",
            "capitalSemantics": "No daily capital row was published.",
            "cashLeftUsd": None,
            "buyingPowerUsd": None,
            "knownValueUsd": None,
            "openRiskUsd": None,
            "netPnlUsd": None,
            "openPositions": 0,
            "liveTradingLocked": True,
        })
    return rows


def _asset_class(project_id: str, positions: list[dict[str, Any]]) -> str:
    instruments = " ".join(str(row.get("instrument") or row.get("symbol") or "") for row in positions).upper()
    lowered = project_id.lower()
    if "khashi" in lowered or "kalshi" in instruments:
        return "event-contracts"
    if "OANDA" in instruments or "_" in instruments:
        return "fx"
    if "binance" in lowered or any(token in instruments for token in ("BTC", "ETH", "USDT")):
        return "crypto"
    if "robinhood" in lowered or "investing" in lowered:
        return "broker-mixed"
    return "unknown"


def _broker_coverage(source_projects: list[dict[str, Any]]) -> dict[str, Any]:
    brokers: list[dict[str, Any]] = []
    for project in source_projects:
        summary = project.get("summary") if isinstance(project.get("summary"), dict) else {}
        account_observability = summary.get("accountObservability") if isinstance(summary.get("accountObservability"), dict) else {}
        for broker in account_observability.get("brokers") or []:
            if isinstance(broker, dict):
                brokers.append(broker)
    configured = [broker for broker in brokers if broker.get("credentialConfigured")]
    visible = [broker for broker in brokers if broker.get("accountVisible")]
    stale = [broker for broker in brokers if broker.get("freshnessStatus") not in {"fresh", "ready"}]
    status = "missing" if not brokers else "partial" if len(visible) < len(brokers) or stale else "known"
    return {
        "status": status,
        "brokers": len(brokers),
        "configured": len(configured),
        "accountVisible": len(visible),
        "stale": len(stale),
        "liveSubmitEnabled": any(broker.get("liveSubmit") is True for broker in brokers),
    }


def _concentration(exposures: list[dict[str, Any]], total_known_value: float | None) -> dict[str, Any]:
    if not total_known_value:
        return {"risk": "unknown", "largestSourceProject": "", "largestShare": None}
    largest = max(exposures, key=lambda row: _number(row.get("knownValueUsd")) or 0, default={})
    share = round(((_number(largest.get("knownValueUsd")) or 0) / total_known_value), 4) if largest else None
    risk = "high" if share is not None and share >= 0.75 else "medium" if share is not None and share >= 0.5 else "low"
    return {"risk": risk, "largestSourceProject": largest.get("sourceProject") or "", "largestShare": share}


def _allocation_recommendations(
    *,
    command: dict[str, Any],
    exposures: list[dict[str, Any]],
    missing: list[dict[str, Any]],
    open_risk: float | None,
    cash_left: float | None,
    concentration: dict[str, Any],
    broker_coverage: dict[str, Any],
) -> list[dict[str, Any]]:
    recommendations: list[dict[str, Any]] = []
    if broker_coverage["status"] != "known":
        recommendations.append(_recommendation("broker-coverage", "Complete broker/account visibility before allocation decisions.", "critical" if broker_coverage["status"] == "missing" else "high"))
    if missing:
        recommendations.append(_recommendation("exposure-coverage", "Fill missing capital and exposure rows before comparing strategies.", "high"))
    if open_risk is not None and cash_left is not None and cash_left >= 0 and open_risk > cash_left * 0.25:
        recommendations.append(_recommendation("risk-ratio", "Review open risk before adding exposure.", "high"))
    if concentration.get("risk") in {"high", "medium"}:
        recommendations.append(_recommendation("concentration", "Review concentration before increasing allocation.", "medium"))
    if command.get("liveTradingLocked") is not False:
        recommendations.append(_recommendation("live-lock", "Keep allocation recommendations review-only while live trading is locked.", "medium"))
    if not recommendations and exposures:
        recommendations.append(_recommendation("cadence-review", "Keep portfolio risk office review on cadence.", "low"))
    return recommendations


def _recommendation(rec_id: str, title: str, priority: str) -> dict[str, Any]:
    return {
        "id": rec_id,
        "title": title,
        "priority": priority,
        "confidence": "medium" if priority in {"critical", "high"} else "low",
        "requiresApproval": priority in {"critical", "high"},
        "liveTradingLocked": True,
    }


def _dissenting_evidence(command: dict[str, Any], missing: list[dict[str, Any]], broker_coverage: dict[str, Any]) -> list[str]:
    evidence = [str(item) for item in command.get("blockers") or []]
    if missing:
        evidence.append(f"{len(missing)} exposure rows have partial or missing coverage.")
    if broker_coverage["status"] != "known":
        evidence.append(f"Broker coverage is {broker_coverage['status']}: {broker_coverage['accountVisible']}/{broker_coverage['brokers']} accounts visible.")
    return evidence


def _number(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    try:
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def _sum(values: Any) -> float | None:
    numbers = [_number(value) for value in values]
    valid = [number for number in numbers if number is not None]
    return round(sum(valid), 2) if valid else None
