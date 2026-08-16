/**
 * @file AwaitingMenuSelectionState.ts
 * @description Estado concreto para manejar la selección de opciones de menú.
 */

import { IBotState, IStateContext, IStateExecutionResult } from '../interfaces/IBotState';
import { BotState } from '../enums/BotState';

export class AwaitingMenuSelectionState implements IBotState {
  public readonly stateType = BotState.AWAITING_MENU_SELECTION;

  public async handle(context: IStateContext): Promise<IStateExecutionResult> {
    const input = context.userText.trim().toLowerCase();

    if (input === '1' || input.includes('cotizar') || input.includes('flete')) {
      return {
        nextState: BotState.AWAITING_ORIGIN_CAPTURE,
        responseText: '🚚 Por favor ingresa el **Municipio de Origen** para tu flete:',
        updatedSessionData: { serviceRequested: 'LIQUIDATION' }
      };
    }

    if (input === '2' || input.includes('asesor') || input.includes('humano')) {
      return {
        nextState: BotState.HUMAN_INTERCEPTION,
        responseText: '👤 Transfiriendo conversación a un agente humano...',
        shouldHandoverToHuman: true
      };
    }

    return {
      nextState: BotState.AWAITING_MENU_SELECTION,
      responseText: '⚠️ Opción no válida. Responde con 1️⃣ para Cotizar Flete o 2️⃣ para Asesor Humano.'
    };
  }
}
