/**
 * @file JsRuleBotStrategy.ts
 * @description Estrategia concreta para el Chat 1 (Full JS).
 * Responde mediante reglas deterministas utilizando el DeterministicTreeRuleEngine.
 */

import { IBotEngineStrategy, IBotResponsePayload } from './IBotEngineStrategy';
import { ITenantRepository } from '../../interfaces/repositories/ITenantRepository';
import { DeterministicTreeRuleEngine } from '../../services/DeterministicTreeRuleEngine';
import { IDecisionNode } from '../entities/DecisionTreeRule';
import { WelcomeOrchestrator } from '../../services/WelcomeOrchestrator';
import { SiceTacLiquidationEngine } from '../../services/SiceTacLiquidationEngine';

export class JsRuleBotStrategy implements IBotEngineStrategy {
  private readonly ruleEngine: DeterministicTreeRuleEngine;

  constructor(
    _welcomeOrchestrator?: WelcomeOrchestrator,
    _siceTacEngine?: SiceTacLiquidationEngine,
    private readonly tenantRepository?: ITenantRepository
  ) {
    this.ruleEngine = new DeterministicTreeRuleEngine();
  }

  public async processMessage(
    tenantId: string,
    _userPhone: string,
    userText: string
  ): Promise<IBotResponsePayload> {
    const startTime = Date.now();

    let customNodes: IDecisionNode[] | undefined;
    if (this.tenantRepository) {
      const rawDocumentJson = await this.tenantRepository.getTenantDocumentTree(tenantId, 'FULL_JS');
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
      : this.ruleEngine;

    const evaluation = engine.evaluate(userText);
    const responseText = evaluation.matchedNode?.responseText || '🤖 Servicio de atención automatizado ProChat.';

    const executionTimeMs = Date.now() - startTime;

    return {
      chatType: 'FULL_JS',
      responseText,
      executionTimeMs,
      tokenMetrics: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
      },
      sourceContext: `Motor Determinista JS (${evaluation.matchedNode?.id || 'fallback'})`,
    };
  }
}
