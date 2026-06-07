import { Pool } from 'mysql2/promise';
import { logger } from '../../infrastructure/logging/Logger';

export class CorporateFallbackService {
  constructor(private readonly mariadbPool: Pool) {}

  public async enqueueUndeliveredMessage(clientPhone: string, messageText: string, correlationId: string): Promise<boolean> {
    logger.warn(`[Circuit Breaker Bypass] Diverting message from ${clientPhone} to local immutable storage.`, {
      correlationId
    });

    try {
      await this.mariadbPool.query(
        `INSERT INTO undelivered_meta_messages
          (recipient_phone, message_text, retry_count, is_sent, created_at, updated_at)
         VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [clientPhone, messageText]
      );

      logger.info('[Fallback Secured] Message stored in MariaDB for automatic retry.');
      return true;
    } catch (sqlError: any) {
      logger.error(`[Critical Fallback Crash] Could not save contingency message in MariaDB: ${sqlError.message}`, {
        correlationId
      });
      return false;
    }
  }
}
