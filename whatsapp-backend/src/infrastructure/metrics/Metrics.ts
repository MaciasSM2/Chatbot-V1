/**
 * @file Metrics.ts
 * @description Central de telemetría basada en prom-client.
 * Registra y expone los histogramas de rendimiento logística del ecosistema.
 */
import client from 'prom-client';
import { Request, Response, Router } from 'express';

export class SystemMetricsManager {
  private static instance: SystemMetricsManager | null = null;
  private registry: client.Registry;

  // Declaración explícita de contadores e histogramas estrictos
  public inboundMessagesCounter!: client.Counter;
  public siceTacLiquidationDuration!: client.Histogram;

  private constructor() {
    this.registry = new client.Registry();
    this.registry.setDefaultLabels({ app: 'chatbot_modulo_saludo_2026' });
    
    // Recolectar de forma automática métricas por defecto de la máquina virtual de Node (RAM, CPU, Event Loop)
    client.collectDefaultMetrics({ register: this.registry });
    this.initializeCustomMetrics();
  }

  public static getInstance(): SystemMetricsManager {
    if (!SystemMetricsManager.instance) {
      SystemMetricsManager.instance = new SystemMetricsManager();
    }
    return SystemMetricsManager.instance;
  }

  /**
   * Instancia e instrumenta los objetos de medición de rendimiento conversacional y financiero.
   */
  private initializeCustomMetrics(): void {
    this.inboundMessagesCounter = new client.Counter({
      name: 'chatbot_inbound_messages_total',
      help: 'Conteo acumulado de eventos y mensajes procesados exitosamente desde WhatsApp.',
      labelNames: ['channel', 'status'],
      registers: [this.registry]
    });

    this.siceTacLiquidationDuration = new client.Histogram({
      name: 'chatbot_sicetac_liquidation_duration_seconds',
      help: 'Histograma del tiempo de CPU consumido en resolver consultas y fletes de transporte.',
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], // Mediciones precisas en fracciones de segundo
      registers: [this.registry]
    });
  }

  /**
   * Genera el enrutador Express dedicado para el raspado de datos perimetral de Prometheus.
   */
  public getMetricsRouter(): Router {
    const router = Router();
    
    router.get('/metrics', async (_req: Request, res: Response) => {
      try {
        res.set('Content-Type', this.registry.contentType);
        const aggregatedMetrics = await this.registry.metrics();
        res.status(200).send(aggregatedMetrics);
      } catch (error: any) {
        res.status(500).send(error.message);
      }
    });

    return router;
  }
}

// Exportaciones de compatibilidad para evitar roturas en el resto del backend (ej. MessageWorker.ts)
const manager = SystemMetricsManager.getInstance();
export const messageCounter = manager.inboundMessagesCounter;
export const processingDuration = manager.siceTacLiquidationDuration;
export const register = {
  contentType: 'text/plain',
  metrics: async () => ''
};

export default manager;
