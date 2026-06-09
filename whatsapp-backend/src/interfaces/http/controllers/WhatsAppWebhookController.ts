import { Request, Response } from 'express';
import { Queue } from 'bullmq';
import { logger } from '../../../infrastructure/logging/Logger';

export class WhatsAppWebhookController {
  constructor(private readonly messageQueue: Queue) {}

  public verifyWebhook = async (req: Request, res: Response): Promise<void> => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const secureVerifyToken = process.env.WA_VERIFY_TOKEN || 'colombia_logistica_handshake_token';

    if (mode === 'subscribe' && token === secureVerifyToken) {
      logger.info('[Meta Webhook] Handshake verified successfully.');
      res.status(200).send(challenge);
      return;
    }

    logger.warn('[Meta Webhook Auth Alert] Handshake attempt with invalid token.');
    res.status(403).json({ success: false, error: 'Invalid Meta verify token.' });
  };

  public handleIncomingPayload = async (req: Request, res: Response): Promise<void> => {
    const correlationId = (req as any).correlationId || `META-${Date.now()}`;
    const payloadBody = req.body;

    res.status(200).json({ success: true, received: true });

    setImmediate(() => {
      try {
        const entryNode = payloadBody.entry?.[0];
        const changeNode = entryNode?.changes?.[0]?.value;
        const incomingMessage = changeNode?.messages?.[0];

        if (!incomingMessage) {
          return;
        }

        const clientPhone = incomingMessage.from;
        logger.info(`[Meta Webhook Event] Received text payload from WhatsApp: ${clientPhone}`, { correlationId });

        this.messageQueue.add('process-whatsapp-message', {
          from: clientPhone,
          text: incomingMessage.text,
          metadata: {
            correlationId,
            timestamp: incomingMessage.timestamp,
            messageId: incomingMessage.id
          }
        }, {
          jobId: `JOB-${incomingMessage.id}`,
          removeOnComplete: true,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        }).then((job) => {
          logger.info(`Job enqueued. ID: ${job.id}`, { correlationId });
        }).catch((err) => {
          logger.error(`[Queue Injection Error] Webhook enqueue failed: ${err.message}`, { correlationId });
        });
      } catch (err: any) {
        logger.error(`[Webhook Immediate Error] Unhandled exception: ${err.message}`, { correlationId });
      }
    });
  };
}
