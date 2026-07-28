import { describe, it, expect, vi, afterEach } from "vitest";
import { logInfo, logWarn, logError } from "./logger";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("logger", () => {
  it("logInfo emits a JSON line via console.log with level, message and timestamp", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logInfo("clinic created", { tenantId: "tenant-1" });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.level).toBe("info");
    expect(parsed.message).toBe("clinic created");
    expect(parsed.tenantId).toBe("tenant-1");
    expect(typeof parsed.timestamp).toBe("string");
    expect(() => new Date(parsed.timestamp).toISOString()).not.toThrow();
  });

  it("logWarn emits via console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logWarn("rate limit close to threshold", { ip: "1.2.3.4" });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.level).toBe("warn");
    expect(parsed.ip).toBe("1.2.3.4");
  });

  it("logError emits via console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logError("unhandled exception", { route: "/api/reports/sales" });

    expect(spy).toHaveBeenCalledOnce();
    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.level).toBe("error");
    expect(parsed.route).toBe("/api/reports/sales");
  });

  it("works without a context argument", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logInfo("no context here");

    const parsed = JSON.parse(spy.mock.calls[0]![0] as string);
    expect(parsed.message).toBe("no context here");
  });
});
