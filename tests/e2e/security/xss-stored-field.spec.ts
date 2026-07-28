import { test, expect } from "@playwright/test";
import { createTenant, loginAsSuperAdmin } from "../helpers";

test("a script tag in the clinic name is stored and rendered escaped, never executed", async ({ page }) => {
  let dialogFired = false;
  page.on("dialog", async (dialog) => {
    dialogFired = true;
    await dialog.dismiss();
  });

  await loginAsSuperAdmin(page);
  const clinicName = `<script>window.__xss=1</script> Clínica ${Date.now()}`;
  await createTenant(page, clinicName);

  await page.locator('input[placeholder*="Buscar"]').fill("Clínica");
  await expect(page.getByText(clinicName, { exact: false })).toBeVisible();

  const executed = await page.evaluate(() => (window as unknown as { __xss?: number }).__xss);
  expect(executed).toBeUndefined();
  expect(dialogFired).toBe(false);

  const scriptHandles = await page.locator("script").evaluateAll((nodes) =>
    nodes.map((n) => n.textContent).filter((t) => t?.includes("__xss")),
  );
  expect(scriptHandles.length).toBe(0);
});
