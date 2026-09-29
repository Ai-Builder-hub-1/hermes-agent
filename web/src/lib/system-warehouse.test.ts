import { describe, expect, it } from "vitest";
import { formatBytes, warehouseHealthTone } from "./system-warehouse";

describe("system warehouse helpers", () => {
  it("formats bytes using operator-friendly units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(10 * 1024 * 1024)).toBe("10 MB");
    expect(formatBytes(2.5 * 1024 * 1024 * 1024)).toBe("2.5 GB");
  });

  it("maps health to dashboard tones", () => {
    expect(warehouseHealthTone("ready")).toBe("success");
    expect(warehouseHealthTone("partial")).toBe("warning");
    expect(warehouseHealthTone("blocked")).toBe("critical");
    expect(warehouseHealthTone("unknown")).toBe("info");
  });
});
