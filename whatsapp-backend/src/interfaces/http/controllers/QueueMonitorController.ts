/**
 * @file QueueMonitorController.ts
 * @description Controlador HTTP encargado de interrogar el clúster de Redis.
 * Retorna las métricas cuantitativas de rendimiento de los daemons de BullMQ.
 */
import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import logger from '../../../infrastructure/logging/Logger';

export class QueueMonitorController {
  constructor(private readonly messageQueue: Queue) {}

  /**
   * GET /api/admin/queues/stats
   * Recupera de forma atómica los contadores de tareas distribuidas en Redis.
   */
  public fetchQueueTelemetry = async (_req: Request, res: Response): Promise<void> => {
    try {
      const [activeCount, waitingCount, delayedCount, failedCount, completedCount] = await Promise.all([
        this.messageQueue.getActiveCount(),
        this.messageQueue.getWaitingCount(),
        this.messageQueue.getDelayedCount(),
        this.messageQueue.getFailedCount(),
        this.messageQueue.getCompletedCount()
      ]);

      const isQueueSaturated = activeCount > 50 || waitingCount > 200;

      res.status(200).json({
        success: true,
        status: isQueueSaturated ? 'CONGESTED' : 'OPERATIONAL',
        timestamp: new Date().toISOString(),
        telemetry: {
          activeJobs: activeCount,
          waitingJobs: waitingCount,
          delayedJobs: delayedCount,
          failedJobs: failedCount,
          completedJobs: completedCount,
          totalProcessed: activeCount + waitingCount + delayedCount + failedCount + completedCount
        }
      });

    } catch (telemetryError: any) {
      logger.error(`🚨 [Queue Monitor Collapse] Error interrogando las llaves de BullMQ: ${telemetryError.message}`);
      res.status(500).json({
        success: false,
        error: 'Fallo interno recuperando las constantes operativas de las colas de Redis.'
      });
    }
  };

  /**
   * POST /api/admin/queues/purge-failed
   * Vacía y limpia los registros de tareas fallidas para liberar memoria en Redis.
   */
  public cleanFailedJobsRegistry = async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.warn('🗑️ [Queue Monitor] Solicitada purga masiva de tareas muertas (Dead-Letter) en BullMQ...');
      await this.messageQueue.clean(0, 1000, 'failed');
      
      res.status(200).json({
        success: true,
        message: 'Registro de tareas fallidas purgado exitosamente del clúster de Redis.'
      });
    } catch (purgeError: any) {
      res.status(500).json({ success: false, error: `No se pudo depurar el almacenamiento: ${purgeError.message}` });
    }
  };
}
