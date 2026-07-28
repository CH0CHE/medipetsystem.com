import type { Page } from "@playwright/test";
import { E2E_SUPERADMIN_PASSWORD, E2E_SUPERADMIN_USERNAME } from "./env";

export async function loginAsSuperAdmin(page: Page) {
  await page.goto("/platform-admin/login");
  await page.locator("#pa-username").fill(E2E_SUPERADMIN_USERNAME);
  await page.locator("#pa-password").fill(E2E_SUPERADMIN_PASSWORD);
  await page.getByRole("button", { name: "Acceder al portal" }).click();
  await page.waitForURL(/\/platform-admin\/dashboard/);
}

export interface CreatedTenantCredentials {
  clinicName: string;
  adminUsername: string;
  adminPassword: string;
  connectorUsername: string;
  connectorPassword: string;
}

/** Asume que ya hay una sesión de Super Admin activa en `page`. */
export async function createTenant(page: Page, clinicName: string): Promise<CreatedTenantCredentials> {
  await page.goto("/platform-admin/dashboard/clientes/nuevo");
  await page.locator("#clinicName").fill(clinicName);
  await page.locator("#branchName").fill("Central");
  await page.getByRole("button", { name: "Crear clínica" }).click();

  await page.waitForSelector("text=Cliente creado exitosamente");

  const adminUsername = await page.getByTestId("admin-username").innerText();
  const adminPassword = await page.getByTestId("admin-password").innerText();
  const connectorUsername = await page.getByTestId("connector-username").innerText();
  const connectorPassword = await page.getByTestId("connector-password").innerText();

  await page.getByRole("button", { name: "Ir al listado" }).click();
  await page.waitForURL(/\/platform-admin\/dashboard\/clientes$/);

  return { clinicName, adminUsername, adminPassword, connectorUsername, connectorPassword };
}

export async function loginAsTenant(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}
