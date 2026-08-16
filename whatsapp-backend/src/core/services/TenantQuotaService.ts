/**
 * @file TenantQuotaService.ts
 * @description Servicio encargado de gestionar y controlar las cuotas financieras diarias por Tenant en Redis.
 */

import Redis from 'ioredis';

export interface ITenantQuotaStatus {
  tenantId: string;
  limitUsd: number;
  consumedUsd: number;
  remainingUsd: number;
  isExceeded: boolean;
  percentageUsed: number;
}

export class TenantQuotaService {
  private readonly redis: Redis;
  private static inMemoryMockMap = new Map<string, string>();

  constructor(redisClient?: Redis) {
    if (process.env.NODE_ENV === 'test') {
      // Mock simple en memoria para evitar requerir Redis corriendo localmente en entorno de pruebas
      this.redis = {
        incrbyfloat: async (key: string, value: number) => {
          const current = parseFloat(TenantQuotaService.inMemoryMockMap.get(key) || '0');
          const next = current + value;
          TenantQuotaService.inMemoryMockMap.set(key, String(next));
          return String(next);
        },
        expire: async () => 1,
        set: async (key: string, value: string) => {
          TenantQuotaService.inMemoryMockMap.set(key, value);
          return 'OK';
        },
        get: async (key: string) => {
          return TenantQuotaService.inMemoryMockMap.get(key) || null;
        }
      } as any;
    } else {
      this.redis = redisClient || require('../../infrastructure/containers/AppContainer').AppContainer.getInstance().redisClient;
    }
  }

  /**
   * Obtiene la fecha de hoy formateada como YYYY-MM-DD.
   */
  private getTodayKey(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Obtiene la clave de Redis para almacenar el consumo diario.
   */
  private getConsumedKey(tenantId: string): string {
    return `quota:tenant:${tenantId}:cost:${this.getTodayKey()}`;
  }

  /**
   * Obtiene la clave de Redis para almacenar el límite presupuestal del Tenant.
   */
  private getLimitKey(tenantId: string): string {
    return `quota:tenant:${tenantId}:limit`;
  }

  /**
   * Registra e incrementa el costo consumido por un Tenant en el día actual.
   * Establece un TTL de 24 horas sobre la clave diaria si es una nueva inserción.
   */
  public async incrementUsage(tenantId: string, costUsd: number): Promise<number> {
    if (costUsd <= 0) return 0;
    
    const key = this.getConsumedKey(tenantId);
    
    // Incrementar en Redis usando float increment
    const rawVal = await this.redis.incrbyfloat(key, costUsd);
    
    // Establecer TTL de 86400 segundos (24 horas) para auto-limpieza
    await this.redis.expire(key, 86400);
    
    return parseFloat(rawVal);
  }

  /**
   * Guarda el límite presupuestal diario asignado en USD para un Tenant.
   */
  public async setDailyLimit(tenantId: string, limitUsd: number): Promise<void> {
    const key = this.getLimitKey(tenantId);
    await this.redis.set(key, String(limitUsd));
  }

  /**
   * Obtiene el límite presupuestal diario configurado en USD.
   * Retorna 0.0 si no se ha configurado ningún límite.
   */
  public async getDailyLimit(tenantId: string): Promise<number> {
    const key = this.getLimitKey(tenantId);
    const rawVal = await this.redis.get(key);
    return rawVal ? parseFloat(rawVal) : 0.0;
  }

  /**
   * Obtiene el consumo acumulado en USD en el día actual.
   */
  public async getConsumedUsage(tenantId: string): Promise<number> {
    const key = this.getConsumedKey(tenantId);
    const rawVal = await this.redis.get(key);
    return rawVal ? parseFloat(rawVal) : 0.0;
  }

  /**
   * Consulta si la cuota asignada para el Tenant ha sido superada.
   */
  public async isQuotaExceeded(tenantId: string): Promise<boolean> {
    const limit = await this.getDailyLimit(tenantId);
    if (limit <= 0) {
      // Límite en 0 indica que la cuota de IA es libre o no tiene restricciones de bloqueo por presupuesto.
      return false;
    }

    const consumed = await this.getConsumedUsage(tenantId);
    return consumed >= limit;
  }

  /**
   * Recupera el estado completo de la cuota del Tenant.
   */
  public async getQuotaStatus(tenantId: string): Promise<ITenantQuotaStatus> {
    const limitUsd = await this.getDailyLimit(tenantId);
    const consumedUsd = await this.getConsumedUsage(tenantId);
    const remainingUsd = Math.max(0, limitUsd - consumedUsd);
    const isExceeded = limitUsd > 0 && consumedUsd >= limitUsd;
    const percentageUsed = limitUsd > 0 ? Math.min(100, Number(((consumedUsd / limitUsd) * 100).toFixed(2))) : 0.0;

    return {
      tenantId,
      limitUsd,
      consumedUsd: Number(consumedUsd.toFixed(6)),
      remainingUsd: Number(remainingUsd.toFixed(6)),
      isExceeded,
      percentageUsed
    };
  }
}
