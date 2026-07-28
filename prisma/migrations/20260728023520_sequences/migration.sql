-- Secuencia para generar el código de tenant de 7 dígitos ({0000001}_ADMIN, {0000001}_CONECTOR, ...)
CREATE SEQUENCE IF NOT EXISTS tenant_code_seq START WITH 1 INCREMENT BY 1;
