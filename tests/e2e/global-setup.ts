import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import {
  E2E_DATABASE_URL,
  E2E_DB_NAME,
  E2E_MAINTENANCE_DATABASE_URL,
  E2E_SUPERADMIN_PASSWORD,
} from "./env";

/**
 * Prepara una base de datos Postgres desechable y aislada de la de desarrollo
 * (misma instancia de docker-compose, base de datos distinta), le aplica las
 * migraciones y la siembra con un Super Admin de contraseña determinista, para
 * que la suite E2E sea reproducible en cualquier máquina con `docker compose up`.
 */
export default async function globalSetup() {
  const admin = new PrismaClient({ datasources: { db: { url: E2E_MAINTENANCE_DATABASE_URL } } });

  const exists = await admin.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = '${E2E_DB_NAME}') as exists`,
  );

  if (!exists[0]?.exists) {
    await admin.$executeRawUnsafe(`CREATE DATABASE ${E2E_DB_NAME}`);
  }
  await admin.$disconnect();

  const env = { ...process.env, DATABASE_URL: E2E_DATABASE_URL };

  execSync("pnpm exec prisma migrate deploy", { env, stdio: "inherit" });

  // Deja la base de datos en un estado limpio y determinista en cada corrida
  // (en vez de acumular tenants/usuarios de corridas anteriores).
  const db = new PrismaClient({ datasources: { db: { url: E2E_DATABASE_URL } } });
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE audit_logs, refresh_tokens, user_roles, role_permissions, users, branches, tenants, permissions, roles RESTART IDENTITY CASCADE`,
  );
  await db.$disconnect();

  execSync("pnpm exec tsx prisma/seed.ts", {
    env: { ...env, SUPERADMIN_BOOTSTRAP_PASSWORD: E2E_SUPERADMIN_PASSWORD },
    stdio: "inherit",
  });
}
