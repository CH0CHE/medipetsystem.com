import { test, expect } from "@playwright/test";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "../../../src/lib/security/csrf";
import { loginAsSuperAdmin } from "../helpers";

test("reusing a rotated-away refresh token is detected and revokes the whole session family", async ({
  page,
  context,
}) => {
  await loginAsSuperAdmin(page);

  const csrfToken = (await context.cookies()).find((c) => c.name === CSRF_COOKIE_NAME)!.value;
  const csrfHeaders = { [CSRF_HEADER_NAME]: csrfToken };

  const oldRefreshCookie = (await context.cookies()).find((c) => c.name === "mp_pa_refresh_token")!;

  // 1. Rotación legítima: el token viejo se revoca, se emite uno nuevo.
  const firstRefresh = await page.request.post("/api/platform-admin/auth/refresh", { headers: csrfHeaders });
  expect(firstRefresh.ok()).toBe(true);

  // 2. Reproducir (replay) el refresh token YA ROTADO — simula un token robado.
  await context.addCookies([oldRefreshCookie]);
  const replay = await page.request.post("/api/platform-admin/auth/refresh", { headers: csrfHeaders });
  expect(replay.status()).toBe(401);

  // 3. La detección de reuso debe haber revocado TODA la family — incluso el
  // token recién emitido en el paso 1 deja de servir.
  const newRefreshCookie = firstRefresh
    .headersArray()
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .map((h) => h.value)
    .find((v) => v.startsWith("mp_pa_refresh_token="));
  expect(newRefreshCookie).toBeTruthy();
  const newTokenValue = newRefreshCookie!.split(";")[0]!.split("=")[1]!;

  await context.addCookies([{ ...oldRefreshCookie, value: newTokenValue }]);
  const afterReuse = await page.request.post("/api/platform-admin/auth/refresh", { headers: csrfHeaders });
  expect(afterReuse.status()).toBe(401);
});
