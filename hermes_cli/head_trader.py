"""Head Trader conversation-first decision controller.

The Head Trader coordinates trading incidents, explanations, approvals, and
safe control routing across Investing System and Khashi VC. It does not place
live trades.
"""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from hermes_cli.config import get_hermes_home

from hermes_cli.trading_intelligence import (
    CONTRACT_VERSION as TRADING_CONTRACT_VERSION,
    trading_intelligence_control,
    trading_intelligence_controls,
    trading_intelligence_events,
    trading_intelligence_summary,
)


CONTRACT_VERSION = "head-trader-control-plane.v1"
FRONTEND_CONTRACT_VERSION = "2026-09-09.v1"


def action_catalog() -> dict[str, Any]:
    actions = [
        {
            "id": "head_trader.send_summary",
            "label": "Send trading summary",
            "desk": "cross_system",
            "projectId": "nous-hermes-agent",
            "permissionLevel": "inform",
            "liveTradingImpact": "none",
            "requiresConfirmation": False,
            "riskLevel": "low",
            "backendControlId": None,
        },
        {
            "id": "head_trader.refresh_readonly",
            "label": "Refresh readonly intelligence",
            "desk": "cross_system",
            "projectId": "nous-hermes-agent",
            "permissionLevel": "auto_safe",
            "liveTradingImpact": "none",
            "requiresConfirmation": False,
            "riskLevel": "low",
            "backendControlId": None,
        },
        {
            "id": "investing.pause_oanda_runtime",
            "label": "Pause OANDA runtime",
            "desk": "oanda",
            "projectId": "investing-system",
            "permissionLevel": "approval_required",
            "liveTradingImpact": "runtime_control",
            "requiresConfirmation": True,
            "riskLevel": "high",
            "backendControlId": "investing-system:pause_oanda_runtime",
        },
        {
            "id": "investing.refresh_daily_ops",
            "label": "Refresh OANDA daily ops",
            "desk": "oanda",
            "projectId": "investing-system",
            "permissionLevel": "approval_required",
            "liveTradingImpact": "runtime_control",
            "requiresConfirmation": True,
            "riskLevel": "medium",
            "backendControlId": "investing-system:refresh_daily_ops",
        },
        {
            "id": "investing.emergency_lock_trading",
            "label": "Emergency lock OANDA trading",
            "desk": "oanda",
            "projectId": "investing-system",
            "permissionLevel": "approval_required",
            "liveTradingImpact": "runtime_control",
            "requiresConfirmation": True,
            "riskLevel": "critical",
            "backendControlId": "investing-system:emergency_lock_trading",
        },
        {
            "id": "investing.resume_oanda_runtime",
            "label": "Resume OANDA runtime",
            "desk": "oanda",
            "projectId": "investing-system",
            "permissionLevel": "hard_gate",
            "liveTradingImpact": "runtime_control",
            "requiresConfirmation": True,
            "riskLevel": "critical",
            "backendControlId": "investing-system:resume_oanda_runtime",
        },
        {
            "id": "khashi.run_freshness_proof",
            "label": "Run Khashi freshness proof",
            "desk": "khashi",
            "projectId": "khashi-vc",
            "permissionLevel": "approval_required",
            "liveTradingImpact": "paper_only",
            "requiresConfirmation": True,
            "riskLevel": "medium",
            "backendControlId": "khashi-vc:run_freshness_proof",
        },
        {
            "id": "khashi.pause_collection",
            "label": "Pause Khashi collection",
            "desk": "khashi",
            "projectId": "khashi-vc",
            "permissionLevel": "approval_required",
            "liveTradingImpact": "paper_only",
            "requiresConfirmation": True,
            "riskLevel": "high",
            "backendControlId": "khashi-vc:pause_collection",
        },
        {
            "id": "khashi.shadow_collection",
            "label": "Move Khashi to shadow collection",
            "desk": "khashi",
            "projectId": "khashi-vc",
            "permissionLevel": "approval_required",
            "liveTradingImpact": "paper_only",
            "requiresConfirmation": True,
            "riskLevel": "medium",
            "backendControlId": "khashi-vc:shadow_collection",
        },
        {
            "id": "khashi.active_collection",
            "label": "Request active Khashi collection",
            "desk": "khashi",
            "projectId": "khashi-vc",
            "permissionLevel": "hard_gate",
            "liveTradingImpact": "paper_only",
            "requiresConfirmation": True,
            "riskLevel": "critical",
            "backendControlId": "khashi-vc:active_collection",
        },
        {
            "id": "head_trader.place_live_order",
            "label": "Place live order",
            "desk": "cross_system",
            "projectId": "nous-hermes-agent",
            "permissionLevel": "forbidden",
            "liveTradingImpact": "live_order",
            "requiresConfirmation": True,
            "riskLevel": "critical",
            "backendControlId": None,
        },
    ]
    return {
        "id": "head-trader-action-catalog",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "permissionLevels": ["inform", "auto_safe", "approval_required", "hard_gate", "forbidden"],
        "actions": actions,
    }


async def head_trader_summary(store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    refresh = await refresh_incidents(store)
    incidents = store.list_records("incidents")
    open_incidents = [item for item in incidents if item.get("status") not in {"resolved", "ignored", "expired"}]
    waiting = [item for item in open_incidents if item.get("status") == "waiting_for_human"]
    return {
        "id": "head-trader-summary",
        "contractVersion": CONTRACT_VERSION,
        "frontendContractVersion": FRONTEND_CONTRACT_VERSION,
        "generatedAt": _now(),
        "status": _head_trader_status(open_incidents),
        "liveTradingLocked": True,
        "desks": refresh["desks"],
        "kpis": {
            "openIncidents": len(open_incidents),
            "waitingForHuman": len(waiting),
            "criticalIncidents": sum(1 for item in open_incidents if item.get("severity") == "critical"),
            "actionsAvailable": len(action_catalog()["actions"]),
            "sourceProjectsAvailable": refresh["tradingSummary"].get("kpis", {}).get("projectsAvailable"),
            "sourceProjectsTotal": refresh["tradingSummary"].get("kpis", {}).get("projectsTotal"),
        },
        "latestIncidents": sorted(open_incidents, key=lambda item: item.get("updatedAt", ""), reverse=True)[:10],
        "recommendations": _summary_recommendations(open_incidents),
    }


async def refresh_incidents(store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    summary = await trading_intelligence_summary()
    events = await trading_intelligence_events(20)
    incidents = []
    for project in summary.get("projects", []):
        desk = _desk_for_project(project.get("projectId"))
        for blocker in project.get("blockers", []):
            incidents.append(_incident_from_blocker(project, desk, str(blocker), summary))
    for event in events.get("events", []):
        severity = str(event.get("severity") or event.get("status") or "info").lower()
        if severity in {"error", "critical", "high"} or event.get("type") == "source_unavailable":
            incidents.append(_incident_from_event(event, summary))
    upserted = [store.upsert_incident(item) for item in incidents]
    store.audit("incidents.refreshed", "system", {"createdOrUpdated": len(upserted)})
    return {
        "id": "head-trader-refresh",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "createdOrUpdated": len(upserted),
        "incidents": upserted,
        "desks": _desk_statuses(summary),
        "tradingSummary": summary,
    }


def list_incidents(store: "HeadTraderStore | None" = None, status: str | None = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    incidents = store.list_records("incidents")
    if status:
        incidents = [item for item in incidents if item.get("status") == status]
    incidents.sort(key=lambda item: item.get("updatedAt", ""), reverse=True)
    return {"id": "head-trader-incidents", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "incidents": incidents}


def get_incident(incident_id: str, store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    incident = store.get_record("incidents", incident_id)
    if not incident:
        return {"error": "incident not found", "id": incident_id}
    return {"id": "head-trader-incident", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "incident": incident}


def ignore_incident(incident_id: str, payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    incident = store.update_incident_status(incident_id, "ignored", payload.get("reason") or "operator ignored")
    store.audit("incident.ignored", payload.get("actorId") or "operator", {"incidentId": incident_id, "reason": payload.get("reason")})
    return {"id": "head-trader-incident-ignore", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "incident": incident}


def resolve_incident(incident_id: str, payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    incident = store.update_incident_status(incident_id, "resolved", payload.get("reason") or "operator resolved")
    store.audit("incident.resolved", payload.get("actorId") or "operator", {"incidentId": incident_id, "reason": payload.get("reason")})
    return {"id": "head-trader-incident-resolve", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "incident": incident}


async def reply_to_incident(incident_id: str, payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    incident = store.get_record("incidents", incident_id)
    if not incident:
        return {"id": "head-trader-reply", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "status": "rejected", "error": "incident not found"}
    text = str(payload.get("message") or payload.get("text") or "").strip()
    actor = str(payload.get("actorId") or "operator")
    conversation = store.ensure_conversation(incident_id, payload.get("channel") or "dashboard")
    inbound = store.append_message(conversation["id"], "human", actor, text)
    intent = interpret_reply(text, incident)
    response_text = _response_for_intent(intent, incident)
    outbound = store.append_message(conversation["id"], "head_trader", "head-trader", response_text, {"intent": intent})
    decision = None
    if intent.get("actionId"):
        decision = await create_decision({"incidentId": incident_id, "actionId": intent["actionId"], "reason": text, "channel": payload.get("channel") or "dashboard", "actorId": actor}, store)
        store.update_incident_status(incident_id, "waiting_for_human", "decision requires confirmation")
    store.audit("conversation.reply", actor, {"incidentId": incident_id, "intent": intent, "decisionId": decision.get("decision", {}).get("id") if decision else None})
    return {
        "id": "head-trader-reply",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "status": "received",
        "conversation": conversation,
        "messages": [inbound, outbound],
        "intent": intent,
        "decision": decision.get("decision") if decision else None,
    }


async def create_decision(payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    risk = await risk_check(payload, store)
    action = find_action(str(payload.get("actionId") or ""))
    decision = {
        "id": f"decision-{uuid4().hex[:12]}",
        "incidentId": payload.get("incidentId"),
        "actionId": payload.get("actionId"),
        "backendControlId": action.get("backendControlId") if action else None,
        "actorId": payload.get("actorId") or "operator",
        "channel": payload.get("channel") or "dashboard",
        "reason": payload.get("reason") or "",
        "status": "waiting_for_confirmation" if risk.get("requiresConfirmation") and risk.get("allowed") else "rejected" if not risk.get("allowed") else "approved",
        "risk": risk,
        "createdAt": _now(),
        "updatedAt": _now(),
        "result": None,
    }
    saved = store.append_record("decisions", decision)
    store.audit("decision.created", decision["actorId"], {"decisionId": saved["id"], "risk": risk})
    return {"id": "head-trader-decision", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "decision": saved}


async def confirm_decision(decision_id: str, payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    decision = store.get_record("decisions", decision_id)
    if not decision:
        return {"id": "head-trader-decision-confirm", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "status": "rejected", "error": "decision not found"}
    risk = await risk_check({"incidentId": decision.get("incidentId"), "actionId": decision.get("actionId"), "execute": True}, store)
    if not risk.get("allowed") or risk.get("permissionLevel") in {"hard_gate", "forbidden"}:
        decision.update({"status": "rejected", "risk": risk, "updatedAt": _now()})
        store.replace_record("decisions", decision)
        store.audit("decision.rejected", payload.get("actorId") or decision.get("actorId"), {"decisionId": decision_id, "risk": risk})
        return {"id": "head-trader-decision-confirm", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "status": "rejected", "decision": decision}
    backend_control = decision.get("backendControlId")
    result = {"status": "noop", "reason": "No backend control is attached to this action."}
    if backend_control:
        result = await trading_intelligence_control({
            "action": backend_control,
            "execute": True,
            "reason": payload.get("reason") or decision.get("reason") or "Head Trader confirmed decision.",
            "actorId": payload.get("actorId") or decision.get("actorId") or "operator",
            "correlationId": decision_id,
        })
    decision.update({"status": "executed" if result.get("status") in {"proxied", "accepted"} else "failed", "risk": risk, "result": result, "confirmedAt": _now(), "updatedAt": _now()})
    store.replace_record("decisions", decision)
    if decision.get("incidentId"):
        store.update_incident_status(str(decision["incidentId"]), "executed", "approved control was routed")
    store.audit("decision.confirmed", payload.get("actorId") or decision.get("actorId"), {"decisionId": decision_id, "resultStatus": result.get("status")})
    return {"id": "head-trader-decision-confirm", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "status": decision["status"], "decision": decision}


def reject_decision(decision_id: str, payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    decision = store.get_record("decisions", decision_id)
    if not decision:
        return {"id": "head-trader-decision-reject", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "status": "rejected", "error": "decision not found"}
    decision.update({"status": "rejected", "rejectedAt": _now(), "updatedAt": _now(), "rejectReason": payload.get("reason") or ""})
    store.replace_record("decisions", decision)
    store.audit("decision.rejected", payload.get("actorId") or decision.get("actorId"), {"decisionId": decision_id, "reason": payload.get("reason")})
    return {"id": "head-trader-decision-reject", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "decision": decision}


async def risk_check(payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    action = find_action(str(payload.get("actionId") or ""))
    blockers = []
    if not action:
        blockers.append("Unknown action.")
        return _risk(False, "critical", "unknown", True, blockers, "The requested action is not in the explicit Head Trader catalog.")
    summary = await trading_intelligence_summary()
    if summary.get("liveTradingLocked") is False and action.get("liveTradingImpact") == "live_order":
        blockers.append("Live order actions remain disabled from Head Trader.")
    if action["permissionLevel"] == "forbidden":
        blockers.append("Action is forbidden by policy.")
    if action["permissionLevel"] == "hard_gate":
        blockers.append("Action requires a hard human gate outside conversational confirmation.")
    project_id = action.get("projectId")
    if project_id in {"investing-system", "khashi-vc"}:
        project = next((item for item in summary.get("projects", []) if item.get("projectId") == project_id), None)
        if not project or not project.get("available"):
            blockers.append(f"{project_id} is unavailable.")
    allowed = not blockers and action["permissionLevel"] in {"inform", "auto_safe", "approval_required"}
    return _risk(
        allowed,
        action.get("riskLevel") or "medium",
        action["permissionLevel"],
        bool(action.get("requiresConfirmation")),
        blockers,
        "Allowed after confirmation." if allowed and action.get("requiresConfirmation") else "Allowed." if allowed else "Blocked by Head Trader risk policy.",
    )


def list_conversations(store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    conversations = store.list_records("conversations")
    conversations.sort(key=lambda item: item.get("updatedAt", ""), reverse=True)
    return {"id": "head-trader-conversations", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "conversations": conversations}


def get_conversation(conversation_id: str, store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    conversation = store.get_record("conversations", conversation_id)
    messages = [item for item in store.list_records("messages") if item.get("conversationId") == conversation_id]
    return {"id": "head-trader-conversation", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "conversation": conversation, "messages": messages}


def list_audit(store: "HeadTraderStore | None" = None, limit: Any = 100) -> dict[str, Any]:
    store = store or HeadTraderStore()
    items = store.list_records("audit")[-max(1, min(500, _to_int(limit, 100))):]
    items.reverse()
    return {"id": "head-trader-audit", "contractVersion": CONTRACT_VERSION, "generatedAt": _now(), "events": items}


def incident_evidence(incident_id: str, store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    incident = store.get_record("incidents", incident_id)
    return {
        "id": "head-trader-evidence",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "incidentId": incident_id,
        "evidence": incident.get("evidence") if incident else None,
        "incident": incident,
    }


def channel_status() -> dict[str, Any]:
    return {
        "id": "head-trader-channel-status",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "channels": [
            {"id": "discord", "enabled": _enabled("HEAD_TRADER_DISCORD_ENABLED"), "configured": bool(os.environ.get("HEAD_TRADER_DISCORD_WEBHOOK_URL")), "mode": "disabled_by_default"},
            {"id": "telegram", "enabled": _enabled("HEAD_TRADER_TELEGRAM_ENABLED"), "configured": bool(os.environ.get("HEAD_TRADER_TELEGRAM_BOT_TOKEN") and os.environ.get("HEAD_TRADER_TELEGRAM_CHAT_ID")), "mode": "disabled_by_default"},
        ],
    }


def receive_channel_webhook(channel: str, payload: dict[str, Any], store: "HeadTraderStore | None" = None) -> dict[str, Any]:
    store = store or HeadTraderStore()
    enabled = _enabled(f"HEAD_TRADER_{channel.upper()}_ENABLED")
    store.audit("channel.webhook.received", channel, {"enabled": enabled, "payloadKeys": sorted(payload.keys())})
    return {
        "id": "head-trader-channel-webhook",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "channel": channel,
        "status": "disabled" if not enabled else "accepted",
        "note": "Channel adapters are disabled by default; enable with explicit environment configuration.",
    }


def frontend_spec() -> dict[str, Any]:
    return {
        "id": "head-trader-frontend-spec",
        "contractVersion": CONTRACT_VERSION,
        "frontendContractVersion": FRONTEND_CONTRACT_VERSION,
        "generatedAt": _now(),
        "basePath": "/api/head-trader",
        "purpose": "Build a conversation-first Head Trader page that triages blockers, explains decisions, checks risk, and routes approved controls.",
        "endpoints": [
            "GET /summary",
            "POST /refresh",
            "GET /incidents",
            "GET /incidents/{id}",
            "POST /incidents/{id}/reply",
            "POST /incidents/{id}/ignore",
            "POST /incidents/{id}/resolve",
            "GET /action-catalog",
            "POST /risk-check",
            "POST /decisions",
            "POST /decisions/{id}/confirm",
            "POST /decisions/{id}/reject",
            "GET /conversations",
            "GET /conversations/{id}",
            "GET /audit",
            "GET /evidence/{incidentId}",
            "GET /channels",
        ],
        "pageSections": ["status header", "desk cards", "incident queue", "conversation panel", "action/risk panel", "audit trail", "channel status"],
        "safety": {"liveTradingLocked": True, "freeFormExecution": False, "liveOrderSubmit": False},
    }


class HeadTraderStore:
    def __init__(self, root: Path | None = None):
        self.root = root or Path(os.environ.get("HEAD_TRADER_DATA_DIR") or (get_hermes_home() / "head-trader"))
        self.root.mkdir(parents=True, exist_ok=True)

    def path(self, name: str) -> Path:
        return self.root / f"{name}.jsonl"

    def list_records(self, name: str) -> list[dict[str, Any]]:
        path = self.path(name)
        if not path.exists():
            return []
        records = []
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                continue
        return records

    def append_record(self, name: str, record: dict[str, Any]) -> dict[str, Any]:
        self.path(name).parent.mkdir(parents=True, exist_ok=True)
        with self.path(name).open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, sort_keys=True) + "\n")
        return record

    def replace_record(self, name: str, record: dict[str, Any]) -> dict[str, Any]:
        records = self.list_records(name)
        replaced = False
        next_records = []
        for item in records:
            if item.get("id") == record.get("id"):
                replaced = True
            else:
                next_records.append(item)
        if replaced:
            next_records.append(record)
        if not replaced:
            next_records.append(record)
        self.path(name).write_text("".join(json.dumps(item, sort_keys=True) + "\n" for item in next_records), encoding="utf-8")
        return record

    def get_record(self, name: str, record_id: str) -> dict[str, Any] | None:
        return next((item for item in reversed(self.list_records(name)) if item.get("id") == record_id), None)

    def upsert_incident(self, incident: dict[str, Any]) -> dict[str, Any]:
        existing = self.get_record("incidents", incident["id"])
        if existing and existing.get("status") not in {"resolved", "ignored"}:
            existing.update({
                "summary": incident["summary"],
                "evidence": incident["evidence"],
                "options": incident["options"],
                "recommendation": incident["recommendation"],
                "updatedAt": _now(),
            })
            return self.replace_record("incidents", existing)
        return self.append_record("incidents", incident)

    def update_incident_status(self, incident_id: str, status: str, reason: str) -> dict[str, Any] | None:
        incident = self.get_record("incidents", incident_id)
        if not incident:
            return None
        incident.update({"status": status, "statusReason": reason, "updatedAt": _now()})
        return self.replace_record("incidents", incident)

    def ensure_conversation(self, incident_id: str, channel: str) -> dict[str, Any]:
        existing = next((item for item in self.list_records("conversations") if item.get("incidentId") == incident_id and item.get("channel") == channel and item.get("status") == "active"), None)
        if existing:
            existing["updatedAt"] = _now()
            return self.replace_record("conversations", existing)
        return self.append_record("conversations", {
            "id": f"conversation-{uuid4().hex[:12]}",
            "incidentId": incident_id,
            "channel": channel,
            "externalThreadId": None,
            "status": "active",
            "createdAt": _now(),
            "updatedAt": _now(),
        })

    def append_message(self, conversation_id: str, sender: str, actor_id: str, text: str, metadata: dict[str, Any] | None = None) -> dict[str, Any]:
        message = {
            "id": f"message-{uuid4().hex[:12]}",
            "conversationId": conversation_id,
            "sender": sender,
            "actorId": actor_id,
            "text": text,
            "metadata": metadata or {},
            "createdAt": _now(),
        }
        return self.append_record("messages", message)

    def audit(self, event_type: str, actor_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self.append_record("audit", {
            "id": f"audit-{uuid4().hex[:12]}",
            "type": event_type,
            "actorId": actor_id,
            "payload": payload,
            "createdAt": _now(),
        })


def interpret_reply(text: str, incident: dict[str, Any]) -> dict[str, Any]:
    lowered = text.lower().strip()
    desk = incident.get("desk")
    if any(word in lowered for word in ["explain", "why", "evidence"]):
        return {"intent": "explain", "actionId": None, "confidence": 0.9}
    if any(word in lowered for word in ["status", "what happened", "summary"]):
        return {"intent": "status", "actionId": None, "confidence": 0.85}
    if any(word in lowered for word in ["ignore", "snooze"]):
        return {"intent": "ignore", "actionId": None, "confidence": 0.8}
    if "proof" in lowered or "freshness" in lowered:
        return {"intent": "action", "actionId": "khashi.run_freshness_proof", "confidence": 0.78}
    if "pause" in lowered:
        return {"intent": "action", "actionId": "khashi.pause_collection" if desk == "khashi" else "investing.pause_oanda_runtime", "confidence": 0.75}
    if "lock" in lowered:
        return {"intent": "action", "actionId": "investing.emergency_lock_trading", "confidence": 0.75}
    return {"intent": "unknown", "actionId": None, "confidence": 0.35}


def find_action(action_id: str) -> dict[str, Any] | None:
    return next((item for item in action_catalog()["actions"] if item["id"] == action_id), None)


def _incident_from_blocker(project: dict[str, Any], desk: str, blocker: str, summary: dict[str, Any]) -> dict[str, Any]:
    incident_id = _incident_id(desk, project.get("projectId"), blocker)
    severity = "critical" if project.get("status") == "blocked" else "high" if project.get("status") == "watch" else "watch"
    return {
        "id": incident_id,
        "contractVersion": CONTRACT_VERSION,
        "sourceProject": project.get("projectId"),
        "desk": desk,
        "type": "blocker",
        "severity": severity,
        "title": f"{project.get('label', project.get('projectId'))} needs attention",
        "summary": blocker,
        "evidence": {"project": project, "tradingContractVersion": summary.get("contractVersion", TRADING_CONTRACT_VERSION)},
        "recommendation": _recommendation_for(desk, blocker),
        "options": _options_for(desk),
        "status": "open",
        "createdAt": _now(),
        "updatedAt": _now(),
    }


def _incident_from_event(event: dict[str, Any], summary: dict[str, Any]) -> dict[str, Any]:
    desk = _desk_for_project(event.get("sourceProject"))
    text = event.get("summary") or event.get("title") or event.get("type")
    return {
        "id": _incident_id(desk, event.get("sourceProject"), str(text)),
        "contractVersion": CONTRACT_VERSION,
        "sourceProject": event.get("sourceProject"),
        "desk": desk,
        "type": event.get("type") or "event",
        "severity": "critical" if event.get("severity") in {"critical", "error"} else "high",
        "title": event.get("title") or "Trading event needs attention",
        "summary": str(text),
        "evidence": {"event": event, "tradingContractVersion": summary.get("contractVersion", TRADING_CONTRACT_VERSION)},
        "recommendation": _recommendation_for(desk, str(text)),
        "options": _options_for(desk),
        "status": "open",
        "createdAt": _now(),
        "updatedAt": _now(),
    }


def _desk_statuses(summary: dict[str, Any]) -> list[dict[str, Any]]:
    desks = []
    for project in summary.get("projects", []):
        desks.append({
            "id": _desk_for_project(project.get("projectId")),
            "projectId": project.get("projectId"),
            "label": "OANDA Desk Trader" if project.get("projectId") == "investing-system" else "Khashi Perpetual Desk Trader",
            "status": project.get("status"),
            "available": project.get("available"),
            "blockers": project.get("blockers", []),
            "kpis": project.get("kpis", {}),
        })
    desks.append({
        "id": "cross_system",
        "projectId": "nous-hermes-agent",
        "label": "Cross-System Risk Officer",
        "status": summary.get("status"),
        "available": True,
        "blockers": summary.get("blockers", []),
        "kpis": summary.get("kpis", {}),
    })
    return desks


def _options_for(desk: str) -> list[dict[str, Any]]:
    common = [
        {"id": "explain", "label": "Explain evidence", "actionId": None, "expectedEffect": "Show why the incident was opened.", "requiresConfirmation": False},
        {"id": "ignore", "label": "Ignore for now", "actionId": None, "expectedEffect": "Mark incident ignored.", "requiresConfirmation": False},
    ]
    if desk == "khashi":
        return [{"id": "run-proof", "label": "Run freshness proof", "actionId": "khashi.run_freshness_proof", "expectedEffect": "Ask Khashi to verify market freshness.", "requiresConfirmation": True}, *common]
    if desk == "oanda":
        return [{"id": "pause-runtime", "label": "Pause OANDA runtime", "actionId": "investing.pause_oanda_runtime", "expectedEffect": "Persist stopped runtime state.", "requiresConfirmation": True}, *common]
    return common


def _recommendation_for(desk: str, text: str) -> str:
    lowered = text.lower()
    if desk == "khashi" and any(word in lowered for word in ["fresh", "stale", "market", "snapshot"]):
        return "Run Khashi freshness proof before trusting new perpetual-market paper decisions."
    if desk == "oanda" and any(word in lowered for word in ["runtime", "stale", "signal", "strategy"]):
        return "Review OANDA runtime and consider pausing before accepting new strategy decisions."
    return "Explain evidence first, then choose an explicit approved action if needed."


def _response_for_intent(intent: dict[str, Any], incident: dict[str, Any]) -> str:
    if intent["intent"] == "explain":
        return f"{incident.get('title')}: {incident.get('summary')} Recommendation: {incident.get('recommendation')}"
    if intent["intent"] == "status":
        return f"Incident {incident.get('id')} is {incident.get('status')} with severity {incident.get('severity')}."
    if intent["intent"] == "action":
        action = find_action(str(intent.get("actionId")))
        return f"I matched that to {action.get('label') if action else intent.get('actionId')}. Confirmation is required before routing the control."
    if intent["intent"] == "ignore":
        return "I understood this as an ignore/snooze request. Use the ignore endpoint or dashboard action to mark it ignored."
    return "I could not confidently map that reply to an allowed Head Trader action. Ask for status, explain evidence, run proof, pause, or lock."


def _risk(allowed: bool, level: str, permission_level: str, requires_confirmation: bool, blockers: list[str], explanation: str) -> dict[str, Any]:
    return {
        "id": "head-trader-risk-decision",
        "contractVersion": CONTRACT_VERSION,
        "generatedAt": _now(),
        "allowed": allowed,
        "level": level,
        "permissionLevel": permission_level,
        "requiresConfirmation": requires_confirmation,
        "blockers": blockers,
        "explanation": explanation,
        "liveTradingLocked": True,
    }


def _summary_recommendations(open_incidents: list[dict[str, Any]]) -> list[str]:
    if not open_incidents:
        return ["No open Head Trader incidents. Continue monitoring trading intelligence summary and events."]
    return _unique(item.get("recommendation") for item in open_incidents if item.get("recommendation"))[:10]


def _head_trader_status(open_incidents: list[dict[str, Any]]) -> str:
    if any(item.get("severity") == "critical" for item in open_incidents):
        return "blocked"
    if open_incidents:
        return "watch"
    return "ready"


def _desk_for_project(project_id: Any) -> str:
    if project_id == "investing-system":
        return "oanda"
    if project_id == "khashi-vc":
        return "khashi"
    return "cross_system"


def _incident_id(desk: str, source: Any, text: str) -> str:
    digest = hashlib.sha256(f"{desk}:{source}:{text}".encode("utf-8")).hexdigest()[:16]
    return f"incident-{desk}-{digest}"


def _enabled(name: str) -> bool:
    return os.environ.get(name, "").lower() in {"1", "true", "yes", "on"}


def _to_int(value: Any, default: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _unique(values: Any) -> list[Any]:
    seen = set()
    result = []
    for value in values:
        if not value or value in seen:
            continue
        seen.add(value)
        result.append(value)
    return result


def _now() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
