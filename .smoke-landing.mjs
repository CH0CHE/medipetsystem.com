import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const SUPERADMIN_USER = "SUPERADMIN";
const SUPERADMIN_PASS = "Sm0keTest!2026Aa";

const results = [];
function check(name, cond) {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? "OK " : "FAIL"} - ${name}`);
}

const browser = await chromium.launch();
const page = await browser.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("[console.error]", msg.text());
});
page.on("pageerror", (err) => console.log("[pageerror]", err.message));

try {
  // 1. Landing page
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  check("landing has hero headline", await page.getByText("Todo tu hospital veterinario").isVisible());
  await page.waitForTimeout(500);
  const planCards = await page.locator("text=/Q\\d/").count();
  check("landing shows pricing (Q amounts found)", planCards > 0);
  await page.screenshot({ path: "landing.png", fullPage: true });

  // 2. Precios page
  await page.goto(`${BASE}/precios`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const preciosCards = await page.locator("text=Básico").count();
  check("precios page shows Básico plan", preciosCards > 0);

  // 3. FAQ page
  await page.goto(`${BASE}/faq`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const faqTriggers = await page.locator("button", { hasText: "?" }).count();
  check("faq page has at least one question", faqTriggers > 0 || (await page.locator("[data-state]").count()) > 0);

  // 4. Contacto form
  await page.goto(`${BASE}/contacto`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill("Ana Smoke Contacto");
  await page.getByLabel("Correo electrónico").fill(`smoke-contacto-${Date.now()}@example.com`);
  await page.getByLabel("Mensaje (opcional)").fill("Prueba de smoke test - contacto");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.waitForTimeout(1000);
  check("contacto form shows thank-you message", await page.getByText("¡Gracias por escribirnos!").isVisible());

  // 5. Demo form
  await page.goto(`${BASE}/demo`, { waitUntil: "networkidle" });
  await page.getByLabel("Nombre completo").fill("Carlos Smoke Demo");
  await page.getByLabel("Correo electrónico").fill(`smoke-demo-${Date.now()}@example.com`);
  await page.getByLabel("Nombre de la clínica").fill("Clínica Smoke Demo");
  await page.getByRole("button", { name: "Enviar" }).click();
  await page.waitForTimeout(1000);
  check("demo form shows thank-you message", await page.getByText("¡Gracias por escribirnos!").isVisible());

  // 6. Login as SUPERADMIN
  await page.goto(`${BASE}/platform-admin/login`, { waitUntil: "networkidle" });
  await page.locator("#pa-username").fill(SUPERADMIN_USER);
  await page.locator("#pa-password").fill(SUPERADMIN_PASS);
  await page.getByRole("button", { name: /iniciar sesión|ingresar/i }).click();
  await page.waitForURL(/platform-admin\/dashboard/, { timeout: 10000 }).catch(() => {});
  check("superadmin login redirected to dashboard", page.url().includes("/platform-admin/dashboard"));

  // 7. Leads visible in admin
  await page.goto(`${BASE}/platform-admin/dashboard/leads`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  check("leads table shows Ana Smoke Contacto", await page.getByText("Ana Smoke Contacto").isVisible());
  check("leads table shows Carlos Smoke Demo", await page.getByText("Carlos Smoke Demo").isVisible());

  // 8. Create + publish a blog post
  await page.goto(`${BASE}/platform-admin/dashboard/blog/nuevo`, { waitUntil: "networkidle" });
  const postTitle = `Post Smoke Test ${Date.now()}`;
  await page.getByLabel("Título").fill(postTitle);
  await page.getByLabel("Resumen").fill("Resumen de smoke test.");
  await page.getByLabel("Contenido").fill("Contenido de smoke test.\n\nSegundo párrafo.");
  await page.getByLabel("Autor").fill("Equipo MediPet");
  await page.locator("#status").click();
  await page.getByRole("option", { name: "Publicado" }).click();
  await page.getByRole("button", { name: "Crear post" }).click();
  await page.waitForURL(/platform-admin\/dashboard\/blog$/, { timeout: 10000 }).catch(() => {});
  check("redirected to blog admin list after create", page.url().endsWith("/platform-admin/dashboard/blog"));

  // 9. Verify it appears on public /blog
  await page.goto(`${BASE}/blog`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  check("published post visible on public /blog", await page.getByText(postTitle).isVisible());

  // 10. Unpublish it
  await page.goto(`${BASE}/platform-admin/dashboard/blog`, { waitUntil: "networkidle" });
  await page.getByText(postTitle).click();
  await page.waitForURL(/platform-admin\/dashboard\/blog\/[a-f0-9-]+$/, { timeout: 10000 });
  await page.locator("#status").click();
  await page.getByRole("option", { name: "Borrador" }).click();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await page.waitForTimeout(1000);

  // 11. Verify it disappeared from public /blog
  await page.goto(`${BASE}/blog`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  check("unpublished post no longer visible on public /blog", !(await page.getByText(postTitle).isVisible()));

  // 12. Create an FAQ
  await page.goto(`${BASE}/platform-admin/dashboard/faq`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Nueva pregunta" }).click();
  const faqQuestion = `Pregunta Smoke Test ${Date.now()}`;
  await page.getByLabel("Pregunta").fill(faqQuestion);
  await page.getByLabel("Respuesta").fill("Respuesta de smoke test.");
  await page.getByLabel("Orden").fill("99");
  await page.getByRole("button", { name: "Guardar" }).click();
  await page.waitForTimeout(1000);
  check("new FAQ visible in admin table", await page.getByText(faqQuestion).isVisible());

  // 13. Verify it appears on public /faq
  await page.goto(`${BASE}/faq`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  check("new FAQ visible on public /faq", await page.getByText(faqQuestion).isVisible());

  // --- cleanup: delete the test blog post and FAQ ---
  await page.goto(`${BASE}/platform-admin/dashboard/blog`, { waitUntil: "networkidle" });
  const postRow = page.locator("tr", { hasText: postTitle });
  await postRow.getByRole("button").last().click();
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.waitForTimeout(800);

  await page.goto(`${BASE}/platform-admin/dashboard/faq`, { waitUntil: "networkidle" });
  const faqRow = page.locator("tr", { hasText: faqQuestion });
  await faqRow.getByRole("button").last().click();
  await page.getByRole("button", { name: "Eliminar" }).click();
  await page.waitForTimeout(800);
} catch (err) {
  console.error("SCRIPT ERROR:", err);
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log("\n=== SUMMARY ===");
console.log(`${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log("FAILED:", failed.map((f) => f.name).join(", "));
  process.exit(1);
}
