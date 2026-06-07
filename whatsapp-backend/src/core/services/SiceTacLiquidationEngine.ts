/**
 * @file SiceTacLiquidationEngine.ts
 * @description Implementación del motor logístico utilizando el principio de inyección de dependencias (SOLID - D).
 * Optimiza el rendimiento mediante estrategias de caché multinivel para mitigar el IOPS de MariaDB.
 */
import { ILiquidationEngine } from '../interfaces/services/ILiquidationEngine';
import { TransportRoute } from '../domain/entities/TransportRoute';
import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';
import logger from '../../infrastructure/logging/Logger';

export class SiceTacLiquidationEngine implements ILiquidationEngine {
  // Capa 1: Caché en memoria local de la instancia para evitar llamadas de red a Redis
  private localLruCache: Map<string, { data: TransportRoute; expiresAt: number }> = new Map();
  private readonly LOCAL_TTL = 300000; // 5 Minutos en milisegundos

  constructor(
    private readonly mariadbPool: Pool,
    private readonly redisClient: Redis
  ) {}

  /**
   * Ejecuta la liquidación determinista del flete aplicando el pipeline de caché indexado.
   */
  public async calculateFreight(
    origin: string,
    destination: string,
    weightTons: number,
    vehicleType: 'TURBO' | 'SENCILLO' | 'MINI_VANS'
  ): Promise<number> {
    const cacheKey = `route:${origin.toUpperCase()}:${destination.toUpperCase()}`;
    
    // 1. EVALUAR CAPA 1: Memoria local inline (Fricción Cero)
    const localHit = this.localLruCache.get(cacheKey);
    if (localHit && localHit.expiresAt > Date.now()) {
      return this.executeBusinessRules(localHit.data, weightTons, vehicleType);
    }

    // 2. EVALUAR CAPA 2: Caché distribuida en Redis
    try {
      if (this.redisClient) {
        const redisHit = await this.redisClient.get(cacheKey);
        if (redisHit) {
          const routeData: TransportRoute = JSON.parse(redisHit);
          // Hidratar la Capa 1 de forma oportunista
          this.hydrateLocalCache(cacheKey, routeData);
          return this.executeBusinessRules(routeData, weightTons, vehicleType);
        }
      }
    } catch (redisError: any) {
      logger.warn(`[Liquidation Cache L2 Fallback] Redis no respondió: ${redisError.message}`);
    }

    // 3. CAPA DE PERSISTENCIA FISICA: Consulta atómica a MariaDB
    logger.info(`💾 [SICE-TAC Engine] Miss de caché total. Consultando matriz en MariaDB para: ${cacheKey}`);
    const routeData = await this.fetchRouteFromDatabase(origin, destination);

    if (!routeData) {
      throw new Error(`Ruta logística no homologada en el sistema de transporte: ${origin} - ${destination}`);
    }

    // 4. SINCRONIZAR CAPAS DE CACHÉ ASÍNCRONAMENTE (Fire and Forget)
    this.hydrateLocalCache(cacheKey, routeData);
    if (this.redisClient) {
      this.redisClient.set(cacheKey, JSON.stringify(routeData), 'EX', 1800).catch(err => {
        logger.error(`[Redis Write Error] Falló la indexación de la ruta: ${err.message}`);
      });
    }

    return this.executeBusinessRules(routeData, weightTons, vehicleType);
  }

  /**
   * Recupera la fila física desde la matriz relacional de la base de datos.
   */
  private async fetchRouteFromDatabase(origin: string, destination: string): Promise<TransportRoute | null> {
    const [rows] = await this.mariadbPool.query<any[]>(
      `SELECT origin_id, destination_id, base_cost, cost_per_ton, peajes_count 
       FROM sicetac_routes_matrix 
       WHERE UPPER(origin_id) = ? AND UPPER(destination_id) = ?`,
      [origin.toUpperCase(), destination.toUpperCase()]
    );

    if (rows.length === 0) return null;
    const row = rows[0]!;

    return {
      originId: row.origin_id,
      destinationId: row.destination_id,
      baseCost: Number(row.base_cost),
      costPerTon: Number(row.cost_per_ton),
      peajesCount: Number(row.peajes_count)
    };
  }

  /**
   * Ejecuta el modelo matemático regulado SICE-TAC basado en las variables de la ruta.
   */
  private executeBusinessRules(route: TransportRoute, weight: number, type: string): number {
    let typeMultiplier = 1.0;
    
    // Regla de Negocio: Modificadores estructurales según tipología de ejes del camión
    switch (type) {
      case 'TURBO': typeMultiplier = 1.15; break;     // Requiere mayor revoluciones en montaña (Rionegro - Las Palmas)
      case 'SENCILLO': typeMultiplier = 1.30; break;  // Configuración C2 de alta capacidad
      case 'MINI_VANS': typeMultiplier = 0.90; break; // Distribución urbana ligera de última milla
    }

    const costCalculation = (route.baseCost + (route.costPerTon * weight)) * typeMultiplier;
    const peajesTax = route.peajesCount * 14500; // Costo promedio de peajes categoría camión (Año 2026)

    return Math.round(costCalculation + peajesTax);
  }

  private hydrateLocalCache(key: string, data: TransportRoute): void {
    this.localLruCache.set(key, {
      data,
      expiresAt: Date.now() + this.LOCAL_TTL
    });
  }
}
