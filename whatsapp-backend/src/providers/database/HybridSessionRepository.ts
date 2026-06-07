/**
 * @file HybridSessionRepository.ts
 * @description Repositorio híbrido de control de estados conversacionales.
 * Combina la velocidad de Redis con la durabilidad transaccional de MariaDB.
 */
import { Pool, RowDataPacket } from 'mysql2/promise';
import Redis from 'ioredis';
import { ChatSession } from '../../core/entities/ChatSession';
import { ISessionRepository } from '../../core/interfaces/repositories/ISessionRepository';
import logger from '../../infrastructure/logging/Logger';

export class HybridSessionRepository implements ISessionRepository {
  private readonly REDIS_PREFIX = 'session:';
  private readonly CACHE_TTL_SECONDS = 86400; // Turno operativo de 24 horas
  private static readonly inMemorySessions = new Map<string, ChatSession>();

  constructor(
    private readonly redisClient: Redis,
    private readonly mariadbPool: Pool
  ) {}

  /**
   * Consolida el estado de la máquina de estados de forma atómica en ambas capas físicas.
   */
  public async save(session: ChatSession): Promise<void> {
    const redisKey = `${this.REDIS_PREFIX}${session.userId}`;
    const metadata = { 
      isPaused: session.isPaused,
      messageHistory: session.history,
      ...session.metadata
    };
    const serializedPayload = JSON.stringify({ 
      currentStep: session.currentStep, 
      updatedAt: session.updatedAt,
      isPaused: session.isPaused,
      metadata: session.metadata,
      messageHistory: session.history
    });

    try {
      // 1. Escritura sincrónica inmediata en la caché efímera de Redis
      await this.redisClient.setex(redisKey, this.CACHE_TTL_SECONDS, serializedPayload);

      // 2. Escritura sincrónica de respaldo en la tabla de contingencia de MariaDB (Upsert)
      await this.mariadbPool.query(
        `INSERT INTO sesiones_chat (usuario_id, paso_actual, actualizado_en, metadatos)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
          paso_actual = VALUES(paso_actual), 
          actualizado_en = VALUES(actualizado_en), 
          metadatos = VALUES(metadatos)`,
        [
          session.userId,
          session.currentStep,
          session.updatedAt,
          JSON.stringify(metadata)
        ]
      );

    } catch (saveException: any) {
      logger.error(`🚨 [Hybrid Session Failure] Error guardando estado de sesión para ${session.userId}: ${saveException.message}`);
    }
    // Mantener también en caché de memoria local
    HybridSessionRepository.inMemorySessions.set(session.userId, session);
  }

  /**
   * Recupera el estado de la FSM aplicando el pipeline de re-hidratación transparente si Redis sufre un Miss.
   */
  public async findByUserId(userId: string): Promise<ChatSession | null> {
    const redisKey = `${this.REDIS_PREFIX}${userId}`;

    try {
      // CAPA 1: Intento de lectura de alta velocidad en Redis
      const cachedData = await this.redisClient.get(redisKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        const session = new ChatSession({ 
          userId, 
          currentStep: parsed.currentStep, 
          updatedAt: new Date(parsed.updatedAt),
          isPaused: parsed.isPaused || false,
          metadata: parsed.metadata || {},
          messageHistory: parsed.messageHistory || []
        });
        HybridSessionRepository.inMemorySessions.set(userId, session);
        return session;
      }

      // CAPA 2: Re-hidratación (Mecanismo Cache-Aside ante fallos o vaciados de memoria)
      logger.warn(`⚠️ [Hybrid Session Miss] Miss en Redis para la sesión ${userId}. Consultando MariaDB...`);
      
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT paso_actual as current_step, actualizado_en as updated_at, metadatos as metadata FROM sesiones_chat WHERE usuario_id = ? LIMIT 1`,
        [userId]
      );

      if (rows.length === 0) {
        return HybridSessionRepository.inMemorySessions.get(userId) || null;
      }

      const row = rows[0]!;
      let parsedMetadata: any = {};
      if (row.metadata) {
        parsedMetadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
      }
      
      const session = new ChatSession({
        userId,
        currentStep: row.current_step,
        updatedAt: row.updated_at,
        isPaused: !!parsedMetadata.isPaused,
        messageHistory: parsedMetadata.messageHistory || [],
        metadata: parsedMetadata
      });

      // Sincronizar asíncronamente la memoria de Redis
      const serialized = JSON.stringify({ 
        currentStep: session.currentStep, 
        updatedAt: session.updatedAt,
        isPaused: session.isPaused,
        metadata: session.metadata,
        messageHistory: session.history
      });
      this.redisClient.setex(redisKey, this.CACHE_TTL_SECONDS, serialized).catch(err => {
        logger.error(`[Redis Auto-Hydrate Error] No se pudo escribir la llave recuperada: ${err.message}`);
      });

      HybridSessionRepository.inMemorySessions.set(userId, session);
      return session;

    } catch (lookupException: any) {
      logger.error(`❌ [Hybrid Session Read Crash] El sondeo de persistencia falló: ${lookupException.message}`);
      return HybridSessionRepository.inMemorySessions.get(userId) || null;
    }
  }

  /**
   * Purga físicamente las trazas de estados de las dos bases de datos.
   */
  public async delete(userId: string): Promise<void> {
    const redisKey = `${this.REDIS_PREFIX}${userId}`;
    try {
      await this.redisClient.del(redisKey);
      await this.mariadbPool.query(`DELETE FROM sesiones_chat WHERE usuario_id = ?`, [userId]);
      logger.info(`📦 [Hybrid Session Delete] Purgada sesión ${userId} de las bases de datos.`);
    } catch (deleteError: any) {
      logger.error(`Error eliminando sesión híbrida: ${deleteError.message}`);
    }
    HybridSessionRepository.inMemorySessions.delete(userId);
  }

  public async findAll(): Promise<ChatSession[]> {
    try {
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(`SELECT usuario_id as user_id, paso_actual as current_step, actualizado_en as updated_at, metadatos as metadata FROM sesiones_chat`);
      const dbSessions = rows.map((row: any) => {
        let parsedMetadata: any = {};
        if (row.metadata) {
          parsedMetadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata;
        }
        return new ChatSession({
          userId: row.user_id,
          currentStep: row.current_step,
          updatedAt: row.updated_at,
          isPaused: !!parsedMetadata.isPaused,
          messageHistory: parsedMetadata.messageHistory || [],
          metadata: parsedMetadata
        });
      });
      dbSessions.forEach((s) => {
        HybridSessionRepository.inMemorySessions.set(s.userId, s);
      });
      return dbSessions;
    } catch (err) {
      return Array.from(HybridSessionRepository.inMemorySessions.values());
    }
  }
}
