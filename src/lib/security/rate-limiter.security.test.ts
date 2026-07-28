import { describe, it, expect } from "vitest";
import { createRateLimitStore, checkRateLimit } from "./rate-limiter";

const WINDOW_MS = 60_000;
const LIMIT = 3;

describe("checkRateLimit", () => {
  it("allows requests up to the limit within the window", () => {
    const store = createRateLimitStore();
    const now = 1_000_000;

    expect(checkRateLimit(store, "ip-1", now, LIMIT, WINDOW_MS).allowed).toBe(true);
    expect(checkRateLimit(store, "ip-1", now + 10, LIMIT, WINDOW_MS).allowed).toBe(true);
    expect(checkRateLimit(store, "ip-1", now + 20, LIMIT, WINDOW_MS).allowed).toBe(true);
  });

  it("blocks the request that exceeds the limit and reports retryAfterSeconds", () => {
    const store = createRateLimitStore();
    const now = 1_000_000;

    checkRateLimit(store, "ip-1", now, LIMIT, WINDOW_MS);
    checkRateLimit(store, "ip-1", now + 10, LIMIT, WINDOW_MS);
    checkRateLimit(store, "ip-1", now + 20, LIMIT, WINDOW_MS);

    const blocked = checkRateLimit(store, "ip-1", now + 30, LIMIT, WINDOW_MS);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets the window once windowMs has elapsed since the first request in the window", () => {
    const store = createRateLimitStore();
    const now = 1_000_000;

    checkRateLimit(store, "ip-1", now, LIMIT, WINDOW_MS);
    checkRateLimit(store, "ip-1", now + 10, LIMIT, WINDOW_MS);
    checkRateLimit(store, "ip-1", now + 20, LIMIT, WINDOW_MS);
    expect(checkRateLimit(store, "ip-1", now + 30, LIMIT, WINDOW_MS).allowed).toBe(false);

    const afterWindow = checkRateLimit(store, "ip-1", now + WINDOW_MS + 1, LIMIT, WINDOW_MS);
    expect(afterWindow.allowed).toBe(true);
  });

  it("isolates counters per key, so one IP being throttled never affects another", () => {
    const store = createRateLimitStore();
    const now = 1_000_000;

    checkRateLimit(store, "ip-1", now, LIMIT, WINDOW_MS);
    checkRateLimit(store, "ip-1", now, LIMIT, WINDOW_MS);
    checkRateLimit(store, "ip-1", now, LIMIT, WINDOW_MS);
    expect(checkRateLimit(store, "ip-1", now, LIMIT, WINDOW_MS).allowed).toBe(false);

    expect(checkRateLimit(store, "ip-2", now, LIMIT, WINDOW_MS).allowed).toBe(true);
  });
});
