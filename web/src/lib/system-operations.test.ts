import { describe, expect, it } from "vitest";
import { systemHealthTone } from "./system-operations";

describe("system operations helpers", () => {
  it("maps system health to dashboard tones", () => {
    expect(systemHealthTone("ready")).toBe("success");
    expect(systemHealthTone("warning")).toBe("warning");
    expect(systemHealthTone("watch")).toBe("warning");
    expect(systemHealthTone("critical")).toBe("critical");
    expect(systemHealthTone("blocked")).toBe("critical");
    expect(systemHealthTone("unknown")).toBe("info");
  });
});
