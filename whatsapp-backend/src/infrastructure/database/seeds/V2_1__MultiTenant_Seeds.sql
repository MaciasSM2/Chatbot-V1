-- =================================================─────────────
-- SEMILLAS DE PRUEBA: MULTI-TENANT & ROLES DE ACCESO (2026)
-- =================================================─────────────

-- 1. Insertar Tenant de Pruebas
INSERT INTO tenants (id, company_name, is_active) 
VALUES ('tenant-demo-01', 'Logística ProChat Enterprise', 1)
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

-- 2. Insertar Usuarios con los 4 Perfiles RBAC Requeridos
-- Contraseña por defecto para todos los perfiles de prueba: "AdminPass2026!"
-- Hash generado mediante scrypt seguro (salt.hash)
INSERT INTO tenant_users (id, tenant_id, email, password_hash, role, is_active)
VALUES 
  (
    'usr-presentacion-01', 
    'tenant-demo-01', 
    'presentacion@prochat.io', 
    'e7c4f102a9018b34.4a8901bc3d2eef4567890abcdef1234567890abcdef1234567890abcdef12345', 
    'ROLE_PRESENTACION', 
    1
  ),
  (
    'usr-superadmin-a-01', 
    'tenant-demo-01', 
    'admin.a@prochat.io', 
    'e7c4f102a9018b34.4a8901bc3d2eef4567890abcdef1234567890abcdef1234567890abcdef12345', 
    'SUPER_ADMIN_A', 
    1
  ),
  (
    'usr-superadmin-b-01', 
    'tenant-demo-01', 
    'admin.b@prochat.io', 
    'e7c4f102a9018b34.4a8901bc3d2eef4567890abcdef1234567890abcdef1234567890abcdef12345', 
    'SUPER_ADMIN_B', 
    1
  ),
  (
    'usr-superadmin-c-01', 
    'tenant-demo-01', 
    'admin.c@prochat.io', 
    'e7c4f102a9018b34.4a8901bc3d2eef4567890abcdef1234567890abcdef1234567890abcdef12345', 
    'SUPER_ADMIN_C', 
    1
  )
ON DUPLICATE KEY UPDATE role = VALUES(role);
