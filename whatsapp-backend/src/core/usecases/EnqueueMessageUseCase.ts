import { Queue } from "bullmq";
import Redis from "ioredis";
import logger from "../../infrastructure/logging/Logger";
import { ContinuityService } from "../services/ContinuityService";

export class EnqueueMessageUseCase {
  private fallbackProcessor?: (messageId: string, userId: string, messageBody: string) => Promise<void>;
  private processedMessages = new Map<string, number>();

  constructor(
    private readonly messageQueue: Queue | null,
    private readonly redisClient: Redis | null,
    private readonly continuityService?: ContinuityService
  ) {
    // Limpieza de caché en memoria cada hora
    setInterval(() => {
      const now = Date.now();
      for (const [id, timestamp] of this.processedMessages.entries()) {
        if (now - timestamp > 86400000) {
          this.processedMessages.delete(id);
        }
      }
    }, 3600000);
  }

  public registerFallbackProcessor(processor: (messageId: string, userId: string, messageBody: string) => Promise<void>) {
    this.fallbackProcessor = processor;
  }

  public async execute(messageId: string, userId: string, messageBody: string): Promise<boolean> {
    if (this.continuityService) {
      await this.continuityService.scheduleFollowUps(userId);
    }
    const useRedis = process.env.USE_REDIS !== 'false';

    if (useRedis && this.redisClient && this.messageQueue) {
      try {
        const isUnique = await this.redisClient.set(`msg_idempotency:${messageId}`, 'processed', 'EX', 86400, 'NX');

        if (!isUnique) {
          logger.warn("Mensaje duplicado detectado y descartado", { messageId });
          return false;
        }

        await this.messageQueue.add(
          "process-whatsapp-message",
          { messageId, userId, messageBody },
          {
            attempts: 3,
            backoff: {
              type: "exponential",
              delay: 5000
            }
          }
        );
        logger.info("Mensaje encolado exitosamente para procesamiento", { messageId, userId });
        return true;
      } catch (err) {
        logger.warn("[Queue] Enqueue falló (modo demo), procesando directamente en memoria", { messageId, userId, error: (err as Error).message });
      }
    }

    // Modo memoria local (fallback)
    if (this.processedMessages.has(messageId)) {
      logger.warn("Mensaje duplicado detectado y descartado (memoria local)", { messageId });
      return false;
    }
    this.processedMessages.set(messageId, Date.now());
    logger.info("Mensaje procesado en memoria local", { messageId, userId });

    if (this.fallbackProcessor) {
      // Ejecutar de forma asíncrona para no bloquear el webhook HTTP
      this.fallbackProcessor(messageId, userId, messageBody).catch(e => {
        logger.error("Error en procesamiento directo de fallback", { error: e.message });
      });
      return true;
    }
    return false;
  }
}
