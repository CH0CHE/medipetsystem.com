import { test, expect } from "@playwright/test";
import { createTenant, loginAsSuperAdmin, loginAsTenant } from "./helpers";

test.describe.serial("platform-admin tenant (clientes) CRUD", () => {
  const clinicName = `Clínica E2E CRUD ${Date.now()}`;
  let adminUsername: string;
  let adminPassword: string;

  test("creating a clinic reveals credentials once and lists it in the table", async ({ page }) => {
    await loginAsSuperAdmin(page);
    const tenant = await createTenant(page, clinicName);
    adminUsername = tenant.adminUsername;
    adminPassword = tenant.adminPassword;

    await expect(page).toHaveURL(/\/clientes$/);
    await page.locator('input[placeholder*="Buscar"]').fill(clinicName);
    await expect(page.getByText(clinicName)).toBeVisible();
    await expect(page.getByText("Activa")).toBeVisible();
  });

  test("suspending the clinic flips its badge and blocks its ADMIN from logging in", async ({ page, browser }) => {
    await loginAsSuperAdmin(page);
    await page.goto("/platform-admin/dashboard/clientes");
    await page.locator('input[placeholder*="Buscar"]').fill(clinicName);
    await expect(page.getByText(clinicName)).toBeVisible();

    await page.getByRole("row", { name: new RegExp(clinicName) }).getByRole("button").click();
    await page.getByText("Suspender").click();
    await page.getByPlaceholder(/Motivo de la suspensión/).fill("Falta de pago (prueba E2E)");
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Suspendida")).toBeVisible();

    const tenantPage = await browser.newPage();
    await loginAsTenant(tenantPage, adminUsername, adminPassword);
    await expect(
      tenantPage.getByText("La cuenta de tu clínica se encuentra suspendida. Contacta a soporte."),
    ).toBeVisible();
    await tenantPage.close();
  });

  test("reactivating the clinic restores ADMIN login", async ({ page, browser }) => {
    await loginAsSuperAdmin(page);
    await page.goto("/platform-admin/dashboard/clientes");
    await page.locator('input[placeholder*="Buscar"]').fill(clinicName);
    await expect(page.getByText("Suspendida")).toBeVisible();

    await page.getByRole("row", { name: new RegExp(clinicName) }).getByRole("button").click();
    await page.getByText("Reactivar").click();
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page.getByText("Activa")).toBeVisible();

    const tenantPage = await browser.newPage();
    await loginAsTenant(tenantPage, adminUsername, adminPassword);
    await expect(tenantPage).toHaveURL(/\/change-password$/);
    await tenantPage.close();
  });
});
