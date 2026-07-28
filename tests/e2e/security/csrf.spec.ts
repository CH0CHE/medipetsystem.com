import { test, expect } from "@playwright/test";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../../../src/lib/security/csrf";
import { loginAsSuperAdmin } from "../helpers";

test("a mutating request without a matching CSRF header is rejected with 403", async ({ page }) => {
  await loginAsSuperAdmin(page);

  // Sesión y cookie CSRF válidas, pero SIN enviar el header X-CSRF-Token.
  const response = await page.request.post("/api/platform-admin/auth/logout");
  expect(response.status()).toBe(403);
});

test("a mutating request with a mismatched CSRF header is rejected with 403", async ({ page, context }) => {
  await loginAsSuperAdmin(page);

  const cookies = await context.cookies();
  const csrfCookie = cookies.find((c) => c.name === CSRF_COOKIE_NAME);
  expect(csrfCookie).toBeTruthy();

  const response = await page.request.post("/api/platform-admin/auth/logout", {
    headers: { [CSRF_HEADER_NAME]: "not-the-real-csrf-token-value" },
  });
  expect(response.status()).toBe(403);
});

test("a mutating request with the correct matching CSRF header succeeds", async ({ page, context }) => {
  await loginAsSuperAdmin(page);

  const cookies = await context.cookies();
  const csrfCookie = cookies.find((c) => c.name === CSRF_COOKIE_NAME);
  expect(csrfCookie).toBeTruthy();

  const response = await page.request.post("/api/platform-admin/auth/logout", {
    headers: { [CSRF_HEADER_NAME]: csrfCookie!.value },
  });
  expect(response.ok()).toBe(true);
});
