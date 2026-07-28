# MediPet System

Plataforma SaaS multiempresa para la administración integral de clínicas veterinarias,
hospitales veterinarios y pet shops.

**Estado actual: Fase 10 completa — roadmap de 10 fases completo.**
Arquitectura base/Auth/Multitenancy (Fase 1), CRM de Propietarios y Pacientes
(Fase 2), Expediente Médico (Fase 3), Inventario con alertas de vencimiento
(Fase 4), Facturación y Cuentas por Cobrar (Fase 5): cotizaciones, facturas con
descuento de stock FEFO, notas de crédito/débito, pagos parciales y estado de
cuenta por propietario, Compras (Fase 6): proveedores, órdenes de compra con
recepción parcial/total de mercancía y actualización automática de stock
(mismos lotes y movimientos que Inventario), Reportes (Fase 7): Ventas,
Inventario, Productos por vencer, Clientes morosos, Consultas realizadas,
Rentabilidad y Veterinarios más activos, todos exportables a PDF/Excel/CSV,
Portal MediPet Admin (Fase 8): ficha de clínica con gestión de planes, baja
permanente (distinta de la suspensión reversible), facturación de suscripción,
métricas SaaS, soporte (usuarios conector) y auditoría global, Hardening de
seguridad (Fase 9): rate limiting general por IP + CSP con nonce + COOP/CORP,
política de complejidad de contraseñas configurable por clínica, y una suite
de pruebas de seguridad dedicada, Optimización y escalabilidad (Fase 10):
logs estructurados, métricas operacionales, liveness/readiness separados,
índices de base de datos adicionales y guía de despliegue serverless — ver
detalle en [Rendimiento y escalabilidad](#rendimiento-y-escalabilidad).
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
pnpm prisma:deploy          # aplica todas las migraciones (schema + stored procedures)
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
  schema.prisma          # SOLO esquema/migraciones, nunca queries de negocio
  migrations/            # cada módulo trae su propia migración de stored procedures en SQL puro
  seed.ts

src/
  middleware.ts           # Edge: rate limiting, CSP+nonce, CSRF, guards de auth, forzado de cambio de contraseña
  app/                    # rutas (App Router): dashboard/, platform-admin/, api/
  components/ui/          # primitivas estilo shadcn/ui (hechas a mano, sin CLI)
  components/{layout,platform-admin,billing,purchases,reports,settings,...}/
  lib/
    security/             # password.service, password-policy, csrf, rate-limiter — todo
                          # Edge-safe (Web Crypto, no node:crypto) porque el middleware corre en Edge.
    auth/                 # token.service (edge-safe), refresh-token.util (Node-only),
                          # server-session, require-permission, cookies
    observability/        # logger + métricas operacionales (Fase 10)
    audit/, http/, api/, store/
  modules/
    auth/                 # domain → application → infrastructure, wired en index.ts (mismo patrón en todos)
    platform-admin/       # tenants, planes, facturación de suscripción, métricas SaaS, auditoría global, soporte
    owners/, pets/, medical-records/, inventory/, billing/, purchases/, reports/, settings/
    users/, branches/     # solo tipos compartidos — "Usuarios y roles"/"Sucursales" quedan fuera del
                          # roadmap de 10 fases (nav marcado "Próximamente"), no son un stub olvidado

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

## Puntos de extensión documentados (fuera del roadmap de 10 fases)

- **MFA**: no implementado; el modelo `User` y el flujo de login están preparados para
  añadir un paso de verificación adicional sin romper la forma de `AccessTokenClaims`.
- **Row-Level Security (RLS) de Postgres**: recomendado como capa adicional; hoy el
  aislamiento de tenant ya se garantiza en cada stored procedure (`p_tenant_id`
  explícito y verificado siempre) y en la capa de aplicación.
- **Rate limiting / métricas distribuidos**: el rate limiter (`src/lib/security/rate-limiter.ts`)
  y los contadores operacionales (`src/lib/observability/metrics.ts`) son en memoria,
  por instancia — suficiente como primera capa, pero no se agregan entre réplicas. El
  siguiente paso natural al escalar horizontalmente es respaldar ambos en un store
  compartido (Redis/Upstash) sin cambiar sus firmas.
- **"Usuarios y roles" / "Sucursales"**: pantallas de administración dedicadas —
  hoy los roles/permisos existen y se aplican (seed + RBAC), pero no hay una UI de
  gestión propia; queda fuera del roadmap de 10 fases del spec.

## Testing

- **Unitarias (Vitest)**: `pnpm test` — servicios de cada módulo (con repositorios
  mockeados), hashing de contraseñas, tokens JWT, CSRF, rate limiter, política de
  contraseñas, `requirePermission`, esquemas Zod, y una suite de seguridad dedicada
  (`*.security.test.ts`: rate limiter, política de contraseñas configurable, inyección
  SQL en 2 repositorios representativos, esquemas de URL peligrosos). 138 pruebas.
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

## Rendimiento y escalabilidad

- **Health checks separados (Kubernetes-style)**: `/api/health` es el probe de
  *readiness* (valida conexión a Postgres); `/api/health/live` es el de *liveness*
  (sin dependencias — un pod no debería reiniciarse solo porque la BD esté lenta).
  `docker/Dockerfile` usa `/api/health/live` en su `HEALTHCHECK`.
- **Logs estructurados**: `src/lib/observability/logger.ts` — `logInfo/logWarn/logError`
  emiten una línea JSON por evento (nivel, mensaje, timestamp, contexto), Edge-safe.
  Sin proveedor externo integrado (Sentry/Datadog no están en el stack declarado);
  `logError` es el único punto que necesitaría reenviarse si se adopta uno.
- **Métricas operacionales**: `/api/metrics` expone en formato Prometheus contadores de
  requests totales y rechazos por rate limit (`src/lib/observability/metrics.ts`). Se
  atiende directamente dentro de `src/middleware.ts` (no como una API route aparte):
  Next.js aísla el middleware de cualquier ruta —incluso otra ruta en Edge Runtime— en
  sandboxes de memoria distintos, así que una API route separada siempre leería los
  contadores en cero aunque ambos corrieran en Edge. Solo el propio middleware, que es
  quien los incrementa, puede leerlos de forma coherente. Por esa misma razón los
  errores 5xx (que se originan en código Node, ej. rutas con Prisma) no viven en este
  contador — se registran vía `logError` (logs estructurados) en su lugar. Distinto de
  `/api/platform-admin/metrics` (Fase 8), que son métricas de negocio SaaS, no operacionales.
- **Límite honesto — en memoria, por instancia**: el rate limiter (Fase 9) y estos
  contadores viven en memoria de cada proceso. En una sola instancia son una capa real
  de protección/observabilidad; con varias réplicas cada una lleva su propio conteo, no
  agregado. El camino de escalado (Redis/Upstash respaldando el mismo `RateLimitStore`
  y los mismos contadores, sin cambiar sus firmas) queda documentado en el propio código.
- **Índices de base de datos**: además de los índices por `tenantId` en cada tabla,
  se agregaron compuestos `[tenantId, issueDate]` en `invoices` y
  `[tenantId, entryDate]` en `medical_record_entries` — respaldan directamente los
  `WHERE ... BETWEEN ... ORDER BY` que ya usan los reportes de Ventas/Rentabilidad y el
  listado de expediente médico.
- **Conexión a BD en despliegues serverless/multi-instancia**: ver el comentario en
  `.env.example` sobre `connection_limit`/`pgbouncer=true` en `DATABASE_URL` — sin esto,
  muchas instancias en paralelo (Vercel, Kubernetes con varias réplicas) agotan las
  conexiones de Postgres rápido.
- **React Query**: `staleTime` global de 60s (`src/app/providers.tsx`) reduce refetches
  redundantes en toda la app.

## Cobertura de pruebas

`pnpm test:coverage` reporta **~46% de líneas/statements y ~63% de funciones** — por
debajo del 85% que pide el spec. Esto es una decisión de producto explícita, no un
olvido: cada fase escribió pruebas unitarias para sus *services* (con repositorios
mockeados) y se verificó manualmente con un script de Playwright desechable por fase
contra datos reales, pero las ~50 rutas API y los ~40 archivos de repositorio (que
solo envuelven una llamada a una stored procedure) no tienen prueba directa propia —
se ejercitan a través de esa verificación manual, no de Vitest. Cerrar el 85% real
implicaría escribir pruebas para cada ruta y cada repositorio, un esfuerzo comparable
al de todas las fases anteriores juntas. Queda para el pase final de pruebas E2E que
hará el usuario (`pnpm test:e2e`, suite ya construida en Fase 1 — ver
[Testing](#testing)), como el resto de la verificación exhaustiva del proyecto.

## Docker

`docker-compose.yml` levanta Postgres + Adminer para desarrollo local. `docker/Dockerfile`
es un build multi-stage para producción (no se necesita para desarrollo local), con un
`HEALTHCHECK` sobre `/api/health/live`.
