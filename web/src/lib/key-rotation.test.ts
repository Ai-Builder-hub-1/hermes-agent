import { describe, expect, it } from "vitest";
import {
  ageStatus,
  canSubmitRotation,
  filterSecrets,
  initialRotateDialogState,
  macCommand,
  parseApiError,
  requiredValueNames,
  rotateDialogReducer,
  rotationRequestFrom,
  sortByRisk,
  type RotateDialogState,
  type RotationSecret,
} from "./key-rotation";

function secret(overrides: Partial<RotationSecret> = {}): RotationSecret {
  return {
    name: "OPENAI_API_KEY",
    provider: "openai",
    kind: "api-key",
    rotateUrl: "https://platform.openai.com/api-keys",
    pairWith: [],
    server: [{ path: "/root/apps/hermes/.env", present: true }],
    services: ["hermes-gateway"],
    lastRotatedAt: "2026-10-01T00:00:00Z",
    ageDays: 19,
    lastVerify: { status: "ok", checkedAt: "2026-10-19T00:00:00Z" },
    history: [],
    ...overrides,
  };
}

const FAKE = "sk-FAKE-value-never-kept";

describe("age thresholds", () => {
  it("is amber over 90 days, red over 180 days or never rotated", () => {
    expect(ageStatus(secret({ ageDays: 90 }), true)).toBe("ok");
    expect(ageStatus(secret({ ageDays: 91 }), true)).toBe("due");
    expect(ageStatus(secret({ ageDays: 181 }), true)).toBe("overdue");
    expect(ageStatus(secret({ ageDays: null, lastRotatedAt: null }), true)).toBe("never");
  });

  it("does not claim 'never rotated' when the rotator is disconnected", () => {
    expect(ageStatus(secret({ ageDays: null, lastRotatedAt: null }), false)).toBe("unknown");
  });
});

describe("risk ordering and filters", () => {
  const rows = [
    secret({ name: "FRESH_KEY", ageDays: 3 }),
    secret({ name: "DUE_KEY", ageDays: 120 }),
    secret({ name: "NEVER_KEY", ageDays: null, lastRotatedAt: null, provider: "alpaca" }),
    secret({ name: "BROKEN_KEY", ageDays: 10, lastVerify: { status: "failed", checkedAt: null } }),
  ];

  it("puts the riskiest secrets first", () => {
    expect(sortByRisk(rows, true).map((s) => s.name)).toEqual(["NEVER_KEY", "DUE_KEY", "BROKEN_KEY", "FRESH_KEY"]);
  });

  it("filters by provider and status", () => {
    expect(filterSecrets(rows, true, { provider: "alpaca", status: "all" }).map((s) => s.name)).toEqual(["NEVER_KEY"]);
    expect(filterSecrets(rows, true, { provider: "all", status: "verify-failed" }).map((s) => s.name)).toEqual(["BROKEN_KEY"]);
    expect(filterSecrets(rows, true, { provider: "all", status: "ok" }).map((s) => s.name)).toEqual(["FRESH_KEY"]);
  });
});

describe("rotate dialog", () => {
  const pair = secret({ name: "ALPACA_API_KEY", pairWith: ["ALPACA_SECRET_KEY"] });

  function filled(): RotateDialogState {
    let state = rotateDialogReducer(initialRotateDialogState, { type: "setValue", name: "ALPACA_API_KEY", value: FAKE });
    state = rotateDialogReducer(state, { type: "setValue", name: "ALPACA_SECRET_KEY", value: FAKE });
    return rotateDialogReducer(state, { type: "setConfirm", value: "ALPACA_API_KEY" });
  }

  it("asks for both halves of a pair", () => {
    expect(requiredValueNames(pair)).toEqual(["ALPACA_API_KEY", "ALPACA_SECRET_KEY"]);
  });

  it("gates submit on an exact name confirmation and every value", () => {
    const ready = filled();
    expect(canSubmitRotation(ready, pair)).toBe(true);
    expect(canSubmitRotation({ ...ready, confirm: "alpaca_api_key" }, pair)).toBe(false);
    expect(canSubmitRotation({ ...ready, values: { ALPACA_API_KEY: FAKE } }, pair)).toBe(false);
  });

  it("builds the request from state and clears values on submit and close", () => {
    const ready = filled();
    expect(rotationRequestFrom(ready, pair)).toEqual({
      values: { ALPACA_API_KEY: FAKE, ALPACA_SECRET_KEY: FAKE },
      confirm: "ALPACA_API_KEY",
      dryRun: true,
    });
    const submitting = rotateDialogReducer(ready, { type: "submit" });
    expect(submitting.values).toEqual({});
    expect(JSON.stringify(submitting)).not.toContain(FAKE);
    expect(canSubmitRotation(submitting, pair)).toBe(false);

    const closed = rotateDialogReducer(ready, { type: "close" });
    expect(closed).toEqual(initialRotateDialogState);
    expect(JSON.stringify(closed)).not.toContain(FAKE);
  });

  it("returns to editing for the real run after a dry run, with values empty", () => {
    const done = rotateDialogReducer(rotateDialogReducer(filled(), { type: "submit" }), {
      type: "success",
      result: { name: "ALPACA_API_KEY", dryRun: true, result: "dry-run", steps: [], error: null, macCommand: "" },
    });
    const again = rotateDialogReducer(done, { type: "again" });
    expect(again.phase).toBe("editing");
    expect(again.dryRun).toBe(false);
    expect(again.values).toEqual({});
  });
});

describe("helpers", () => {
  it("gives the exact Mac command", () => {
    expect(macCommand("OPENAI_API_KEY")).toBe("hermes-keys rotate OPENAI_API_KEY --mac-only");
  });

  it("parses structured API errors", () => {
    const parsed = parseApiError(new Error('400: {"detail":"Confirmation does not match the secret name."}'));
    expect(parsed.status).toBe(400);
    expect(parsed.message).toBe("Confirmation does not match the secret name.");
  });
});
