import Redis from "ioredis";
import { ChatSession } from "../../core/entities/ChatSession";
import { ISessionRepository } from "../../core/interfaces/repositories/ISessionRepository";
import logger from "../../infrastructure/logging/Logger";

export class RedisSessionRepository implements ISessionRepository {
  private readonly TTL_SECONDS = 3600;
  private static readonly inMemorySessions = new Map<string, ChatSession>();

  constructor(private readonly redisClient: Redis) {}

  async findByUserId(userId: string): Promise<ChatSession | null> {
    try {
      const data = await this.redisClient.get(`session:${userId}`);
      if (!data) {
        return RedisSessionRepository.inMemorySessions.get(userId) || null;
      }
      const parsed = JSON.parse(data);
      const session = new ChatSession({ 
        userId, 
        currentStep: parsed.currentStep, 
        updatedAt: new Date(parsed.updatedAt),
        isPaused: parsed.isPaused || false
      });
      RedisSessionRepository.inMemorySessions.set(userId, session);
      return session;
    } catch (err) {
      logger.warn("[Redis] findByUserId falló (modo demo), buscando en memoria", { error: (err as Error).message });
      return RedisSessionRepository.inMemorySessions.get(userId) || null;
    }
  }

  async save(session: ChatSession): Promise<void> {
    try {
      const payload = JSON.stringify({ 
        currentStep: session.currentStep, 
        updatedAt: session.updatedAt,
        isPaused: session.isPaused
      });
      await this.redisClient.setex(`session:${session.userId}`, this.TTL_SECONDS, payload);
    } catch (err) {
      logger.warn("[Redis] save session falló (modo demo), guardando en memoria", { error: (err as Error).message });
    }
    // Siempre guardar en memoria
    RedisSessionRepository.inMemorySessions.set(session.userId, session);
  }

  async delete(userId: string): Promise<void> {
    try {
      await this.redisClient.del(`session:${userId}`);
    } catch (err) {
      logger.warn("[Redis] delete session falló (modo demo), eliminando de memoria", { error: (err as Error).message });
    }
    // Siempre borrar en memoria
    RedisSessionRepository.inMemorySessions.delete(userId);
  }

  async findAll(): Promise<ChatSession[]> {
    try {
      const keys = await this.redisClient.keys("session:*");
      const sessions: ChatSession[] = [];
      for (const key of keys) {
        const data = await this.redisClient.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          const userId = key.replace("session:", "");
          const session = new ChatSession({
            userId,
            currentStep: parsed.currentStep,
            updatedAt: new Date(parsed.updatedAt),
            isPaused: parsed.isPaused || false
          });
          sessions.push(session);
          RedisSessionRepository.inMemorySessions.set(userId, session);
        }
      }
      return sessions;
    } catch (err) {
      logger.warn("[Redis] findAll sessions falló (modo demo), usando memoria", { error: (err as Error).message });
      return Array.from(RedisSessionRepository.inMemorySessions.values());
    }
  }
}
