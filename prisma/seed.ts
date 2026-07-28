/**
 * Seed de bootstrap: roles/permisos del sistema y el usuario Super Admin MediPet.
 * Se ejecuta una sola vez por entorno (`pnpm prisma:seed`). Usa Prisma Client
 * directamente porque es data de arranque del entorno, no una operación de negocio
 * en runtime (esas siempre pasan por stored procedures vía la capa de servicios).
 */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import argon2 from "argon2";

const prisma = new PrismaClient();

const SYSTEM_ROLES = [
  { code: "SUPER_ADMIN_MEDIPET", name: "Super Admin MediPet", description: "Acceso total a la plataforma MediPet System." },
  { code: "CONECTOR_SOPORTE", name: "Conector de Soporte", description: "Cuenta de soporte exclusiva de MediPet System por clínica." },
  { code: "ADMINISTRADOR", name: "Administrador de Clínica", description: "Administra la clínica, sucursales y usuarios." },
  { code: "VETERINARIO", name: "Veterinario", description: "Acceso clínico: pacientes, expedientes, consultas." },
  { code: "RECEPCION", name: "Recepción", description: "Agenda, propietarios y check-in de pacientes." },
  { code: "INVENTARIO", name: "Inventario", description: "Gestión de productos y movimientos de inventario." },
  { code: "CAJA", name: "Caja", description: "Facturación y cobros." },
  { code: "AUDITOR", name: "Auditor", description: "Acceso de solo lectura a reportes y auditoría." },
] as const;

const PERMISSIONS = [
  { code: "platform_admin.tenants.view", module: "platform_admin", description: "Ver el listado de clínicas (tenants)." },
  { code: "platform_admin.tenants.create", module: "platform_admin", description: "Crear nuevas clínicas (tenants)." },
  { code: "platform_admin.tenants.suspend", module: "platform_admin", description: "Suspender clínicas." },
  { code: "platform_admin.tenants.reactivate", module: "platform_admin", description: "Reactivar clínicas suspendidas." },
  { code: "platform_admin.tenants.cancel", module: "platform_admin", description: "Dar de baja clínicas de forma permanente." },
  { code: "platform_admin.plans.update", module: "platform_admin", description: "Cambiar el plan de una clínica." },
  { code: "platform_admin.metrics.view", module: "platform_admin", description: "Ver métricas SaaS agregadas." },
  { code: "platform_admin.billing.view", module: "platform_admin", description: "Ver facturas de suscripción de las clínicas." },
  { code: "platform_admin.billing.create", module: "platform_admin", description: "Generar facturas de suscripción." },
  { code: "platform_admin.billing.mark_paid", module: "platform_admin", description: "Marcar facturas de suscripción como pagadas." },
  { code: "platform_admin.audit.view", module: "platform_admin", description: "Ver la bitácora de auditoría global." },
  { code: "platform_admin.support.view", module: "platform_admin", description: "Ver cuentas de soporte (conector) de las clínicas." },
  { code: "crm.owners.view", module: "crm", description: "Ver propietarios." },
  { code: "crm.owners.create", module: "crm", description: "Crear propietarios." },
  { code: "crm.owners.update", module: "crm", description: "Editar propietarios." },
  { code: "crm.pets.view", module: "crm", description: "Ver pacientes (mascotas)." },
  { code: "crm.pets.create", module: "crm", description: "Crear pacientes (mascotas)." },
  { code: "crm.pets.update", module: "crm", description: "Editar pacientes (mascotas)." },
  { code: "clinical.records.view", module: "clinical", description: "Ver expediente médico." },
  { code: "clinical.records.create", module: "clinical", description: "Agregar entradas al expediente médico." },
  { code: "clinical.attachments.create", module: "clinical", description: "Agregar adjuntos al expediente médico." },
  { code: "inventory.products.view", module: "inventory", description: "Ver productos del inventario." },
  { code: "inventory.products.create", module: "inventory", description: "Crear productos." },
  { code: "inventory.products.update", module: "inventory", description: "Editar productos." },
  { code: "inventory.movements.create", module: "inventory", description: "Registrar movimientos de inventario." },
  { code: "billing.quotes.view", module: "billing", description: "Ver cotizaciones." },
  { code: "billing.quotes.create", module: "billing", description: "Crear cotizaciones." },
  { code: "billing.invoices.view", module: "billing", description: "Ver facturas y estado de cuenta." },
  { code: "billing.invoices.create", module: "billing", description: "Emitir facturas." },
  { code: "billing.payments.create", module: "billing", description: "Registrar pagos." },
  { code: "billing.adjustments.create", module: "billing", description: "Crear notas de crédito/débito." },
  { code: "purchases.suppliers.view", module: "purchases", description: "Ver proveedores." },
  { code: "purchases.suppliers.create", module: "purchases", description: "Crear y editar proveedores." },
  { code: "purchases.orders.view", module: "purchases", description: "Ver órdenes de compra." },
  { code: "purchases.orders.create", module: "purchases", description: "Crear órdenes de compra." },
  { code: "purchases.orders.receive", module: "purchases", description: "Registrar recepción de mercancía." },
  { code: "purchases.orders.cancel", module: "purchases", description: "Cancelar órdenes de compra." },
  { code: "reports.view", module: "reports", description: "Ver y exportar reportes gerenciales." },
  { code: "settings.password_policy.view", module: "settings", description: "Ver la política de contraseñas de la clínica." },
  { code: "settings.password_policy.update", module: "settings", description: "Cambiar la política de contraseñas de la clínica." },
] as const;

const CRM_PERMISSIONS = PERMISSIONS.filter((p) => p.module === "crm").map((p) => p.code);
const CLINICAL_PERMISSIONS = PERMISSIONS.filter((p) => p.module === "clinical").map((p) => p.code);
const INVENTORY_PERMISSIONS = PERMISSIONS.filter((p) => p.module === "inventory").map((p) => p.code);
const BILLING_PERMISSIONS = PERMISSIONS.filter((p) => p.module === "billing").map((p) => p.code);
const PURCHASES_PERMISSIONS = PERMISSIONS.filter((p) => p.module === "purchases").map((p) => p.code);
const REPORTS_PERMISSIONS = PERMISSIONS.filter((p) => p.module === "reports").map((p) => p.code);
const SETTINGS_PERMISSIONS = PERMISSIONS.filter((p) => p.module === "settings").map((p) => p.code);

const ROLE_PERMISSION_MAP: Record<string, readonly string[]> = {
  SUPER_ADMIN_MEDIPET: PERMISSIONS.map((p) => p.code),
  ADMINISTRADOR: [
    ...CRM_PERMISSIONS,
    ...CLINICAL_PERMISSIONS,
    ...INVENTORY_PERMISSIONS,
    ...BILLING_PERMISSIONS,
    ...PURCHASES_PERMISSIONS,
    ...REPORTS_PERMISSIONS,
    ...SETTINGS_PERMISSIONS,
  ],
  RECEPCION: CRM_PERMISSIONS,
  VETERINARIO: ["crm.owners.view", "crm.pets.view", "crm.pets.update", ...CLINICAL_PERMISSIONS],
  AUDITOR: [
    "crm.owners.view",
    "crm.pets.view",
    "clinical.records.view",
    "inventory.products.view",
    "billing.quotes.view",
    "billing.invoices.view",
    "purchases.suppliers.view",
    "purchases.orders.view",
    ...REPORTS_PERMISSIONS,
  ],
  INVENTARIO: [...INVENTORY_PERMISSIONS, ...PURCHASES_PERMISSIONS],
  CAJA: ["inventory.products.view", ...BILLING_PERMISSIONS],
};

async function main() {
  for (const role of SYSTEM_ROLES) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: { name: role.name, description: role.description, isSystem: true },
      create: { code: role.code, name: role.name, description: role.description, isSystem: true, tenantId: null },
    });
  }

  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: { module: permission.module, description: permission.description },
      create: permission,
    });
  }

  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
    for (const permissionCode of permissionCodes) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { code: permissionCode } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  const username = process.env.SUPERADMIN_USERNAME ?? "SUPERADMIN";
  const existing = await prisma.user.findUnique({ where: { username } });

  if (!existing) {
    const plainPassword = process.env.SUPERADMIN_BOOTSTRAP_PASSWORD || crypto.randomBytes(12).toString("base64url");
    const salt = crypto.randomBytes(16);
    const hash = await argon2.hash(plainPassword, { type: argon2.argon2id, salt, memoryCost: 19456, timeCost: 2, parallelism: 1 });

    const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { code: "SUPER_ADMIN_MEDIPET" } });

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash: hash,
        passwordSalt: salt.toString("base64"),
        isSuperAdmin: true,
        mustChangePassword: !process.env.SUPERADMIN_BOOTSTRAP_PASSWORD,
        status: "ACTIVE",
        roles: { create: { roleId: superAdminRole.id } },
      },
    });

    console.log("\n============================================================");
    console.log(" Usuario Super Admin MediPet creado");
    console.log(` Usuario:     ${user.username}`);
    console.log(` Contraseña:  ${plainPassword}`);
    console.log(" Guarda esta contraseña ahora — no se volverá a mostrar.");
    console.log("============================================================\n");
  } else {
    console.log(`El usuario ${username} ya existe, se omite su creación.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
