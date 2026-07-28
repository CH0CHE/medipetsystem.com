import { test, expect } from "@playwright/test";
import { createTenant, loginAsSuperAdmin, loginAsTenant } from "../helpers";

/**
 * Nota de diseño: MediPet usa espacios de cookies separados por portal
 * (`mp_access_token` para clínicas, `mp_pa_access_token` para el portal
 * MediPet Admin). Esto significa que una sesión de clínica no puede
 * "colarse" en absoluto hacia rutas de platform-admin a nivel de transporte
 * — el resultado es 401 (sin sesión de ese namespace) en vez de un 403 de
 * permisos insuficientes. El camino "usuario autenticado sin el permiso
 * exacto" (403 + auditoría) ya está cubierto a nivel unitario en
 * `src/lib/auth/require-permission.test.ts`; aquí verificamos el aislamiento
 * real entre portales de punta a punta.
 */

test("an anonymous request to a platform-admin API route is rejected", async ({ request }) => {
  const response = await request.get("/api/platform-admin/tenants");
  expect(response.status()).toBe(401);
});

test("a tenant clinic ADMIN session cannot access platform-admin API routes", async ({ page, browser }) => {
  const setupPage = await browser.newPage();
  await loginAsSuperAdmin(setupPage);
  const tenant = await createTenant(setupPage, `Clínica E2E BAC ${Date.now()}`);
  await setupPage.close();

  await loginAsTenant(page, tenant.adminUsername, tenant.adminPassword);
  await page.waitForURL(/\/change-password$/);

  // La cookie de sesión de tenant (mp_access_token) no existe en el namespace
  // que las rutas de platform-admin leen (mp_pa_access_token) — deben rechazar.
  const response = await page.request.get("/api/platform-admin/tenants");
  expect(response.status()).toBe(401);

  await page.goto("/platform-admin/dashboard");
  await expect(page).toHaveURL(/\/platform-admin\/login$/);
});

test("a platform-admin session cannot access the tenant dashboard/API", async ({ page }) => {
  await loginAsSuperAdmin(page);

  const response = await page.request.get("/api/auth/me");
  expect(response.status()).toBe(401);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});
