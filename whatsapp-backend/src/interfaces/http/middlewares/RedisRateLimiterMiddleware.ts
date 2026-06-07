/**
 * @file RedisRateLimiterMiddleware.ts
 * @description Middleware de control de tráfico distribuido basado en Redis.
 * Protege al servidor de inundaciones maliciosas aplicando el algoritmo de ventana deslizante.
 */
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import logger from '../../../infrastructure/logging/Logger';

export class RedisRateLimiterMiddleware {
  private readonly PREFIX = 'rate_limit:';

  constructor(private readonly redisClient: Redis) {}

  /**
   * Protege los endpoints del Webhook oficial de Meta y el Simulador.
   * Configura un límite estricto de peticiones por ventana temporal de forma atómica.
   */
  public limitByContext = (maxRequests: number, windowSeconds: number) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const clientIdentifier = (req.headers['x-client-phone'] as string) || req.ip || 'anonymous_source';
      const redisKey = `${this.PREFIX}${req.baseUrl}${req.path}:${clientIdentifier}`;
      
      const now = Date.now();
      const clearBeforeTimestamp = now - (windowSeconds * 1000);

      try {
        const transactionPipeline = this.redisClient.multi();
        
        transactionPipeline.zremrangebyscore(redisKey, 0, clearBeforeTimestamp);
        transactionPipeline.zadd(redisKey, now, `${now}-${Math.random()}`);
        transactionPipeline.zcard(redisKey);
        transactionPipeline.expire(redisKey, windowSeconds + 5);

        const transactionResults = await transactionPipeline.exec();
        
        if (!transactionResults || !transactionResults[2]) {
          throw new Error('Fallo en la ejecución del lote multi-comando en Redis.');
        }

        const zcardResult = transactionResults[2][1];
        const currentRequestCount = typeof zcardResult === 'number' ? zcardResult : Number(zcardResult);

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - currentRequestCount));

        if (currentRequestCount > maxRequests) {
          logger.warn(`🚨 [Rate Limiter Triggered] Bloqueado exceso de peticiones desde origen: ${clientIdentifier}`);
          
          res.status(429).json({
            success: false,
            error: 'Saturación temporal: Se ha excedido el límite permitido de peticiones. Intente más tarde.',
            retryAfterSeconds: windowSeconds
          });
          return;
        }

        return next();
      } catch (rateLimitException: any) {
        logger.error(`[Rate Limiter Fallback] Error en el clúster de control de flujo: ${rateLimitException.message}`);
        return next();
      }
    };
  };
}
