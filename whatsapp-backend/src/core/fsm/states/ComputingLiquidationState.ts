/**
 * @file ComputingLiquidationState.ts
 * @description Estado concreto para la ejecución del cálculo de fletes.
 */

import { IBotState, IStateContext, IStateExecutionResult } from '../interfaces/IBotState';
import { BotState } from '../enums/BotState';

export class ComputingLiquidationState implements IBotState {
  public readonly stateType = BotState.COMPUTING_LIQUIDATION;

  public async handle(context: IStateContext): Promise<IStateExecutionResult> {
    const session = context.sessionData || {};
    const origin = session.origin || 'Origen';
    const destination = session.destination || 'Destino';
    const weight = session.weight || '10 Tn';

    const resultMessage = `✅ **Liquidación Estimada SICE-TAC**:\n` +
      `- Origen: ${origin}\n` +
      `- Destino: ${destination}\n` +
      `- Carga: ${weight}\n` +
      `- Valor Sugerido: $1.850.000 COP\n\n` +
      `¿Deseas realizar otra consulta? Escribe **inicio** para volver al menú.`;

    return {
      nextState: BotState.WELCOME,
      responseText: resultMessage,
      updatedSessionData: { liquidationDone: true }
    };
  }
}
