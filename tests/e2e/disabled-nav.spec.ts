import { test, expect } from "@playwright/test";
import { createTenant, loginAsSuperAdmin, loginAsTenant } from "./helpers";

test("tenant dashboard shows disabled 'Próximamente' nav items that are not real links", async ({ page }) => {
  await loginAsSuperAdmin(page);
  const tenant = await createTenant(page, `Clínica E2E Nav ${Date.now()}`);
  await page.close();

  const tenantPage = await page.context().newPage();
  await loginAsTenant(tenantPage, tenant.adminUsername, tenant.adminPassword);
  await tenantPage.waitForURL(/\/change-password$/);

  const disabledItem = tenantPage.getByText("Pacientes").first();
  await expect(disabledItem).toBeVisible();
  await expect(tenantPage.getByText("Próximamente").first()).toBeVisible();

  // Ningún <a href> real detrás del item deshabilitado.
  const hrefCount = await tenantPage.locator('a[href*="Pacientes"]').count();
  expect(hrefCount).toBe(0);
});

test("platform-admin sidebar shows disabled items besides the working Clientes link", async ({ page }) => {
  await loginAsSuperAdmin(page);
  await expect(page.getByText("Planes")).toBeVisible();
  await expect(page.getByText("Próximamente").first()).toBeVisible();

  await page.getByRole("link", { name: "Clientes" }).click();
  await expect(page).toHaveURL(/\/clientes$/);
});
