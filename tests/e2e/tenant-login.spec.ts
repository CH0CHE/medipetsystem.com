import { test, expect } from "@playwright/test";
import { createTenant, loginAsSuperAdmin, loginAsTenant } from "./helpers";

test.describe.serial("tenant login flow", () => {
  let adminUsername: string;
  let adminPassword: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await loginAsSuperAdmin(page);
    const tenant = await createTenant(page, `Clínica E2E Login ${Date.now()}`);
    adminUsername = tenant.adminUsername;
    adminPassword = tenant.adminPassword;
    await page.close();
  });

  test("shows a generic error on invalid credentials, with no server crash", async ({ page }) => {
    await loginAsTenant(page, adminUsername, "wrong-password-entirely");
    await expect(page.getByText("Usuario o contraseña incorrectos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("logs in with the temporary password and is forced to change it", async ({ page }) => {
    await loginAsTenant(page, adminUsername, adminPassword);
    await expect(page).toHaveURL(/\/change-password$/);

    await page.locator("#currentPassword").fill(adminPassword);
    const newPassword = "NuevaClave$2026!";
    await page.locator("#newPassword").fill(newPassword);
    await page.locator("#confirmPassword").fill(newPassword);
    await page.getByRole("button", { name: "Guardar y continuar" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(`Hola, ${adminUsername}`)).toBeVisible();

    adminPassword = newPassword;
  });

  test("logs out and cannot access the dashboard afterwards", async ({ page }) => {
    await loginAsTenant(page, adminUsername, adminPassword);
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole("button", { name: new RegExp(adminUsername) }).click();
    await page.getByText("Cerrar sesión").click();

    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });
});
