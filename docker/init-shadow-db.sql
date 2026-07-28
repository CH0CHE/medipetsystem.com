-- Crea la base de datos "shadow" que Prisma usa durante `prisma migrate dev`
-- para detectar drift, sin tocar la base de datos principal.
SELECT 'CREATE DATABASE medipetsystem_shadow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'medipetsystem_shadow')
\gexec
