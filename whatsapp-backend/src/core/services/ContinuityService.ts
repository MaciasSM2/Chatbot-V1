import { Queue } from "bullmq";
import logger from "../../infrastructure/logging/Logger";

export class ContinuityService {
  private inMemoryTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private onContinuityTriggered?: (userId: string, minutes: number) => Promise<void>;

  constructor(private readonly messageQueue: Queue | null) {}

  public registerFallbackProcessor(processor: (userId: string, minutes: number) => Promise<void>) {
    this.onContinuityTriggered = processor;
  }

  /**
   * Programa o resetea los cronómetros de un usuario.
   */
  public async scheduleFollowUps(userId: string) {
    // 1. Cancelamos cualquier recordatorio previo para este usuario (Idempotencia)
    await this.cancelPendingFollowUps(userId);

    if (this.messageQueue) {
      // MODO REDIS (BULLMQ)
      try {
        // Programamos el primer recordatorio (5 minutos)
        await this.messageQueue.add(
          'send_continuity',
          { userId, minutes: 5 },
          { delay: 5 * 60 * 1000, jobId: `followup_5_${userId}` }
        );

        // Programamos el segundo recordatorio (15 minutos)
        await this.messageQueue.add(
          'send_continuity',
          { userId, minutes: 15 },
          { delay: 15 * 60 * 1000, jobId: `followup_15_${userId}` }
        );
        logger.info(`⏳ Relojes de continuidad (BullMQ) activados para el usuario: ${userId}`);
        return;
      } catch (err) {
        logger.warn(`⚠️ Error encolando timers en BullMQ, haciendo fallback a memoria local.`, { error: (err as Error).message });
      }
    }

    // MODO MEMORIA (FALLBACK)
    if (!this.onContinuityTriggered) {
      logger.warn(`⚠️ ContinuityService en modo memoria, pero no se ha registrado un Fallback Processor.`);
      return;
    }

    const timer5 = setTimeout(() => {
      this.onContinuityTriggered!(userId, 5).catch(e => logger.error("Error en fallback timer 5m", { error: e.message }));
    }, 5 * 60 * 1000);

    const timer15 = setTimeout(() => {
      this.onContinuityTriggered!(userId, 15).catch(e => logger.error("Error en fallback timer 15m", { error: e.message }));
    }, 15 * 60 * 1000);

    this.inMemoryTimers.set(userId, [timer5, timer15]);
    logger.info(`⏳ Relojes de continuidad (Memoria Local) activados para el usuario: ${userId}`);
  }

  public async cancelPendingFollowUps(userId: string) {
    if (this.messageQueue) {
      try {
        const job5 = await this.messageQueue.getJob(`followup_5_${userId}`);
        const job15 = await this.messageQueue.getJob(`followup_15_${userId}`);
        
        if (job5) await job5.remove();
        if (job15) await job15.remove();
      } catch (err) {
        // Si hay error (redis desconectado), ignorar silenciosamente y limpiar memoria
      }
    }

    const timers = this.inMemoryTimers.get(userId);
    if (timers) {
      timers.forEach(clearTimeout);
      this.inMemoryTimers.delete(userId);
    }
  }
}
