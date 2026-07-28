// Constantes compartidas entre `playwright.config.ts` y `global-setup.ts` para
// que la suite E2E corra contra una base de datos desechable, separada de la de
// desarrollo, con credenciales deterministas.

export const E2E_PORT = 3100;
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

const PG_HOST = "localhost";
const PG_PORT = process.env.POSTGRES_PORT ?? "5433";
const PG_USER = process.env.POSTGRES_USER ?? "medipet";
const PG_PASSWORD = process.env.POSTGRES_PASSWORD ?? "medipet_dev_password";

export const E2E_DB_NAME = "medipetsystem_e2e";
export const E2E_DATABASE_URL = `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/${E2E_DB_NAME}?schema=public`;
export const E2E_MAINTENANCE_DATABASE_URL = `postgresql://${PG_USER}:${PG_PASSWORD}@${PG_HOST}:${PG_PORT}/postgres?schema=public`;

export const E2E_JWT_ACCESS_SECRET = "e2e-test-only-secret-never-use-in-prod-000000000";
export const E2E_SUPERADMIN_USERNAME = "SUPERADMIN";
export const E2E_SUPERADMIN_PASSWORD = "E2eSuperAdmin$2026";
