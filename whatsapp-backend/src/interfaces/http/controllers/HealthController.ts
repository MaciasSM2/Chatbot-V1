/**
 * @file HealthController.ts
 * @description Controlador encargado de realizar el testeo de estrés y conectividad del ecosistema.
 * Retorna de forma fidedigna la salud relacional de MariaDB, Redis y Meta API.
 */
import { Request, Response } from 'express';
import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';
import logger from '../../../infrastructure/logging/Logger';

export class HealthController {
  constructor(
    private readonly mariaDbPool: Pool,
    private readonly redisClient: Redis
  ) {}

  /**
   * GET /api/health
   * Evalúa las constantes vitales del monorepo y reporta el estado de degradación.
   */
  public checkSystemVitality = async (_req: Request, res: Response): Promise<void> => {
    let isMariaDbOk = false;
    let isRedisOk = false;
    let isMetaOk = false;

    // 1. Sondeo Atómico a MariaDB (Pool Validation)
    try {
      const [rows] = await this.mariaDbPool.query('SELECT 1 as health_token');
      if (rows && (rows as any)[0]?.health_token === 1) {
        isMariaDbOk = true;
      }
    } catch (mariaDbError) {
      logger.error('[Health Check Fail] MariaDB inaccesible:', (mariaDbError as Error).message);
    }

    // 2. Sondeo Atómico a Redis (Queue Broker Validation)
    try {
      const pingResponse = await this.redisClient.ping();
      if (pingResponse === 'PONG') {
        isRedisOk = true;
      }
    } catch (redisError) {
      logger.error('[Health Check Fail] Redis inactivo:', (redisError as Error).message);
    }

    // 3. Sondeo Atómico a Meta API (WAN Egress Gateway Validation)
    try {
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 3000);

      const metaResponse = await fetch('https://graph.facebook.com/v21.0', {
        method: 'HEAD',
        signal: abortController.signal
      });
      
      clearTimeout(timeoutId);
      if (metaResponse.status >= 200 && metaResponse.status < 500) {
        isMetaOk = true;
      }
    } catch (metaNetworkError) {
      logger.error('[Health Check Fail] Meta Cloud API fuera de alcance:', (metaNetworkError as Error).message);
    }

    const isSystemDegraded = !isMariaDbOk || !isRedisOk || !isMetaOk;
    const responseStatusCode = 200;

    res.status(responseStatusCode).json({
      success: true,
      status: isSystemDegraded ? 'DEGRADED' : 'HEALTHY',
      timestamp: new Date().toISOString(),
      infrastructure: {
        mariaDb: isMariaDbOk ? 'OK' : 'DOWN',
        redis: isRedisOk ? 'OK' : 'DOWN',
        metaApi: isMetaOk ? 'OK' : 'DOWN'
      }
    });
  };
}
