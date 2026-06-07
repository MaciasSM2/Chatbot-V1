/**
 * @file OutboundRetryScheduler.ts
 * @description Demonio encargado de vaciar la cola de mensajes no entregados acumulados en MariaDB.
 * Verifica la salud del Circuit Breaker antes de re-intentar el despacho hacia Meta API v21.0.
 */
import { Pool, PoolConnection } from 'mysql2/promise';
import { IWhatsAppOutboundService } from '../../core/interfaces/services/IWhatsAppOutboundService';
import { AdvancedCircuitBreaker } from '../resilience/AdvancedCircuitBreaker';
import logger from '../logging/Logger';

export class OutboundRetryScheduler {
  private isProcessing: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly mariadbPool: Pool,
    private readonly outboundService: IWhatsAppOutboundService,
    private readonly circuitBreaker: AdvancedCircuitBreaker
  ) {}

  /**
   * Arranca el motor de monitoreo asíncrono en background.
   */
  public startRetryPipeline(): void {
    if (this.intervalId) return;

    const pullIntervalMs = 60 * 1000; // Inspección programada cada 60 segundos
    logger.info('🏁 [Retry Daemon] Tubería de reconciliación de mensajes diferidos encendida.');

    this.intervalId = setInterval(async () => {
      await this.processPendingQueue();
    }, pullIntervalMs);
  }

  /**
   * Detiene el cron de forma limpia para evitar subprocesos huérfanos en el apagado del servidor.
   */
  public stopRetryPipeline(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('🔌 [Retry Daemon] Tubería de reconciliación apagada limpiamente.');
    }
  }

  /**
   * Procesa por bloques (*Chunks*) los mensajes en estado de falla temporal en MariaDB.
   */
  private async processPendingQueue(): Promise<void> {
    // Si el proceso anterior sigue en marcha o el Circuit Breaker sigue abierto (rojo), abortar preventivamente
    if (this.isProcessing || !this.circuitBreaker.isHealthy()) {
      return;
    }

    this.isProcessing = true;
    const connection: PoolConnection = await this.mariadbPool.getConnection();

    try {
      // 1. Extraer un bloque controlado de 20 mensajes pendientes para evitar picos de memoria RAM
      const [pendingMessages] = await connection.query<any[]>(
        `SELECT id, recipient_phone as phone, message_text as text, retry_count as retries
         FROM undelivered_meta_messages 
         WHERE is_sent = 0 AND retry_count < 5 
         ORDER BY created_at ASC LIMIT 20`
      );

      if (pendingMessages.length === 0) {
        this.isProcessing = false;
        connection.release();
        return;
      }

      logger.info(`📦 [Retry Daemon] Detectados ${pendingMessages.length} mensajes en bypass. Intentando vaciado de cola...`);

      for (const msg of pendingMessages) {
        // Doble verificación: Si una petición previa hace saltar el circuito en el bucle, detener el procesamiento
        if (!this.circuitBreaker.isHealthy()) {
          logger.warn('🚨 [Retry Daemon] El Circuit Breaker volvió a abrirse. Abortando bloque actual.');
          break;
        }

        const success = await this.outboundService.sendMessage(msg.phone, msg.text);

        if (success) {
          // Marcar de forma definitiva el registro como entregado
          await connection.query(
            `UPDATE undelivered_meta_messages SET is_sent = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [msg.id]
          );
        } else {
          // Incrementar el contador de intentos fallidos para aplicar la política de descarte definitivo
          await connection.query(
            `UPDATE undelivered_meta_messages SET retry_count = retry_count + 1 WHERE id = ?`,
            [msg.id]
          );
        }
      }

    } catch (error: any) {
      logger.error(`❌ [Retry Daemon Crash] Falló la consulta de la cola de contingencia: ${error.message}`);
    } finally {
      this.isProcessing = false;
      connection.release(); // Devolver el hilo de ejecución al pool de MariaDB
    }
  }
}
