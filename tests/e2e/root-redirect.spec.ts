import { test, expect } from "@playwright/test";

test("root path redirects unauthenticated visitors to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Bienvenido de nuevo" })).toBeVisible();
});

test("/dashboard redirects unauthenticated visitors to /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("/platform-admin/dashboard redirects unauthenticated visitors to /platform-admin/login", async ({ page }) => {
  await page.goto("/platform-admin/dashboard");
  await expect(page).toHaveURL(/\/platform-admin\/login$/);
});
