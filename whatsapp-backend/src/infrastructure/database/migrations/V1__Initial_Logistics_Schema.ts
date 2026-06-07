import { PoolConnection } from 'mysql2/promise';
import logger from '../../logging/Logger';
import { IMigrationScript } from './MigrationRunner';

export const V1__Initial_Logistics_Schema: IMigrationScript = {
  version: 1,
  description: 'CRM, Audit logs, SICE-TAC route index base schema',

  up: async (connection: PoolConnection): Promise<void> => {
    logger.info('[Migration v1] Executing DDL initialization...');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS clients (
        phone_number VARCHAR(20) PRIMARY KEY,
        full_name VARCHAR(150) NULL,
        gender CHAR(1) DEFAULT 'N',
        document_type VARCHAR(15) NULL,
        document_number VARCHAR(45) NULL,
        email VARCHAR(150) NULL,
        rut_file_path VARCHAR(500) NULL,
        is_registered TINYINT(1) DEFAULT 0,
        is_paused TINYINT(1) DEFAULT 0,
        metadata JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await connection.query(`ALTER TABLE clients ADD INDEX IF NOT EXISTS idx_clients_email (email)`);
    } catch {
      try {
        await connection.query(`CREATE INDEX idx_clients_email ON clients (email)`);
      } catch { /* index exists */ }
    }

    await connection.query(`
      CREATE TABLE IF NOT EXISTS registros_auditoria (
        id VARCHAR(50) PRIMARY KEY,
        operator_id VARCHAR(100) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        affected_module VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        delta_diff JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS transport_routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        origin_id VARCHAR(50) NOT NULL,
        destination_id VARCHAR(50) NOT NULL,
        base_cost DECIMAL(12,2) NOT NULL,
        cost_per_ton DECIMAL(10,2) NOT NULL,
        peajes_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_route_origin_dest (origin_id, destination_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  },

  down: async (connection: PoolConnection): Promise<void> => {
    logger.warn('[Rollback v1] Reverting schema transformations...');
    await connection.query(`DROP TABLE IF EXISTS transport_routes;`);
    await connection.query(`DROP TABLE IF EXISTS registros_auditoria;`);
    await connection.query(`DROP TABLE IF EXISTS clients;`);
  }
};
