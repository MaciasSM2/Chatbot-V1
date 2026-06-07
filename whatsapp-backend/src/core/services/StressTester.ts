/**
 * @file StressTester.ts
 * @description Framework de inyección de carga masiva y concurrente para certificar la estabilidad del Bot.
 * Instrumenta las colas de BullMQ de forma controlada sin consumir la cuota de la API de Meta.
 */
import { EnqueueMessageUseCase } from '../usecases/EnqueueMessageUseCase';
import logger from '../../infrastructure/logging/Logger';
import { SystemMetricsManager } from '../../infrastructure/metrics/Metrics';

interface StressTestResult {
  totalInjected: number;
  successfulRequests: number;
  failedRequests: number;
  totalDurationMs: number;
  averageLatencyMs: number;
}

export class StressTester {
  constructor(private readonly enqueueUseCase: EnqueueMessageUseCase) {}

  /**
   * Dispara una ráfaga masiva y paralela de mensajes entrantes simulando múltiples usuarios únicos de WhatsApp.
   */
  public async executeHighConcurrencyTest(totalMessages: number, concurrencyLimit: number): Promise<StressTestResult> {
    logger.warn(`🔥 [Stress Test Engine] Iniciando inyección masiva de ${totalMessages} cargas concurrentes...`);
    
    const startTime = Date.now();
    let successfulCount = 0;
    let failedCount = 0;
    
    const metrics = SystemMetricsManager.getInstance();
    const messagePayloads: Array<{ phone: string; text: string }> = [];

    // 1. Generar la colección de datos de usuarios sintéticos únicos
    for (let i = 0; i < totalMessages; i++) {
      const uniquePhone = `57315${String(i).padStart(7, '0')}`;
      // Intercalar intenciones para forzar la CPU a transicionar estados de la FSM y cotizar fletes
      const textIntent = i % 3 === 0 ? 'Hola, necesito cotizar un flete' : i % 3 === 1 ? 'Medellín' : 'Rionegro';
      
      messagePayloads.push({ phone: uniquePhone, text: textIntent });
    }

    // 2. Procesar los mensajes por lotes de alta densidad utilizando la red mesh de promesas
    for (let index = 0; index < messagePayloads.length; index += concurrencyLimit) {
      const activeChunk = messagePayloads.slice(index, index + concurrencyLimit);
      
      const chunkPromises = activeChunk.map(async (payload) => {
        const singleRequestStart = Date.now();
        const messageId = `STRESS-ID-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        try {
          // Invocar el caso de uso atómico encargándose del encolado en BullMQ
          await this.enqueueUseCase.execute(
            messageId,
            payload.phone,
            payload.text,
            null
          );
          
          successfulCount++;
          // Incrementar de forma física el contador de Prometheus para monitoreo en Grafana
          metrics.inboundMessagesCounter.inc({ channel: 'SIMULATOR', status: 'SUCCESS' });
        } catch (error) {
          failedCount++;
          metrics.inboundMessagesCounter.inc({ channel: 'SIMULATOR', status: 'ERROR' });
        } finally {
          const singleDuration = (Date.now() - singleRequestStart) / 1000;
          // Registrar la latencia exacta en el histograma perimetral de Prometheus
          metrics.siceTacLiquidationDuration.observe(singleDuration);
        }
      });

      // Ejecutar el lote de forma estrictamente paralela en la CPU
      await Promise.all(chunkPromises);
    }

    const totalDurationMs = Date.now() - startTime;
    const averageLatencyMs = totalDurationMs / totalMessages;

    const testSummary: StressTestResult = {
      totalInjected: totalMessages,
      successfulRequests: successfulCount,
      failedRequests: failedCount,
      totalDurationMs,
      averageLatencyMs
    };

    logger.info('🏆 [Stress Test Engine] Simulación masiva concluida. Resumen de rendimiento:', testSummary);
    return testSummary;
  }
}
