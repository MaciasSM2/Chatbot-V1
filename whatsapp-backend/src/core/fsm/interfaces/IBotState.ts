/**
 * @file IBotState.ts
 * @description Contrato abstracto para los estados de la FSM (State Pattern - SOLID: O / I).
 */

import { BotState } from '../enums/BotState';

export interface IStateContext {
  readonly tenantId: string;
  readonly userPhone: string;
  readonly userText: string;
  readonly currentState: BotState;
  readonly sessionData: Record<string, unknown>;
}

export interface IStateExecutionResult {
  readonly nextState: BotState;
  readonly responseText: string;
  readonly updatedSessionData?: Record<string, unknown>;
  readonly shouldHandoverToHuman?: boolean;
}

export interface IBotState {
  readonly stateType: BotState;

  /**
   * Procesa la entrada del usuario según la responsabilidad del estado actual.
   * 
   * @param context Objeto de contexto con datos de sesión e historial.
   */
  handle(context: IStateContext): Promise<IStateExecutionResult>;
}
