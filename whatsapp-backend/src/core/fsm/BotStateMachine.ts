/**
 * @file BotStateMachine.ts
 * @description Máquina de estados desacoplada que delega la ejecución al patrón Estado (State Pattern).
 */

import { BotState } from './enums/BotState';
import { IBotState, IStateContext, IStateExecutionResult } from './interfaces/IBotState';
import { WelcomeState } from './states/WelcomeState';
import { AwaitingMenuSelectionState } from './states/AwaitingMenuSelectionState';
import { ComputingLiquidationState } from './states/ComputingLiquidationState';

export class BotStateMachine {
  private readonly states: Map<BotState, IBotState> = new Map();

  constructor() {
    this.registerState(new WelcomeState());
    this.registerState(new AwaitingMenuSelectionState());
    this.registerState(new ComputingLiquidationState());
  }

  public registerState(state: IBotState): void {
    this.states.set(state.stateType, state);
  }

  public async transition(context: IStateContext): Promise<IStateExecutionResult> {
    const handler = this.states.get(context.currentState) || this.states.get(BotState.WELCOME)!;
    return handler.handle(context);
  }
}
