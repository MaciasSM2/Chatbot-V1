import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { UnifiedChatbotOrchestrator } from './services/UnifiedChatbotOrchestrator';
import { logger } from '../infrastructure/logging/Logger';

export class MessageWorker {
  private workerInstance: Worker | null = null;

  constructor(
    private readonly redisConnection: Redis,
    private readonly chatbotOrchestrator: UnifiedChatbotOrchestrator
  ) {}

  public startWorkerPipeline(): void {
    if (this.workerInstance) return;

    logger.info('Starting BullMQ consumer daemon.');

    this.workerInstance = new Worker(
      'process-whatsapp-message',
      async (job: Job) => {
        await this.processIncomingQueueJob(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 10,
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 }
      }
    );

    this.workerInstance.on('failed', (job, err) => {
      logger.error(`Worker job ${job?.id} failed: ${err.message}`);
    });
  }

  private async processIncomingQueueJob(job: Job): Promise<void> {
    const { from, text, metadata } = job.data;
    const correlationId = metadata?.correlationId || `WORKER-${Date.now()}`;
    const rawMessageBody = text?.body || '';

    logger.info(`Consuming job ${job.id} for client: ${from}`, { correlationId });

    try {
      const result = await this.chatbotOrchestrator.handleMessage({
        clientPhone: from,
        messageText: rawMessageBody,
        isSimulation: false,
        correlationId
      });

      logger.info(`Message processed. Next FSM state: ${result.nextState}`, { correlationId });
    } catch (err: any) {
      logger.error(`FSM transition error in background worker: ${err.message}`, { correlationId });
      throw err;
    }
  }

  public async gracefulShutdown(): Promise<void> {
    if (this.workerInstance) {
      await this.workerInstance.close();
      logger.info('BullMQ consumer disconnected cleanly.');
    }
  }
}
