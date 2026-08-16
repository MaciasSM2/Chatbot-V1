/**
 * @file TokenUsageMetrics.ts
 * @description Entidad de dominio inmutable para el consumo de tokens y estimación de costos en USD.
 */

export class TokenUsageMetrics {
  public readonly promptTokens: number;
  public readonly completionTokens: number;
  public readonly totalTokens: number;
  public readonly estimatedCostUsd: number;

  constructor(data: {
    promptTokens: number;
    completionTokens: number;
    totalTokens?: number;
    estimatedCostUsd: number;
  }) {
    this.promptTokens = data.promptTokens;
    this.completionTokens = data.completionTokens;
    this.totalTokens = data.totalTokens || (data.promptTokens + data.completionTokens);
    this.estimatedCostUsd = data.estimatedCostUsd;
  }
}
