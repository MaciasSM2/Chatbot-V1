/**
 * @file V2__MultiTenant_And_Strategies_Schema.ts
 * @description Script de migración relacional DDL para soportar Multi-Tenancy.
 */

import { PoolConnection } from 'mysql2/promise';

export interface IMigrationScript {
  version: number;
  description: string;
  up: (connection: PoolConnection) => Promise<void>;
  down: (connection: PoolConnection) => Promise<void>;
}

export const V2__MultiTenant_And_Strategies_Schema: IMigrationScript = {
  version: 2,
  description: 'Creación de tablas Multi-Tenant, API Keys cifradas, documentos y RBAC de 4 perfiles',

  async up(connection: PoolConnection): Promise<void> {
    // 1. Tabla Principal de Inquilinos (Tenants)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(50) PRIMARY KEY,
        company_name VARCHAR(150) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tabla de Usuarios y Perfiles RBAC
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenant_users (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('ROLE_PRESENTACION', 'SUPER_ADMIN_A', 'SUPER_ADMIN_B', 'SUPER_ADMIN_C') NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        INDEX idx_tenant_user_lookup (tenant_id, email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tabla Cifrada de API Keys de IA por Tenant (AES-256-GCM)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenant_api_keys (
        tenant_id VARCHAR(50) PRIMARY KEY,
        provider ENUM('OPENAI', 'GEMINI', 'ANTHROPIC') NOT NULL DEFAULT 'OPENAI',
        encrypted_api_key TEXT NOT NULL,
        iv_hex VARCHAR(32) NOT NULL,
        auth_tag_hex VARCHAR(32) NOT NULL,
        selected_model VARCHAR(50) NOT NULL DEFAULT 'gpt-4o-mini',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabla de Documentos Base y Árboles de Decisión
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenant_documents (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50) NOT NULL,
        chat_type ENUM('FULL_JS', 'HYBRID', 'FULL_AI') NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_type ENUM('PDF', 'TXT', 'JSON', 'CSV', 'XLSX') NOT NULL,
        raw_content LONGTEXT NOT NULL,
        parsed_tree_json LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        INDEX idx_tenant_doc_type (tenant_id, chat_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Semilla inicial de Tenant Demostración y Usuario de Presentación
    await connection.query(`
      INSERT INTO tenants (id, company_name) 
      VALUES ('tenant-demo-01', 'Logística ProChat Demo')
      ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);
    `);
  },

  async down(connection: PoolConnection): Promise<void> {
    await connection.query(`DROP TABLE IF EXISTS tenant_documents;`);
    await connection.query(`DROP TABLE IF EXISTS tenant_api_keys;`);
    await connection.query(`DROP TABLE IF EXISTS tenant_users;`);
    await connection.query(`DROP TABLE IF EXISTS tenants;`);
  }
};
