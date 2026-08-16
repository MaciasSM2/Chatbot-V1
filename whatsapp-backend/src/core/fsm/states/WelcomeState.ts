/**
 * @file WelcomeState.ts
 * @description Estado concreto para manejar la bienvenida y el menú principal.
 */

import { IBotState, IStateContext, IStateExecutionResult } from '../interfaces/IBotState';
import { BotState } from '../enums/BotState';

export class WelcomeState implements IBotState {
  public readonly stateType = BotState.WELCOME;

  public async handle(context: IStateContext): Promise<IStateExecutionResult> {
    const input = context.userText.trim().toLowerCase();

    if (input === '1' || input.includes('cotizar') || input.includes('flete')) {
      return {
        nextState: BotState.AWAITING_ORIGIN_CAPTURE,
        responseText: '🚚 ¡Excelente! Para calcular la liquidación SICE-TAC, por favor ingresa el **Municipio de Origen**:',
        updatedSessionData: { serviceRequested: 'LIQUIDATION' },
      };
    }

    if (input === '2' || input.includes('asesor') || input.includes('humano')) {
      return {
        nextState: BotState.HUMAN_INTERCEPTION,
        responseText: '👤 Entendido. Un asesor comercial tomará tu solicitud en breve.',
        shouldHandoverToHuman: true,
      };
    }

    const menuMessage = 
      `👋 ¡Hola! Bienvenido al servicio de atención logística.\n\n` +
      `Por favor selecciona una opción:\n` +
      `1️⃣ Liquidar flete de transporte (SICE-TAC)\n` +
      `2️⃣ Hablar con un asesor humano`;

    return {
      nextState: BotState.AWAITING_MENU_OPTION,
      responseText: menuMessage,
    };
  }
}
