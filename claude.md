# MediPet System (medipetsystem.com)

## Descripción General

MediPet System es una plataforma SaaS multiempresa para la administración integral de clínicas veterinarias, hospitales veterinarios, pet shops y centros de atención animal.

La plataforma centraliza:
* Login de los usuarios (las clinicas veterinarias que usaran el sistema)
* Gestión de pacientes (mascotas)
* Gestión de propietarios
* Expedientes clínicos
* Inventario
* Facturación
* Compras
* Cuentas por cobrar
* Agenda médica
* Reportes gerenciales
* Multi sucursal
* Multi usuario
* CRM
* ERP veterinario
* Portal administrativo de MediPet System (login y una vez logueado sus apartados con CRUD)

El sistema debe estar diseñado para operar como producto comercial SaaS escalable, preparado para miles de clínicas y múltiples sucursales por cliente.

---

# REGLAS OBLIGATORIAS

## Skills Obligatorias

Utilizar EXCLUSIVAMENTE las siguientes skills durante todo el desarrollo:

* Caveman
* Napkin
* Token Optimizer
* UI/UX Pro Max
* Web Design Guidelines
* AccessLint
* CSS Animation Skill
* Impeccable

## Plugins Obligatorios

Utilizar obligatoriamente:

* Superpowers
* Code Review
* Frontend Design
* Feature Dev
* UI/UX Pro Max
* Ponytail

## Restricciones

* No instalar dependencias globales.
* No modificar configuraciones globales del sistema.
* Toda configuración debe permanecer aislada dentro del repositorio.
* No afectar otros proyectos.
* No implementar quick fixes sin documentación.
* Mantener arquitectura enterprise-grade.
* Todo desarrollo debe ser modular.
* Todo módulo debe ser desacoplado.
* Toda funcionalidad deberá estar preparada para futuras integraciones.

---

# REQUISITOS DE ARQUITECTURA

## Stack Principal

* Next.js (App Router)
* TypeScript
* PostgreSQL
* Prisma ORM (solo para migraciones y modelos)
* Procedimientos almacenados (Stored Procedures) para operaciones de negocio
* TailwindCSS
* Shadcn/UI
* React Query
* Zod
* Zustand
* Docker

## Arquitectura

Arquitectura basada en:

* Clean Architecture
* Domain Driven Design (DDD)
* SOLID
* CQRS (donde aplique)
* Repository Pattern
* Service Layer Pattern
* Event Driven Notifications

Estructura sugerida:

/src
/modules
/auth
/clients
/pets
/medical-records
/inventory
/billing
/crm
/reports
/users
/branches
/settings
/platform-admin

---

# SEGURIDAD OBLIGATORIA

## Principios

La seguridad es prioridad crítica.

No se permiten accesos directos desde frontend hacia la base de datos.

Toda operación de negocio debe pasar por:

API → Service Layer → Stored Procedure

Nunca:

Frontend → SQL

---

## Prevención de Vulnerabilidades

Implementar pruebas automáticas y revisiones para detectar:

### OWASP Top 10

* SQL Injection
* XSS
* CSRF
* SSRF
* Broken Authentication
* Broken Access Control
* Security Misconfiguration
* Sensitive Data Exposure
* Path Traversal
* Command Injection

### Adicionales

* Rate Limiting
* Brute Force Protection
* Session Hijacking Protection
* Password Spraying Protection
* Clickjacking Protection
* API Abuse Protection

---

## Autenticación

Implementar:

* JWT seguro
* Refresh Tokens
* Rotación de Tokens
* MFA preparado para futuras versiones
* Gestión de sesiones activas
* Cierre remoto de sesiones

---

## Contraseñas

Obligatorio:

* Argon2id
* Salt único por usuario
* Política de complejidad configurable

Nunca almacenar:

* Contraseñas en texto plano
* Tokens en texto plano

---

## Auditoría

Registrar:

* Inicio de sesión
* Cierre de sesión
* Cambios de inventario
* Facturación
* Modificación de expedientes
* Eliminaciones
* Accesos administrativos

Toda acción crítica debe quedar auditada.

---

# MULTITENANCY (SAAS)

## Cliente

Cada clínica es un Tenant.

Ejemplo:

Tenant:

* Clínica Veterinaria ABC

Sucursales:

* Central
* Zona 10
* Antigua

Usuarios:

* Administrador
* Recepción
* Veterinario
* Inventario

---

## Aislamiento de Datos

Un tenant nunca debe visualizar datos de otro tenant.

Implementar:

* Tenant ID obligatorio
* Filtros automáticos
* Validaciones de aislamiento

---

# ESTRUCTURA DE CUENTAS

## Creación Automática

Al crear una clínica:

Generar:

### Usuario Administrador

Usuario:

TENANTID_ADMIN

Ejemplo:

0000001_ADMIN

Contraseña temporal generada automáticamente.

---

### Usuario Conector

Usuario:

TENANTID_CONECTOR

Ejemplo:

0000001_CONECTOR

Este usuario será utilizado exclusivamente por MediPet System para soporte.

Debe poseer:

* Acceso controlado
* Auditoría completa
* Restricciones especiales
* Registro de actividad

La contraseña deberá almacenarse cifrada.

---

# MÓDULOS DEL SISTEMA

## 1. Portal Público

Funciones:

* Landing page
* Planes
* Contacto
* Blog
* FAQ
* Solicitud de demo
* Captación de leads

---

## 2. Administración MediPet

Uso exclusivo del equipo MediPet.

Funciones:

* Alta de clientes
* Baja de clientes
* Suspensión
* Gestión de planes
* Métricas SaaS
* Facturación de clientes
* Soporte
* Auditoría global

---

## 3. Administración de Cliente

Uso exclusivo de cada clínica.

---

# CRM

## Propietarios

Información:

* Nombre
* DPI/NIT
* Teléfono
* Correo
* Dirección
* Estado financiero
* Notas

Estados:

* Solvente
* Moroso
* Suspendido

---

# PACIENTES (MASCOTAS)

Información:

* Nombre
* Especie
* Raza
* Sexo
* Fecha de nacimiento
* Peso
* Color
* Fotografía
* Microchip
* Estado

Estados:

* Activo
* En observación
* Hospitalizado
* Recuperado
* Fallecido

---

# EXPEDIENTE MÉDICO

Historial:

* Consultas
* Diagnósticos
* Síntomas
* Tratamientos
* Vacunas
* Cirugías
* Hospitalizaciones
* Medicamentos

Adjuntos:

* PDF
* Imágenes
* Laboratorios

---

# INVENTARIO

Productos:

* SKU
* Código interno
* Nombre
* Categoría
* Lote
* Vencimiento
* Existencia
* Existencia mínima
* Costo
* Precio

Movimientos:

* Entrada
* Salida
* Ajuste
* Transferencia

---

# ALERTAS DE VENCIMIENTO

Generar alertas automáticas:

* 90 días
* 60 días
* 30 días
* 15 días
* 7 días

Notificar:

* Dashboard
* Correo
* Notificaciones internas

---

# FACTURACIÓN

Funciones:

* Cotizaciones
* Facturas
* Notas de crédito
* Notas de débito

Al facturar:

* Descontar stock automáticamente
* Registrar movimiento de inventario
* Actualizar cuentas por cobrar

---

# CUENTAS POR COBRAR

Funciones:

* Estado de cuenta
* Pagos parciales
* Créditos
* Recordatorios

---

# COMPRAS

Funciones:

* Órdenes de compra
* Recepción de productos
* Actualización automática de stock

---

# AGENDA

Funciones:

* Calendario
* Citas
* Recordatorios
* Confirmaciones

---

# REPORTES

Reportes:

* Ventas
* Inventario
* Productos por vencer
* Clientes morosos
* Consultas realizadas
* Rentabilidad
* Veterinarios más activos

Exportación:

* PDF
* Excel
* CSV

---

# ROLES Y PERMISOS

RBAC obligatorio.

Roles iniciales:

* Super Admin MediPet
* Administrador Clínica
* Veterinario
* Recepción
* Inventario
* Caja
* Auditor

Permisos totalmente configurables.

---

# TESTING OBLIGATORIO

Cobertura mínima:

85%

Pruebas:

## Unitarias

* Vitest

## Integración

* API
* Servicios
* SPs

## E2E

* Playwright

## Seguridad

Ejecutar pruebas contra:

* SQL Injection
* XSS
* CSRF
* Escalada de privilegios
* Broken Access Control

---

# OBSERVABILIDAD

Implementar:

* Logs estructurados
* Error Tracking
* Auditoría
* Health Checks
* Métricas

---

# DEVOPS

Debe poder desplegarse en:

* Vercel
* AWS
* Azure
* GCP
* Docker
* Kubernetes

---

# ROADMAP DE DESARROLLO

Fase 1

* Arquitectura base
* Autenticación
* Multitenancy

Fase 2

* CRM
* Pacientes
* Propietarios

Fase 3

* Expediente clínico

Fase 4

* Inventario

Fase 5

* Facturación

Fase 6

* Compras

Fase 7

* Reportes

Fase 8

* Portal MediPet Admin

Fase 9

* Hardening de seguridad

Fase 10

* Optimización y escalabilidad

---

# CRITERIOS DE ACEPTACIÓN

No se considerará una funcionalidad terminada si:

* No tiene pruebas.
* No tiene validaciones.
* No tiene auditoría.
* No tiene control de permisos.
* No tiene documentación.
* No contempla multitenancy.
* No utiliza Stored Procedures para operaciones de negocio.
* No supera validaciones de seguridad.

---

Carpeta con los logos y demás apartados visuales que puedes utilizar en el proyecto: C:\Users\Josue\Downloads\medipet_logo_original_oficial

Paleta de colores:
Basándome en el logo que generamos (azul marino + turquesa) y en el objetivo de posicionar **MediPet System** como una marca SaaS profesional para clínicas veterinarias, te recomiendo definir dos paletas: una para la **marca** y otra para la **interfaz web**.

# Paleta principal de marca (Branding)

### Color Primario

**Azul Corporativo**

* HEX: `#123A6D`
* RGB: `18, 58, 109`

Representa:

* Confianza
* Seguridad
* Profesionalismo
* Tecnología

### Color Secundario

**Turquesa MediPet**

* HEX: `#26C6B8`
* RGB: `38, 198, 184`

Representa:

* Salud
* Innovación
* Modernidad
* Bienestar animal

### Color de Apoyo

**Azul Acero**

* HEX: `#4F6F95`
* RGB: `79, 111, 149`

Para:

* Elementos secundarios
* Subtítulos
* Íconos

### Gris Neutro

* HEX: `#6B7280`

Para:

* Textos secundarios
* Etiquetas

### Blanco

* HEX: `#FFFFFF`

Para:

* Fondos
* Espacios negativos

---

# Paleta recomendada para la página web

### Fondo Principal

* HEX: `#F8FAFC`

Un blanco ligeramente azulado que da sensación de limpieza médica.

### Fondo Secundario

* HEX: `#EEF4F8`

Para:

* Cards
* Secciones alternas
* Dashboards

### Texto Principal

* HEX: `#1E293B`

Excelente legibilidad.

### Texto Secundario

* HEX: `#64748B`

---

# Botones

### Botón Principal

* Fondo: `#123A6D`
* Texto: `#FFFFFF`

### Hover

* Fondo: `#0F2F58`

---

### Botón Secundario

* Fondo: `#26C6B8`
* Texto: `#FFFFFF`

### Hover

* Fondo: `#1FB0A4`

---

# Estados del sistema (CRM / ERP)

### Éxito

* HEX: `#22C55E`

### Advertencia

* HEX: `#F59E0B`

### Error

* HEX: `#EF4444`

### Información

* HEX: `#3B82F6`

---

# Paleta Premium Alternativa

Si quieres que la marca se vea más "enterprise" y pueda competir visualmente con software como Salesforce, HubSpot o Zoho:

### Azul Oscuro

`#0B1F3A`

### Turquesa Premium

`#14B8A6`

### Azul Claro

`#3B82F6`

### Gris Claro

`#E5E7EB`

### Gris Oscuro

`#374151`

### Blanco

`#FFFFFF`

---

# Mi recomendación final para MediPet System

Usaría esta combinación como identidad oficial:

* Primario: `#123A6D`
* Secundario: `#26C6B8`
* Fondo: `#F8FAFC`
* Texto: `#1E293B`
* Éxito: `#22C55E`
* Advertencia: `#F59E0B`
* Error: `#EF4444`

Es una combinación que funciona muy bien para:

* CRM
* ERP
* Inventarios
* Facturación
* Portal web
* Aplicación móvil
* Redes sociales
* Material impreso
* Clínicas veterinarias

y mantiene una identidad visual moderna, tecnológica y fácil de reconocer como marca.


