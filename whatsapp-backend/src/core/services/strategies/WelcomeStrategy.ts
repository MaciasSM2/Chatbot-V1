import { IBotStrategy } from "./BotStrategy.interface";
import { WelcomeOrchestrator } from "../WelcomeOrchestrator";

export class WelcomeStrategy implements IBotStrategy {
  constructor(private readonly welcomeOrchestrator: WelcomeOrchestrator) {}

  async execute(userId: string, messageBody: string): Promise<{ nextStep: string; responseMessage: string }> {
    // Usamos el WelcomeOrchestrator para generar el mensaje dinámico
    const result = await this.welcomeOrchestrator.handleIncomingWelcome(userId);

    return {
      nextStep: result.expectsDataInput ? "AWAITING_NAME" : "AWAITING_MENU_OPTION",
      responseMessage: result.message
    };
  }
}
