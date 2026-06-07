import { Pool, RowDataPacket } from 'mysql2/promise';
import Redis from 'ioredis';
import logger from '../logging/Logger';

export class CacheWarmUpService {
  private readonly REDIS_ROUTE_PREFIX = 'route:';
  private readonly CACHE_TTL_SECONDS = 86400;

  constructor(
    private readonly mariadbPool: Pool,
    private readonly redisClient: Redis
  ) {}

  public async executeWarmUpPipeline(): Promise<void> {
    logger.info('[Cache Warm-Up] Starting strategic RAM pre-heating...');

    try {
      const [frequentRoutes] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT origin_id, destination_id, base_cost, cost_per_ton, peajes_count
         FROM transport_routes
         ORDER BY base_cost DESC LIMIT 50`
      );

      if (frequentRoutes.length === 0) {
        logger.warn('[Cache Warm-Up Skip] No routes found in relational matrix to preload.');
        return;
      }

      const redisPipeline = this.redisClient.multi();

      for (const route of frequentRoutes) {
        const cacheKey = `${this.REDIS_ROUTE_PREFIX}${route.origin_id}:${route.destination_id}`;
        const routePayload = JSON.stringify({
          originId: route.origin_id,
          destinationId: route.destination_id,
          baseCost: parseFloat(route.base_cost),
          costPerTon: parseFloat(route.cost_per_ton),
          peajesCount: parseInt(route.peajes_count, 10)
        });

        redisPipeline.set(cacheKey, routePayload, 'EX', this.CACHE_TTL_SECONDS);
      }

      await redisPipeline.exec();

      logger.info(`[Cache Warm-Up Success] Hydrated ${frequentRoutes.length} critical SICE-TAC routes into Redis.`);
    } catch (warmUpError: any) {
      logger.error(`[Warm-Up Error] Preload pipeline failed: ${warmUpError.message}`);
    }
  }
}
