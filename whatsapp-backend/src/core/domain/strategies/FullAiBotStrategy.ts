/**
 * @file FullAiBotStrategy.ts
 * @description Estrategia concreta para el Chat 3 (Full IA).
 * Ensambla el contexto RAG, memoria Summary Buffer y aplica compresión Caveman antes de invocar la IA.
 */

import { IBotEngineStrategy, IBotResponsePayload } from './IBotEngineStrategy';
import { ITenantRepository } from '../../interfaces/repositories/ITenantRepository';
import { CavemanTokenOptimizer } from '../../services/CavemanTokenOptimizer';
import { SummaryBufferMemory } from '../../services/SummaryBufferMemory';
import { LightweightRagService } from '../../services/LightweightRagService';
import { MultiLlmGateway } from '../../services/MultiLlmGateway';
import { TenantQuotaService } from '../../services/TenantQuotaService';
import { JsRuleBotStrategy } from './JsRuleBotStrategy';

export class FullAiBotStrategy implements IBotEngineStrategy {
  private readonly cavemanOptimizer: CavemanTokenOptimizer;
  private readonly memory: SummaryBufferMemory;
  private readonly ragService: LightweightRagService;
  private readonly llmGateway: MultiLlmGateway;
  private readonly tenantRepo: ITenantRepository;

  constructor(
    tenantRepository?: ITenantRepository,
    tokenOptimizer?: CavemanTokenOptimizer
  ) {
    this.tenantRepo = tenantRepository!;
    this.cavemanOptimizer = tokenOptimizer || new CavemanTokenOptimizer();
    this.memory = new SummaryBufferMemory(this.tenantRepo);
    this.ragService = new LightweightRagService();
    this.llmGateway = new MultiLlmGateway();
  }

  public async processMessage(
    tenantId: string,
    userPhone: string,
    userText: string
  ): Promise<IBotResponsePayload> {
    const startTime = Date.now();

    // 0. Verificar límite de cuotas de presupuesto diario
    const quotaService = new TenantQuotaService();
    const isExceeded = await quotaService.isQuotaExceeded(tenantId);
    if (isExceeded) {
      const jsRuleBotStrategy = new JsRuleBotStrategy(undefined, undefined, this.tenantRepo);
      const jsRes = await jsRuleBotStrategy.processMessage(tenantId, userPhone, userText);
      return {
        ...jsRes,
        chatType: 'FULL_AI',
        responseText: `⚠️ [Límite de Presupuesto Excedido]: Conmutando automáticamente a modo de consulta determinista.\n\n${jsRes.responseText}`,
        sourceContext: `JavaScript Fallback (Presupuesto LLM Excedido)`
      };
    }

    // 1. Obtener la credencial de IA del Tenant
    const apiKeyConfig = await this.tenantRepo.getTenantApiKey(tenantId);

    if (!apiKeyConfig || !apiKeyConfig.plainApiKey) {
      // Fallback simulación si no se coloca Key en etapa de desarrollo/demo
      const rawDocumentText = await this.tenantRepo.getTenantRawDocument(tenantId, 'FULL_AI');
      const ragContext = await this.ragService.extractRelevantContextVector(rawDocumentText || '', userText, tenantId, 'FULL_AI', undefined);
      const conversationSummary = await this.memory.getSummary(tenantId, userPhone);

      const rawSystemPrompt = `
        Eres el asistente virtual corporativo de alta precisión.
        Información documental oficial de respaldo:
        ${ragContext}

        Resumen conversacional previo con este usuario:
        ${conversationSummary}

        Instrucciones: Responde de forma clara, profesional y exacta a la pregunta usando solo la información proporcionada.
      `;

      const compressedSystemPrompt = this.cavemanOptimizer.compressPrompt(rawSystemPrompt);
      const promptTokens = Math.max(30, Math.floor(compressedSystemPrompt.length / 3));
      const completionTokens = Math.max(40, Math.floor(userText.length / 2) + 20);
      const totalTokens = promptTokens + completionTokens;
      const estimatedCostUsd = (promptTokens * 0.00000015) + (completionTokens * 0.00000060);

      const simulatedResponse = `🧠 [Full IA Simulada - Sin Key] Contexto analizado. Respuesta corporativa sugerida para "${userText}". (Espacio de API Key listo para producción).`;
      await this.memory.updateSummary(tenantId, userPhone, userText, simulatedResponse);

      // Incrementar consumo en Redis
      await quotaService.incrementUsage(tenantId, estimatedCostUsd);

      return {
        chatType: 'FULL_AI',
        responseText: simulatedResponse,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: { promptTokens, completionTokens, totalTokens, estimatedCostUsd },
        sourceContext: 'Full IA (Modo Demo + Caveman Compression + Summary Buffer Memory)'
      };
    }

    // 2. Recuperar el documento base y extraer fragmentos relevantes vía RAG
    const rawDocumentText = await this.tenantRepo.getTenantRawDocument(tenantId, 'FULL_AI');
    const ragContext = await this.ragService.extractRelevantContextVector(rawDocumentText || '', userText, tenantId, 'FULL_AI', apiKeyConfig.plainApiKey);

    // 3. Recuperar el resumen conversacional histórico
    const conversationSummary = await this.memory.getSummary(tenantId, userPhone);

    // 4. Construir el System Prompt bruto
    const rawSystemPrompt = `
      Eres el asistente virtual corporativo de alta precisión.
      Información documental oficial de respaldo:
      ${ragContext}

      Resumen conversacional previo con este usuario:
      ${conversationSummary}

      Instrucciones: Responde de forma clara, profesional y exacta a la pregunta usando solo la información proporcionada.
    `;

    // 5. Aplicar la compresión Caveman al System Prompt
    const compressedSystemPrompt = this.cavemanOptimizer.compressPrompt(rawSystemPrompt);

    // 6. Invocar al modelo de IA a través del Gateway
    try {
      const llmResult = await this.llmGateway.executeCompletion(
        apiKeyConfig,
        compressedSystemPrompt,
        userText
      );

      // 7. Actualizar el Summary Buffer asíncronamente con el nuevo turno
      await this.memory.updateSummary(tenantId, userPhone, userText, llmResult.responseText);

      // Incrementar consumo en Redis
      await quotaService.incrementUsage(tenantId, llmResult.tokenMetrics.estimatedCostUsd);

      return {
        chatType: 'FULL_AI',
        responseText: llmResult.responseText,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: llmResult.tokenMetrics,
        sourceContext: `Full IA (${apiKeyConfig.provider} / ${apiKeyConfig.selectedModel}) + Caveman + RAG`,
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Fallo en servicio de IA';

      return {
        chatType: 'FULL_AI',
        responseText: `⚠️ [Chat 3 - Full IA]: Ocurrió un error procesando tu solicitud (${errorMsg}).`,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
        sourceContext: 'Fallback Error IA',
      };
    }
  }
}
