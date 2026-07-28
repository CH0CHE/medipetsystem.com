import { test, expect } from "@playwright/test";
import { loginAsSuperAdmin } from "../helpers";

test("a tampered access token cookie is rejected and the session is treated as logged out", async ({
  page,
  context,
}) => {
  await loginAsSuperAdmin(page);

  const cookies = await context.cookies();
  const accessCookie = cookies.find((c) => c.name === "mp_pa_access_token");
  expect(accessCookie).toBeTruthy();

  const original = accessCookie!.value;
  const tampered = original.slice(0, -3) + (original.slice(-3) === "AAA" ? "BBB" : "AAA");

  await context.addCookies([{ ...accessCookie!, value: tampered }]);

  const response = await page.request.get("/api/platform-admin/auth/me");
  expect(response.status()).toBe(401);

  await page.goto("/platform-admin/dashboard");
  await expect(page).toHaveURL(/\/platform-admin\/login$/);
});

test("an access token signed with the wrong secret is rejected", async ({ page, context }) => {
  await loginAsSuperAdmin(page);

  const cookies = await context.cookies();
  const accessCookie = cookies.find((c) => c.name === "mp_pa_access_token")!;

  // Un JWT con la firma completamente corrompida (payload/segmento de firma reemplazado).
  const parts = accessCookie.value.split(".");
  const forged = `${parts[0]}.${parts[1]}.${"x".repeat(parts[2]?.length ?? 20)}`;
  await context.addCookies([{ ...accessCookie, value: forged }]);

  const response = await page.request.get("/api/platform-admin/auth/me");
  expect(response.status()).toBe(401);
});
