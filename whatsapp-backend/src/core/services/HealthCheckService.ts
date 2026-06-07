/**
 * @file HealthCheckService.ts
 * @description Orquestador de pruebas de conectividad y latencia de infraestructura.
 */
import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';

export interface SystemHealthReport {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  timestamp: string;
  services: {
    mariaDb: { status: 'OK' | 'X'; latencyMs: number | null };
    redis: { status: 'OK' | 'X'; latencyMs: number | null };
    metaApi: { status: 'OK' | 'X' };
  };
}

export class HealthCheckService {
  constructor(
    private readonly mysqlPool: Pool,
    private readonly redisClient: Redis
  ) {}

  /**
   * Ejecuta pings tácticos y compila el reporte de salud del ecosistema
   */
  public async generateReport(): Promise<SystemHealthReport> {
    const report: SystemHealthReport = {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      services: {
        mariaDb: { status: 'X', latencyMs: null },
        redis: { status: 'X', latencyMs: null },
        metaApi: { status: 'OK' } // Asumimos OK si las credenciales existen
      }
    };

    // 1. Evaluar Salud y Latencia de MariaDB
    try {
      const start = performance.now();
      await this.mysqlPool.query('SELECT 1');
      const end = performance.now();
      report.services.mariaDb.status = 'OK';
      report.services.mariaDb.latencyMs = Math.round(end - start);
    } catch (error) {
      report.services.mariaDb.status = 'X';
      report.status = 'CRITICAL';
    }

    // 2. Evaluar Salud y Latencia de Redis
    try {
      const start = performance.now();
      await this.redisClient.ping();
      const end = performance.now();
      report.services.redis.status = 'OK';
      report.services.redis.latencyMs = Math.round(end - start);
    } catch (error) {
      report.services.redis.status = 'X';
      // Si MariaDB sirve pero Redis cae, el sistema está DEGRADADO
      report.status = report.status === 'CRITICAL' ? 'CRITICAL' : 'DEGRADED';
    }

    // 3. Evaluar configuración de Meta
    if (!process.env.META_ACCESS_TOKEN || !process.env.META_PHONE_NUMBER_ID) {
      report.services.metaApi.status = 'X';
      report.status = 'CRITICAL';
    }

    return report;
  }
}
