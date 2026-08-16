/**
 * @file HybridBotStrategy.ts
 * @description Estrategia concreta para el Chat 2 (Híbrido).
 * Resuelve primero mediante Fast-Path determinista (DeterministicTreeRuleEngine) y activa la IA únicamente si se requiere.
 */

import { IBotEngineStrategy, IBotResponsePayload } from './IBotEngineStrategy';
import { ITenantRepository } from '../../interfaces/repositories/ITenantRepository';
import { DeterministicTreeRuleEngine } from '../../services/DeterministicTreeRuleEngine';
import { HeuristicEngineService } from '../../services/HeuristicEngineService';
import { MultiLlmGateway } from '../../services/MultiLlmGateway';
import { TenantQuotaService } from '../../services/TenantQuotaService';
import { IDecisionNode } from '../entities/DecisionTreeRule';

export class HybridBotStrategy implements IBotEngineStrategy {
  private readonly defaultRuleEngine: DeterministicTreeRuleEngine;
  private readonly heuristicEngine: HeuristicEngineService;
  private readonly llmGateway: MultiLlmGateway;
  private readonly tenantRepo: ITenantRepository;

  constructor(
    tenantRepository?: ITenantRepository,
    _heuristicEngine?: HeuristicEngineService
  ) {
    this.defaultRuleEngine = new DeterministicTreeRuleEngine();
    this.heuristicEngine = _heuristicEngine || new HeuristicEngineService();
    this.llmGateway = new MultiLlmGateway();
    this.tenantRepo = tenantRepository!;
  }

  public async processMessage(
    tenantId: string,
    _userPhone: string,
    userText: string
  ): Promise<IBotResponsePayload> {
    const startTime = Date.now();

    // 1. PASO 1: Fast-Path Determinista (Fricción Cero, sub-2ms, 0 tokens)
    let customNodes: IDecisionNode[] | undefined;
    if (this.tenantRepo) {
      const rawDocumentJson = await this.tenantRepo.getTenantDocumentTree(tenantId, 'HYBRID');
      if (rawDocumentJson) {
        try {
          customNodes = JSON.parse(rawDocumentJson) as IDecisionNode[];
        } catch {
          customNodes = undefined;
        }
      }
    }

    const engine = customNodes && customNodes.length > 0
      ? new DeterministicTreeRuleEngine(customNodes)
      : this.defaultRuleEngine;

    const evaluation = engine.evaluate(userText);

    if (!evaluation.isFallback && evaluation.matchedNode && evaluation.confidenceScore >= 3) {
      return {
        chatType: 'HYBRID',
        responseText: evaluation.matchedNode.responseText,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
        sourceContext: `Fast-Path Determinista (${evaluation.matchedNode.id})`,
      };
    }

    // 2. PASO 2: Evaluar la complejidad heurística para decidir si se activa la IA
    const verdict = this.heuristicEngine.evaluateComplexity(userText);

    if (!verdict.shouldTriggerAi) {
      const fallbackText = evaluation.matchedNode?.responseText || 
        '⚡ [Chat 2 - Híbrido]: Selecciona una opción del menú o realiza una pregunta más detallada para activar la asistencia avanzada.';

      return {
        chatType: 'HYBRID',
        responseText: fallbackText,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
        sourceContext: `Deterministic Fallback (Complejidad: ${verdict.complexityScore})`,
      };
    }

    // 3. PASO 3: Invocación de la IA On-Demand
    const quotaService = new TenantQuotaService();
    const isExceeded = await quotaService.isQuotaExceeded(tenantId);
    if (isExceeded) {
      const fallbackText = evaluation.matchedNode?.responseText || 
        '⚡ [Chat 2 - Híbrido]: Selecciona una opción del menú o realiza una pregunta más detallada para activar la asistencia avanzada.';

      return {
        chatType: 'HYBRID',
        responseText: `⚠️ [Límite de Presupuesto Excedido]: Conmutando automáticamente a modo de consulta determinista.\n\n${fallbackText}`,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
        sourceContext: `Deterministic Fallback (Presupuesto LLM Excedido)`,
      };
    }

    try {
      const apiKeyConfig = await this.tenantRepo.getTenantApiKey(tenantId);

      if (!apiKeyConfig || !apiKeyConfig.plainApiKey) {
        const promptTokens = Math.max(20, Math.floor(userText.length / 3));
        const completionTokens = Math.max(30, Math.floor(userText.length / 2) + 15);
        const totalTokens = promptTokens + completionTokens;
        const estimatedCostUsd = (promptTokens * 0.00000015) + (completionTokens * 0.00000060);

        await quotaService.incrementUsage(tenantId, estimatedCostUsd);

        return {
          chatType: 'HYBRID',
          responseText: `🧠 [IA Híbrida Simulada - Sin Key] Requerimiento analizado: "${userText}". (Complejidad: ${verdict.complexityScore}, Espacio de API Key listo para producción).`,
          executionTimeMs: Date.now() - startTime,
          tokenMetrics: { promptTokens, completionTokens, totalTokens, estimatedCostUsd },
          sourceContext: `IA On-Demand (Modo Demo - Complejidad: ${verdict.complexityScore})`,
        };
      }

      const systemPrompt = `
        Eres el asistente híbrido de atención al cliente.
        Responde exclusivamente con base en la información corporativa.
        Razón de activación de IA: ${verdict.detectedReason}.
      `;

      const aiResult = await this.llmGateway.executeCompletion(apiKeyConfig, systemPrompt, userText);
      await quotaService.incrementUsage(tenantId, aiResult.tokenMetrics.estimatedCostUsd);

      return {
        chatType: 'HYBRID',
        responseText: aiResult.responseText,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: aiResult.tokenMetrics,
        sourceContext: `IA On-Demand (${apiKeyConfig.provider} - Complejidad: ${verdict.complexityScore})`,
      };
    } catch (llmError: unknown) {
      const errorMsg = llmError instanceof Error ? llmError.message : 'Error en llamada a IA';

      return {
        chatType: 'HYBRID',
        responseText: `⚠️ [Chat 2 - Híbrido]: Ocurrió un inconveniente procesando tu solicitud con la IA (${errorMsg}). Un asesor continuará tu atención.`,
        executionTimeMs: Date.now() - startTime,
        tokenMetrics: { promptTokens: 0, completionTokens: 0, totalTokens: 0, estimatedCostUsd: 0 },
        sourceContext: 'Fallback por Falla de Red/IA',
      };
    }
  }
}
