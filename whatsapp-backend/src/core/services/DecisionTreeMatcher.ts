/**
 * @file DecisionTreeMatcher.ts
 * @description Algoritmo determinista de coincidencia de intención por árbol de decisión.
 * Evalúa las palabras clave del usuario contra la estructura de nodos indexados sin usar IA.
 */

import { IDecisionNode } from './DocumentTreeParser';

export interface IMatchResult {
  matchedNode: IDecisionNode | null;
  confidenceScore: number;
  isFallback: boolean;
}

export class DecisionTreeMatcher {
  /**
   * Busca el mejor nodo de respuesta dentro del árbol cargado para el Tenant.
   * 
   * @param userText Mensaje recibido por el usuario.
   * @param nodes Colección de nodos de decisión extraídos del documento base.
   * @returns Resultado tipado con el nodo coincidente y la puntuación de confianza.
   */
  public findBestResponse(userText: string, nodes: IDecisionNode[]): IMatchResult {
    if (!nodes || nodes.length === 0) {
      return { matchedNode: null, confidenceScore: 0, isFallback: true };
    }

    const normalizedInput = this.normalizeText(userText);
    const inputWords = new Set(normalizedInput.split(/\s+/));

    let bestNode: IDecisionNode | null = null;
    let highestScore = 0;

    for (const node of nodes) {
      let currentScore = 0;

      for (const keyword of node.triggerKeywords) {
        const normalizedKeyword = this.normalizeText(keyword);
        
        // Coincidencia exacta de frase
        if (normalizedInput.includes(normalizedKeyword)) {
          currentScore += 3;
        } 
        // Coincidencia de palabra individual
        else if (inputWords.has(normalizedKeyword)) {
          currentScore += 1;
        }
      }

      if (currentScore > highestScore) {
        highestScore = currentScore;
        bestNode = node;
      }
    }

    // Umbral mínimo de confianza para evitar falsos positivos
    if (bestNode && highestScore >= 1) {
      return {
        matchedNode: bestNode,
        confidenceScore: highestScore,
        isFallback: false,
      };
    }

    return {
      matchedNode: null,
      confidenceScore: 0,
      isFallback: true,
    };
  }

  /**
   * Normaliza cadenas de texto eliminando acentos, caracteres especiales y mayúsculas.
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }
}
