# MediPet System

Plataforma SaaS multiempresa para la administración integral de clínicas veterinarias,
hospitales veterinarios y pet shops.

**Estado actual: Fase 8 completa** — Arquitectura base/Auth/Multitenancy (Fase 1),
CRM de Propietarios y Pacientes (Fase 2), Expediente Médico (Fase 3), Inventario
con alertas de vencimiento (Fase 4), Facturación y Cuentas por Cobrar (Fase 5):
cotizaciones, facturas con descuento de stock FEFO, notas de crédito/débito,
pagos parciales y estado de cuenta por propietario, Compras (Fase 6): proveedores,
órdenes de compra con recepción parcial/total de mercancía y actualización
automática de stock (mismos lotes y movimientos que Inventario), Reportes
(Fase 7): Ventas, Inventario, Productos por vencer, Clientes morosos, Consultas
realizadas, Rentabilidad y Veterinarios más activos, todos exportables a
PDF/Excel/CSV, Portal MediPet Admin (Fase 8): ficha de clínica con gestión de
planes, baja permanente (distinta de la suspensión reversible), facturación de
suscripción, métricas SaaS, soporte (usuarios conector) y auditoría global.
Ver el roadmap completo en [`claude.md`](./claude.md).

## Stack

Next.js (App Router) · TypeScript · PostgreSQL · Prisma (solo migraciones/esquema) ·
TailwindCSS · shadcn/ui · React Query · Zustand · Zod · Docker.

Arquitectura: Clean Architecture / DDD por módulo (`domain` → `application` → `infrastructure`),
Service Layer + Repository Pattern. **Toda operación de negocio pasa por
`API → Service → Stored Procedure`** — nunca hay lógica de negocio en queries de Prisma
Client ni acceso directo del frontend a la base de datos.

## Requisitos

- Node.js ≥ 20, [pnpm](https://pnpm.io) (`corepack enable && corepack prepare pnpm@9 --activate`
  si no lo tienes)
- Docker Desktop (para Postgres local)

## Puesta en marcha local

```bash
pnpm install
cp .env.example .env        # ajusta POSTGRES_PORT si 5432 ya está en uso en tu máquina
docker compose up -d        # Postgres en $POSTGRES_PORT + Adminer en :8080
pnpm prisma:deploy          # aplica las 5 migraciones (schema + stored procedures)
pnpm prisma:seed            # roles/permisos del sistema + Super Admin MediPet (bootstrap)
pnpm dev                    # http://localhost:3000
```

El seed imprime la contraseña del usuario `SUPERADMIN` **una sola vez** en consola —
guárdala. Úsala en `/platform-admin/login` para crear la primera clínica desde
`/platform-admin/dashboard/clientes/nuevo`; eso genera automáticamente los usuarios
`{CODIGO}_ADMIN` y `{CODIGO}_CONECTOR` de esa clínica (ver credenciales en el diálogo
que aparece una sola vez tras crearla).

## Scripts

| Script | Qué hace |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js dev / build / producción |
| `pnpm lint` · `pnpm typecheck` | ESLint · `tsc --noEmit` |
| `pnpm test` · `pnpm test:coverage` | Vitest (unitarias) |
| `pnpm test:e2e` | Playwright E2E — ver [tests/e2e](./tests/e2e) |
| `pnpm prisma:migrate` | `prisma migrate dev` (nueva migración en desarrollo) |
| `pnpm prisma:deploy` | `prisma migrate deploy` (aplica migraciones existentes) |
| `pnpm prisma:seed` | Siembra roles/permisos/Super Admin |
| `pnpm db:reset` | `prisma migrate reset --force` (⚠️ borra todo) |

## Estructura del repo

```
prisma/
  schema.prisma          # 9 modelos — SOLO esquema/migraciones, nunca queries de negocio
  migrations/             # incluye migraciones "vacías" rellenadas a mano con SPs en SQL puro
  seed.ts

src/
  middleware.ts           # Edge: guards de auth, CSRF, forzado de cambio de contraseña
  app/                    # rutas (App Router): (auth)/, dashboard/, platform-admin/, api/
  components/ui/          # primitivas estilo shadcn/ui (hechas a mano, sin CLI)
  components/{layout,dashboard,platform-admin}/
  lib/
    security/             # password.service, password-policy, csrf — password.service.ts
                          # y token.service.ts están hechos para ser Edge-safe: no importan
                          # node:crypto (usan Web Crypto) porque el middleware corre en Edge.
    auth/                 # token.service (edge-safe), refresh-token.util (Node-only),
                          # server-session, require-permission, cookies
    audit/, http/, api/, store/
  modules/
    auth/                 # domain → application → infrastructure, wired en index.ts
    platform-admin/       # ídem — CRUD de tenants
    users/, branches/     # entidades compartidas
    clients/, pets/, medical-records/, inventory/, billing/, crm/, reports/, settings/
      # stubs — cada uno con un README "Planificado para Fase N"

tests/
  e2e/                    # Playwright — ver sección de abajo
```

## Multitenancy y seguridad — decisiones clave de esta fase

- **Aislamiento de tenant**: el `tenantId` de cada request SIEMPRE se deriva del JWT
  verificado server-side (`getServerAuthContext`), nunca de body/query/params del
  cliente. Los repositorios lo reciben como parámetro explícito.
- **Dos portales, dos espacios de cookies**: `/login` (clínicas, cookies `mp_*`) y
  `/platform-admin/login` (Super Admin MediPet, cookies `mp_pa_*`), completamente
  aislados — pueden coexistir en el mismo navegador sin interferirse.
- **JWT + refresh rotation**: access token JWT de vida corta (`jose`, HS256); refresh
  token opaco, hasheado con SHA-256 antes de persistir. La reutilización de un refresh
  token ya rotado revoca toda la `family` (`sp_rotate_refresh_token`, status
  `reused_detected`) y fuerza reautenticación.
- **Contraseñas**: Argon2id con salt explícito por usuario (`src/lib/security/password.service.ts`).
- **Usuario CONECTOR** (soporte MediPet por clínica): solo se almacena su hash Argon2id,
  igual que cualquier usuario — sin cifrado reversible. Si soporte necesita acceder, un
  Super Admin rota su contraseña bajo demanda (acción auditada). Decisión tomada
  deliberadamente sobre la alternativa de cifrado reversible, para no introducir una
  clave de descifrado que sea un punto único de fallo de seguridad.
- **Auditoría atómica**: cada stored procedure que muta datos (login, tenant
  create/suspend/reactivate, cambio de contraseña, rotación/reuso de tokens) escribe su
  propia fila en `audit_logs` en la misma transacción — nunca es un paso aparte que se
  pueda omitir.

## Puntos de extensión documentados (para fases futuras)

- **MFA**: no implementado; el modelo `User` y el flujo de login están preparados para
  añadir un paso de verificación adicional sin romper la forma de `AccessTokenClaims`.
- **Row-Level Security (RLS) de Postgres**: recomendado una vez existan más tablas
  tenant-scoped (Fase 2+); hoy el aislamiento se garantiza en la capa de aplicación.
- **Política de contraseñas por tenant**: hoy es una constante de código
  (`src/lib/security/password-policy.ts`); una versión configurable por clínica en base
  de datos vive en el alcance de `modules/settings`.
- **Rate limiting**: implementado vía consultas a `audit_logs` (suficiente para el
  tráfico de Fase 1); una versión respaldada por Redis queda para Fase 10
  (optimización/escalabilidad).

## Testing

- **Unitarias (Vitest)**: `pnpm test` — servicios de auth/tenants, hashing de
  contraseñas, tokens JWT, CSRF, `requirePermission`, esquemas Zod. 53 pruebas.
- **E2E (Playwright)**: `pnpm test:e2e` — `tests/e2e/global-setup.ts` crea una base de
  datos Postgres **desechable** (`medipetsystem_e2e`, misma instancia de
  docker-compose), le aplica las migraciones, la trunca y la siembra con datos
  deterministas en cada corrida, para que la suite sea reproducible en cualquier
  máquina. Cubre los flujos de login de ambos portales, el CRUD de clientes, la
  navegación deshabilitada, y una suite de seguridad (CSRF, control de acceso roto,
  manipulación de JWT, reuso de refresh tokens, XSS almacenado, headers
  anti-clickjacking).

  > Nota de entorno: en máquinas donde la descarga del Chromium empaquetado de
  > Playwright sea lenta o falle, `playwright.config.ts` está configurado para usar el
  > Google Chrome ya instalado en el sistema (`channel: "chrome"`) en vez de depender de
  > esa descarga.

## Docker

`docker-compose.yml` levanta Postgres + Adminer para desarrollo local. `docker/Dockerfile`
es un build multi-stage para producción (no se necesita para desarrollo local).
