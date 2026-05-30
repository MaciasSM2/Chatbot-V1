/**
 * @file RedisChatSessionRepository.ts
 * @description Implementación de alto rendimiento que mapea las entidades de dominio
 * hacia comandos atómicos de Hashes de Redis (`hset`, `hgetall`).
 */

import { IChatSessionRepository } from '../../core/interfaces/IChatSessionRepository';
import { ChatSession, IChatSessionProps } from '../../core/domain/ChatSession';
import Redis from 'ioredis';

export class RedisChatSessionRepository implements IChatSessionRepository {
  // Ventana de tiempo oficial de WhatsApp: 24 horas expresadas en segundos
  private readonly SESSION_TTL_SECONDS = 24 * 60 * 60; 
  private readonly PREFIX = 'session:chat:';

  constructor(private readonly redisClient: Redis) {}

  public async findById(phoneNumber: string): Promise<ChatSession | null> {
    const key = `${this.PREFIX}${phoneNumber}`;
    
    // Recupera de forma atómica todo el mapa de datos del Hash de Redis
    const rawData = await this.redisClient.hgetall(key);

    // Si el Hash no contiene campos, significa que expiró o no ha sido creado
    if (!rawData || Object.keys(rawData).length === 0) {
      return null;
    }

    // Rehidratación de los datos tipados primitivos desde strings de Redis
    const props: IChatSessionProps = {
      phoneNumber: rawData.phoneNumber || phoneNumber,
      clientName: rawData.clientName === 'null' ? null : (rawData.clientName || null),
      currentFsmState: rawData.currentFsmState || 'WELCOME',
      isRegisteredUser: rawData.isRegisteredUser === 'true',
      lastMessageTimestamp: parseInt(rawData.lastMessageTimestamp || '0', 10)
    };

    return new ChatSession(props);
  }

  public async save(session: ChatSession): Promise<void> {
    const primitives = session.toPrimitives();
    const key = `${this.PREFIX}${primitives.phoneNumber}`;

    // Mapeo explícito a cadenas para almacenamiento plano dentro de las claves del Hash
    const hashData: Record<string, string> = {
      phoneNumber: primitives.phoneNumber,
      clientName: primitives.clientName || 'null',
      currentFsmState: primitives.currentFsmState,
      isRegisteredUser: String(primitives.isRegisteredUser),
      lastMessageTimestamp: String(primitives.lastMessageTimestamp)
    };

    // Almacenamiento multi-campo y renovación del tiempo de expiración (TTL) en una transacción pipeline
    await this.redisClient.multi()
      .hset(key, hashData)
      .expire(key, this.SESSION_TTL_SECONDS)
      .exec();
  }

  public async updateField(phoneNumber: string, field: string, value: string | number | boolean): Promise<void> {
    const key = `${this.PREFIX}${phoneNumber}`;
    const stringValue = String(value);

    // Modificación quirúrgica de un campo sin tocar el resto del Hash
    await this.redisClient.multi()
      .hset(key, field, stringValue)
      .hset(key, 'lastMessageTimestamp', String(Date.now()))
      .expire(key, this.SESSION_TTL_SECONDS) // Desliza la ventana de 24 horas con cada interacción
      .exec();
  }

  public async delete(phoneNumber: string): Promise<void> {
    const key = `${this.PREFIX}${phoneNumber}`;
    await this.redisClient.del(key);
  }
}
