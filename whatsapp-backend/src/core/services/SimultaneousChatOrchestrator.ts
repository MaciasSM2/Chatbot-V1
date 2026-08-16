/**
 * @file SimultaneousChatOrchestrator.ts
 * @description Orquestador que delega la ejecución al motor individual o despacha de forma simultánea.
 */

import { MultiChatOrchestrator } from './MultiChatOrchestrator';
import { IBotEngineStrategy, IBotResponsePayload } from '../domain/strategies/IBotEngineStrategy';

export class SimultaneousChatOrchestrator {
  constructor(
    private readonly multiChatOrchestrator: MultiChatOrchestrator,
    private readonly jsStrategy: IBotEngineStrategy,
    private readonly hybridStrategy: IBotEngineStrategy,
    private readonly fullAiStrategy: IBotEngineStrategy
  ) {}

  public async executeSimultaneousChats(
    tenantId: string,
    userPhone: string,
    userText: string
  ) {
    return this.multiChatOrchestrator.executeSimultaneousChats(tenantId, userPhone, userText);
  }

  public async executeSingleEngine(
    tenantId: string,
    userPhone: string,
    userText: string,
    engineType: 'FULL_JS' | 'HYBRID' | 'FULL_AI'
  ): Promise<IBotResponsePayload> {
    switch (engineType) {
      case 'FULL_JS':
        return this.jsStrategy.processMessage(tenantId, userPhone, userText);
      case 'HYBRID':
        return this.hybridStrategy.processMessage(tenantId, userPhone, userText);
      case 'FULL_AI':
        return this.fullAiStrategy.processMessage(tenantId, userPhone, userText);
      default:
        return this.jsStrategy.processMessage(tenantId, userPhone, userText);
    }
  }
}
