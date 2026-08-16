/**
 * @file DeterministicTreeRuleEngine.ts
 * @description Algoritmo determinista de alta velocidad.
 * Evalúa las entradas contra la plantilla de 20 reglas antes de considerar la activación de IA.
 */

import { IDecisionNode, IMatchEvaluationResult } from '../domain/entities/DecisionTreeRule';
import { CORPORATE_DECISION_TREE_20 } from '../../infrastructure/database/seeds/DefaultCorporateDecisionTree';

export class DeterministicTreeRuleEngine {
  private readonly rulesTree: readonly IDecisionNode[];

  constructor(customNodes?: readonly IDecisionNode[]) {
    this.rulesTree = customNodes && customNodes.length > 0 ? customNodes : CORPORATE_DECISION_TREE_20;
  }

  /**
   * Evalúa la entrada del usuario contra la plantilla de reglas deterministas.
   * 
   * @param userText Texto ingresado por el cliente.
   * @param _activeState Estado actual de la conversación (opcional).
   * @returns Resultado con el nodo emparejado, puntaje de confianza e indicador de fallback.
   */
  public evaluate(userText: string, _activeState?: string): IMatchEvaluationResult {
    const normalizedInput = this.normalizeText(userText);

    if (normalizedInput.length === 0) {
      return this.getFallbackResult();
    }

    let bestNode: IDecisionNode | null = null;
    let highestScore = 0;

    for (const node of this.rulesTree) {
      let currentScore = 0;

      for (const trigger of node.triggers) {
        const normalizedTrigger = this.normalizeText(trigger);
        if (!normalizedTrigger) continue;

        // Coincidencia exacta
        if (normalizedInput === normalizedTrigger) {
          currentScore += 5;
        } 
        // Coincidencia por palabra completa
        else {
          const wordRegex = new RegExp(`(?:^|\\s)${this.escapeRegExp(normalizedTrigger)}(?:$|\\s)`, 'i');
          if (wordRegex.test(normalizedInput)) {
            currentScore += 3;
          }
        }
      }

      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestNode = node;
      }
    }

    // Umbral mínimo de confianza (score >= 3)
    if (bestNode && highestScore >= 3) {
      return {
        matchedNode: bestNode,
        confidenceScore: highestScore,
        isFallback: false,
      };
    }

    return this.getFallbackResult();
  }

  /**
   * Obtiene la regla de Fallback local cuando no hay coincidencia determinista.
   */
  public getFallbackResult(): IMatchEvaluationResult {
    const fallbackNode = this.rulesTree.find(n => n.id === 'node-19-fallback-unknown') ?? null;
    return {
      matchedNode: fallbackNode,
      confidenceScore: 0,
      isFallback: true,
    };
  }

  /**
   * Normalización limpia de texto (Remueve diacríticos, mayúsculas y caracteres especiales).
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
