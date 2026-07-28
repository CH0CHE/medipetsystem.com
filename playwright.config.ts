import { defineConfig, devices } from "@playwright/test";
import {
  E2E_BASE_URL,
  E2E_DATABASE_URL,
  E2E_JWT_ACCESS_SECRET,
  E2E_PORT,
} from "./tests/e2e/env";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // los specs comparten la misma BD sembrada; evita carreras entre ellos
  workers: 1, // una sola BD/webServer compartidos — corre todo el suite en serie
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  timeout: 30_000,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: E2E_BASE_URL,
    trace: "on-first-retry",
    // Usa el Google Chrome ya instalado en el sistema en vez de descargar el
    // Chromium empaquetado de Playwright (evita depender de esa descarga).
    launchOptions: { channel: "chrome" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      PORT: String(E2E_PORT),
      DATABASE_URL: E2E_DATABASE_URL,
      JWT_ACCESS_SECRET: E2E_JWT_ACCESS_SECRET,
      JWT_ACCESS_TTL_SECONDS: "900",
      COOKIE_SECURE: "false",
      LOGIN_MAX_ATTEMPTS_PER_USERNAME: "5",
      LOGIN_LOCK_MINUTES: "15",
      LOGIN_MAX_ATTEMPTS_PER_IP: "20",
      LOGIN_IP_WINDOW_MINUTES: "15",
    },
  },
});
