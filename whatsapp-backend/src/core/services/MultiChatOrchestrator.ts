/**
 * @file MultiChatOrchestrator.ts
 * @description Orquestador maestro. Despacha el mensaje hacia los 3 chats en paralelo para la vista comparativa.
 */
import { IBotEngineStrategy, IBotResponsePayload } from '../domain/strategies/IBotEngineStrategy';

export class MultiChatOrchestrator {
  constructor(
    public readonly fullJsStrategy: IBotEngineStrategy,
    public readonly hybridStrategy: IBotEngineStrategy,
    public readonly fullAiStrategy: IBotEngineStrategy
  ) {}

  /**
   * Procesa la entrada única del usuario en los 3 motores en simultáneo.
   */
  public async executeSimultaneousChats(
    tenantId: string,
    userPhone: string,
    userText: string
  ): Promise<{
    chat1Js: IBotResponsePayload;
    chat2Hybrid: IBotResponsePayload;
    chat3FullAi: IBotResponsePayload;
  }> {
    const [res1, res2, res3] = await Promise.allSettled([
      this.fullJsStrategy.processMessage(tenantId, userPhone, userText),
      this.hybridStrategy.processMessage(tenantId, userPhone, userText),
      this.fullAiStrategy.processMessage(tenantId, userPhone, userText)
    ]);

    return {
      chat1Js: res1.status === 'fulfilled' ? res1.value : this.buildErrorFallback('FULL_JS', res1.reason),
      chat2Hybrid: res2.status === 'fulfilled' ? res2.value : this.buildErrorFallback('HYBRID', res2.reason),
      chat3FullAi: res3.status === 'fulfilled' ? res3.value : this.buildErrorFallback('FULL_AI', res3.reason)
    };
  }

  private buildErrorFallback(type: 'FULL_JS' | 'HYBRID' | 'FULL_AI', error: any): IBotResponsePayload {
    return {
      chatType: type,
      responseText: `⚠️ Error de ejecución en motor ${type}: ${error?.message || 'Fallo desconocido'}`,
      executionTimeMs: 0
    };
  }
}
