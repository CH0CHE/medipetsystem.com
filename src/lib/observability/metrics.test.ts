import { describe, it, expect, beforeEach } from "vitest";
import {
  incrementRequestCount,
  incrementRateLimitRejection,
  getCounters,
  resetCounters,
  renderPrometheusMetrics,
} from "./metrics";

beforeEach(() => {
  resetCounters();
});

describe("operational metrics counters", () => {
  it("start at zero", () => {
    expect(getCounters()).toEqual({ requestsTotal: 0, rateLimitRejectionsTotal: 0 });
  });

  it("incrementRequestCount increases requestsTotal only", () => {
    incrementRequestCount();
    incrementRequestCount();
    expect(getCounters()).toEqual({ requestsTotal: 2, rateLimitRejectionsTotal: 0 });
  });

  it("incrementRateLimitRejection increases rateLimitRejectionsTotal only", () => {
    incrementRateLimitRejection();
    expect(getCounters()).toEqual({ requestsTotal: 0, rateLimitRejectionsTotal: 1 });
  });
});

describe("renderPrometheusMetrics", () => {
  it("produces valid Prometheus text exposition format reflecting current counters", () => {
    incrementRequestCount();
    incrementRequestCount();
    incrementRateLimitRejection();

    const output = renderPrometheusMetrics();

    expect(output).toContain("# TYPE medipet_http_requests_total counter");
    expect(output).toContain("medipet_http_requests_total 2");
    expect(output).toContain("medipet_rate_limit_rejections_total 1");
  });
});
