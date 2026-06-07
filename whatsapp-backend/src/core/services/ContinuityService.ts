/**
 * @file ContinuityService.ts
 * @description Servicio encargado de encolar y purgar tareas automáticas de reenganche de clientes.
 * Encapsula las operaciones asíncronas de BullMQ sobre Redis con fallback en memoria local.
 */
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import logger from '../../infrastructure/logging/Logger';

export class ContinuityService {
  private continuityQueue: Queue | null = null;
  private readonly QUEUE_NAME = 'whatsapp_continuity_pipeline';
  private inMemoryTimers: Map<string, NodeJS.Timeout[]> = new Map();
  private onContinuityTriggered?: (userId: string, minutes: number) => Promise<void>;

  constructor(connectionOrQueue?: Redis | Queue | null) {
    if (connectionOrQueue) {
      if (connectionOrQueue instanceof Queue) {
        this.continuityQueue = connectionOrQueue;
      } else if (this.isValidRedisClient(connectionOrQueue)) {
        this.continuityQueue = new Queue(this.QUEUE_NAME, {
          connection: connectionOrQueue,
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: 1000
          }
        });
      } else {
        throw new Error('Invalid connection: must be a Redis client or BullMQ Queue instance.');
      }
    }
  }

  private isValidRedisClient(client: any): client is Redis {
    return typeof client === 'object' && client !== null && 'status' in client && 'pipeline' in client;
  }

  public registerFallbackProcessor(processor: (userId: string, minutes: number) => Promise<void>) {
    this.onContinuityTriggered = processor;
  }

  /**
   * Agenda dos alertas automáticas en segundo plano (a los 5 y 15 minutos de inactividad).
   * @param phoneNumber Teléfono destino del recordatorio.
   * @param abandonedState Estado en el que se detuvo el flujo SICE-TAC.
   */
  public async scheduleFollowUpReminder(phoneNumber: string, abandonedState: string = 'UNKNOWN'): Promise<void> {
    // 1. Cancelamos cualquier recordatorio previo para este usuario (Idempotencia)
    await this.cancelPendingReminders(phoneNumber);

    if (this.continuityQueue) {
      try {
        const fiveMinutesInMs = 5 * 60 * 1000;
        const fifteenMinutesInMs = 15 * 60 * 1000;

        const delay5m = process.env.NODE_ENV === 'test' ? 5000 : fiveMinutesInMs;
        const delay15m = process.env.NODE_ENV === 'test' ? 15000 : fifteenMinutesInMs;

        // Payload estructurado con la metadata conversacional requerida por el MessageWorker
        const jobPayload = {
          phone: phoneNumber,
          userId: phoneNumber,
          origin: 'CONTINUITY_ENGINE',
          contextState: abandonedState
        };

        // Registrar Jobs diferidos usando identificadores deterministas únicos para bloquear duplicaciones
        await this.continuityQueue.add(`alert_5min:${phoneNumber}`, jobPayload, {
          delay: delay5m,
          jobId: `fsm_5m:${phoneNumber}`
        });

        await this.continuityQueue.add(`alert_15min:${phoneNumber}`, jobPayload, {
          delay: delay15m,
          jobId: `fsm_15m:${phoneNumber}`
        });

        logger.info(`⏳ Relojes de continuidad (BullMQ) activados para el usuario: ${phoneNumber}`);
        return;
      } catch (err: any) {
        logger.warn(`⚠️ Error encolando timers en BullMQ, haciendo fallback a memoria local.`, { error: err.message });
      }
    }

    // MODO MEMORIA (FALLBACK)
    if (!this.onContinuityTriggered) {
      logger.warn(`⚠️ ContinuityService en modo memoria, pero no se ha registrado un Fallback Processor.`);
      return;
    }

    const delay5 = process.env.NODE_ENV === 'test' ? 5000 : 5 * 60 * 1000;
    const timer5 = setTimeout(() => {
      this.onContinuityTriggered!(phoneNumber, 5).catch(e => logger.error("Error en fallback timer 5m", { error: e.message }));
    }, delay5);

    const delay15 = process.env.NODE_ENV === 'test' ? 15000 : 15 * 60 * 1000;
    const timer15 = setTimeout(() => {
      this.onContinuityTriggered!(phoneNumber, 15).catch(e => logger.error("Error en fallback timer 15m", { error: e.message }));
    }, delay15);

    this.inMemoryTimers.set(phoneNumber, [timer5, timer15]);
    logger.info(`⏳ Relojes de continuidad (Memoria Local) activados para el usuario: ${phoneNumber}`);
  }

  /**
   * Purga y elimina cualquier alerta diferida programada en segundo plano (Deduplicación activa).
   * Se invoca inmediatamente en cuanto el usuario reanuda el chat enviando un nuevo payload.
   */
  public async cancelPendingReminders(phoneNumber: string): Promise<void> {
    if (this.continuityQueue) {
      try {
        const job5 = await this.continuityQueue.getJob(`fsm_5m:${phoneNumber}`);
        const job15 = await this.continuityQueue.getJob(`fsm_15m:${phoneNumber}`);
        
        // Soporte para borrado de IDs antiguos / legados
        const legacyJob5 = await this.continuityQueue.getJob(`followup_5_${phoneNumber}`);
        const legacyJob15 = await this.continuityQueue.getJob(`followup_15_${phoneNumber}`);

        if (job5) await job5.remove();
        if (job15) await job15.remove();
        if (legacyJob5) await legacyJob5.remove();
        if (legacyJob15) await legacyJob15.remove();
      } catch (err: any) {
        logger.warn(`⚠️ [Continuity Cache Warning] No se pudo limpiar la cola de Redis: ${err.message}`);
      }
    }

    const timers = this.inMemoryTimers.get(phoneNumber);
    if (timers) {
      timers.forEach(clearTimeout);
      this.inMemoryTimers.delete(phoneNumber);
    }
  }

  // ALIAS DE COMPATIBILIDAD RETROACTIVA
  public async scheduleFollowUps(userId: string): Promise<void> {
    return this.scheduleFollowUpReminder(userId);
  }

  public async cancelPendingFollowUps(userId: string): Promise<void> {
    return this.cancelPendingReminders(userId);
  }
}
