/**
 * @file IBotStrategy.ts
 * @description Interfaz pilar para el patrón Strategy. Define el comportamiento de cada paso.
 */
import { BotState } from '../enums/BotState';

export { BotState };

export interface BotContextPayload {
  clientPhone: string;
  messageText: string;
  companyName: string;
  toneProfile: number;
}

export interface FsmTransitionResult {
  nextState: BotState;
  responseMessage: string;
}

export interface IBotStrategy {
  /**
   * Ejecuta la lógica interna del paso actual del chat de forma aislada.
   * @param context Variables operativas de la interacción actual.
   */
  execute(context: BotContextPayload): Promise<FsmTransitionResult>;
}
