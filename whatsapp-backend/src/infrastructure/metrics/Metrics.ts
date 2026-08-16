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

  public tokensConsumedCounter!: client.Counter<'tenant_id' | 'model' | 'token_type'>;
  public estimatedCostUsdCounter!: client.Counter<'tenant_id' | 'model'>;
  public executionDurationHistogram!: client.Histogram<'chat_type'>;
  public cavemanSavingsCounter!: client.Counter<'tenant_id'>;

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

    this.tokensConsumedCounter = new client.Counter({
      name: 'chatbot_tokens_consumed_total',
      help: 'Conteo total de tokens consumidos agrupados por tenant, modelo y tipo de token.',
      labelNames: ['tenant_id', 'model', 'token_type'],
      registers: [this.registry],
    });

    this.estimatedCostUsdCounter = new client.Counter({
      name: 'chatbot_estimated_cost_usd_total',
      help: 'Acumulado del costo financiero estimado en USD por uso de modelos LLM.',
      labelNames: ['tenant_id', 'model'],
      registers: [this.registry],
    });

    this.executionDurationHistogram = new client.Histogram({
      name: 'chatbot_execution_duration_seconds',
      help: 'Histograma del tiempo de respuesta en segundos por motor (FULL_JS, HYBRID, FULL_AI).',
      labelNames: ['chat_type'],
      buckets: [0.005, 0.05, 0.1, 0.5, 1.0, 2.5, 5.0],
      registers: [this.registry],
    });

    this.cavemanSavingsCounter = new client.Counter({
      name: 'chatbot_caveman_savings_tokens_total',
      help: 'Estimación de tokens de entrada ahorrados mediante la técnica Caveman Prompting.',
      labelNames: ['tenant_id'],
      registers: [this.registry],
    });
  }

  public recordAiUsage(
    tenantId: string,
    model: string,
    promptTokens: number,
    completionTokens: number,
    costUsd: number,
    cavemanSavings: number
  ): void {
    this.tokensConsumedCounter.inc({ tenant_id: tenantId, model, token_type: 'prompt' }, promptTokens);
    this.tokensConsumedCounter.inc({ tenant_id: tenantId, model, token_type: 'completion' }, completionTokens);
    this.estimatedCostUsdCounter.inc({ tenant_id: tenantId, model }, costUsd);
    
    if (cavemanSavings > 0) {
      this.cavemanSavingsCounter.inc({ tenant_id: tenantId }, cavemanSavings);
    }
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

export default manager;
