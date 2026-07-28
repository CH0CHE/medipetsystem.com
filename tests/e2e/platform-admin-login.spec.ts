import { test, expect } from "@playwright/test";
import { E2E_SUPERADMIN_PASSWORD, E2E_SUPERADMIN_USERNAME } from "./env";
import { createTenant, loginAsSuperAdmin } from "./helpers";

test("Super Admin logs into the platform-admin portal successfully", async ({ page }) => {
  await loginAsSuperAdmin(page);
  await expect(page.getByText("Panel MediPet Admin")).toBeVisible();
});

test("shows a generic error for invalid platform-admin credentials", async ({ page }) => {
  await page.goto("/platform-admin/login");
  await page.locator("#pa-username").fill(E2E_SUPERADMIN_USERNAME);
  await page.locator("#pa-password").fill("definitely-wrong");
  await page.getByRole("button", { name: "Acceder al portal" }).click();
  await expect(page.getByText("Usuario o contraseña incorrectos.")).toBeVisible();
});

test("a tenant clinic ADMIN cannot log into the platform-admin portal", async ({ page, browser }) => {
  const setupPage = await browser.newPage();
  await loginAsSuperAdmin(setupPage);
  const tenant = await createTenant(setupPage, `Clínica E2E Wrong Portal ${Date.now()}`);
  await setupPage.close();

  await page.goto("/platform-admin/login");
  await page.locator("#pa-username").fill(tenant.adminUsername);
  await page.locator("#pa-password").fill(tenant.adminPassword);
  await page.getByRole("button", { name: "Acceder al portal" }).click();

  await expect(page.getByText("Este usuario no tiene acceso a este portal.")).toBeVisible();
  await expect(page).toHaveURL(/\/platform-admin\/login$/);
});

test("SUPERADMIN credentials are rejected on the tenant login form", async ({ page }) => {
  await page.goto("/login");
  await page.locator("#username").fill(E2E_SUPERADMIN_USERNAME);
  await page.locator("#password").fill(E2E_SUPERADMIN_PASSWORD);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Este usuario no tiene acceso a este portal.")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
