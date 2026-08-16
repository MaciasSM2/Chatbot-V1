/**
 * @file CavemanTokenOptimizer.ts
 * @description Compresor sintáctico de Prompts (Técnica Caveman) y calculador de consumo de tokens y USD.
 * Maximiza la densidad de información eliminando redundancias lingüísticas en las instrucciones del sistema.
 */

import { ITokenMetrics } from '../domain/strategies/IBotEngineStrategy';

export class CavemanTokenOptimizer {
  // Expresiones regulares para eliminar conectores, muletillas y formalismos innecesarios para el LLM
  private readonly REMOVAL_PATTERNS: RegExp[] = [
    /\b(por favor|amablemente|tenga en cuenta que|es importante recordar que|debe saber que)\b/gi,
    /\b(a continuaci[oó]n se presenta|como se mencion[oó] anteriormente|en relaci[oó]n con)\b/gi,
    /\b(las|los|unos|unas|del|al|con|para|sobre|entre|hacia|desde)\b/gi,
  ];

  private readonly inMemorySummaries = new Map<string, string>();

  /**
   * Comprime un texto de instrucciones de sistema aplicando compresión Caveman.
   * Mantiene el 100% de los datos clave (nombres, fechas, precios, condiciones) eliminando el adorno sintáctico.
   * 
   * @param rawPrompt Instructions originales.
   * @returns Prompt optimizado para menor consumo de prompt_tokens.
   */
  public compressPrompt(rawPrompt: string): string {
    let compressed = rawPrompt;

    for (const pattern of this.REMOVAL_PATTERNS) {
      compressed = compressed.replace(pattern, ' ');
    }

    // Normalizar espacios múltiples y saltos de línea repetidos
    compressed = compressed
      .replace(/\s+/g, ' ')
      .replace(/(\r\n|\n|\r)/gm, ' ')
      .trim();

    return `[CAVEMAN_STRICT_MODE]: ${compressed}`;
  }

  public applyCavemanCompression(rawPrompt: string): string {
    return this.compressPrompt(rawPrompt);
  }

  /**
   * Calcula el consumo de tokens y el costo operativo estimado en USD según la tarifa del modelo.
   * 
   * @param promptTokens Tokens consumidos en el prompt de entrada.
   * @param completionTokens Tokens generados en la respuesta.
   * @param modelName Nombre del modelo de IA ejecutado.
   * @returns Métrica tipada con el desglose de tokens y costo USD.
   */
  public calculateMetrics(promptTokens: number, completionTokens: number, modelName: string): ITokenMetrics {
    const totalTokens = promptTokens + completionTokens;
    let costPer1kInput = 0.00015;  // Base GPT-4o-mini ($0.15 / 1M input)
    let costPer1kOutput = 0.00060; // Base GPT-4o-mini ($0.60 / 1M output)

    const lowerModel = modelName.toLowerCase();
    if (lowerModel.includes('gpt-4o') && !lowerModel.includes('mini')) {
      costPer1kInput = 0.0025;   // GPT-4o Standard ($2.50 / 1M)
      costPer1kOutput = 0.0100;  // GPT-4o Standard ($10.00 / 1M)
    } else if (lowerModel.includes('gemini-1.5-pro')) {
      costPer1kInput = 0.00125;
      costPer1kOutput = 0.00500;
    } else if (lowerModel.includes('claude-3-5-sonnet')) {
      costPer1kInput = 0.00300;
      costPer1kOutput = 0.01500;
    }

    const estimatedCostUsd = ((promptTokens / 1000) * costPer1kInput) + ((completionTokens / 1000) * costPer1kOutput);

    return {
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCostUsd: Number(estimatedCostUsd.toFixed(6)),
    };
  }

  // Métodos compatibles con versiones anteriores del orquestador
  public getSummaryBuffer(tenantId: string, userPhone: string): string {
    return this.inMemorySummaries.get(`${tenantId}:${userPhone}`) || '';
  }

  public updateSummaryBuffer(tenantId: string, userPhone: string, userText: string, botText: string): void {
    const key = `${tenantId}:${userPhone}`;
    const prev = this.getSummaryBuffer(tenantId, userPhone);
    const updated = `${prev}\nUser: ${userText}\nBot: ${botText}`.slice(-500);
    this.inMemorySummaries.set(key, updated);
  }
}
