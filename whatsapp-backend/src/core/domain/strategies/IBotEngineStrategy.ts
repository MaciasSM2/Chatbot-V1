/**
 * @file IBotEngineStrategy.ts
 * @description Contrato estándar (SOLID - I) para los 3 motores conversacionales del sistema.
 */

export interface ITokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
}

export interface IBotResponsePayload {
  chatType: 'FULL_JS' | 'HYBRID' | 'FULL_AI';
  responseText: string;
  executionTimeMs: number;
  tokenMetrics?: ITokenMetrics;
  sourceContext?: string;
}

export interface IBotEngineStrategy {
  processMessage(
    tenantId: string,
    userPhone: string,
    userText: string,
    customApiKey?: string
  ): Promise<IBotResponsePayload>;
}
