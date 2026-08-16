import { Pool, PoolConnection } from 'mysql2/promise';
import crypto from 'crypto';
import logger from '../../logging/Logger';

export interface IMigrationScript {
  version: number;
  description: string;
  up: (connection: PoolConnection) => Promise<void>;
  down: (connection: PoolConnection) => Promise<void>;
}

export class MigrationRunner {
  private readonly MIGRATIONS_TABLE = '_schema_migrations';

  constructor(
    private readonly mariadbPool: Pool,
    private readonly migrations: IMigrationScript[]
  ) {}

  public async runAll(): Promise<void> {
    const conn = await this.mariadbPool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(`
        CREATE TABLE IF NOT EXISTS ${this.MIGRATIONS_TABLE} (
          version INT PRIMARY KEY,
          description VARCHAR(255) NOT NULL,
          hash VARCHAR(64) NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);

      const [rows] = await conn.query<any[]>(
        `SELECT version, hash FROM ${this.MIGRATIONS_TABLE} ORDER BY version ASC`
      );
      const applied = new Map<number, string>(
        (rows as Array<{ version: number; hash: string }>).map(r => [r.version, r.hash])
      );

      for (const migration of this.migrations.sort((a, b) => a.version - b.version)) {
        if (applied.has(migration.version)) {
          logger.debug(`[Migration] v${migration.version} already applied, skipping.`);
          continue;
        }

        logger.info(`[Migration] Applying v${migration.version}: ${migration.description}`);
        await migration.up(conn);

        const hash = this.computeHash(migration);
        await conn.query(
          `INSERT INTO ${this.MIGRATIONS_TABLE} (version, description, hash) VALUES (?, ?, ?)`,
          [migration.version, migration.description, hash]
        );

        logger.info(`[Migration] v${migration.version} applied successfully.`);
      }

      await conn.commit();
      logger.info('[Migration Runner] All pending migrations applied.');
    } catch (err: any) {
      await conn.rollback();
      logger.error(`[Migration Runner] Migration failed: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  public async rollback(targetVersion: number): Promise<void> {
    const conn = await this.mariadbPool.getConnection();
    try {
      await conn.beginTransaction();

      const sorted = this.migrations.sort((a, b) => b.version - a.version);
      for (const migration of sorted) {
        if (migration.version <= targetVersion) break;
        logger.warn(`[Rollback] Reverting v${migration.version}: ${migration.description}`);
        await migration.down(conn);
        await conn.query(`DELETE FROM ${this.MIGRATIONS_TABLE} WHERE version = ?`, [migration.version]);
      }

      await conn.commit();
      logger.info(`[Rollback] Schema reverted to v${targetVersion}.`);
    } catch (err: any) {
      await conn.rollback();
      logger.error(`[Rollback] Failed: ${err.message}`);
      throw err;
    } finally {
      conn.release();
    }
  }

  private computeHash(migration: IMigrationScript): string {
    const str = `${migration.version}:${migration.description}:${migration.up.toString()}`;
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
  }
}
