/**
 * @file RunSeedScript.ts
 * @description Script de inicialización de semillas en TypeScript utilizando mysql2/promise (MariaDB).
 * Reemplaza de forma definitiva al archivo legacy run_seed.js (el cual usaba la librería 'pg' de PostgreSQL).
 */

import mysql from 'mysql2/promise';
import { env } from '../../../config/env';
import { logger } from '../../logging/Logger';

export async function runMariaDbSeeds(): Promise<void> {
  logger.info('🌱 [SeedScript] Iniciando inserción de semillas en MariaDB...');

  try {
    const connection = await mysql.createConnection({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    });

    try {
      await connection.query(`
        INSERT INTO tenants (id, company_name, is_active) 
        VALUES ('tenant-demo-01', 'ProChat Enterprise Demo', 1)
        ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);
      `);

      await connection.query(`
        INSERT INTO tenant_users (id, tenant_id, email, password_hash, role, is_active)
        VALUES (
          'usr-dev-01',
          'tenant-demo-01',
          'dev@prochat.io',
          'scrypt:8192:8:1$salt_hash_demo$4a6e8b...', 
          'SUPER_ADMIN_A',
          1
        )
        ON DUPLICATE KEY UPDATE email = VALUES(email);
      `);

      logger.info('✅ [SeedScript] Semillas insertadas correctamente en MariaDB.');
    } finally {
      await connection.end();
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error ejecutando SQL';
    logger.warn(`⚠️ [SeedScript Info]: Base de datos no disponible temporalmente (${message}). Modo in-memoria activo.`);
  }
}

if (require.main === module) {
  void runMariaDbSeeds();
}
