import { describe, expect, it } from "vitest";
import { tradingResearchTone } from "./trading-research";

describe("trading research helpers", () => {
  it("maps research health to dashboard tones", () => {
    expect(tradingResearchTone("ready")).toBe("success");
    expect(tradingResearchTone("passed")).toBe("success");
    expect(tradingResearchTone("watch")).toBe("warning");
    expect(tradingResearchTone("waiting_for_data")).toBe("warning");
    expect(tradingResearchTone("blocked")).toBe("critical");
    expect(tradingResearchTone("unknown")).toBe("info");
  });
});
