import { test, expect } from "@playwright/test";

test("responses include anti-clickjacking and MIME-sniffing protection headers", async ({ request }) => {
  const response = await request.get("/login");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["referrer-policy"]).toBeTruthy();
});
