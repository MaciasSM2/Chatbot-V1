import { IBotStrategy } from "./strategies/BotStrategy.interface";
import { WelcomeStrategy } from "./strategies/WelcomeStrategy";
import { MenuOptionStrategy } from "./strategies/MenuOptionStrategy";
import { WelcomeOrchestrator } from "./WelcomeOrchestrator";
import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { NameCaptureStrategy } from "./strategies/NameCaptureStrategy";

export class ChatbotOrchestrator {
  private strategies: Map<string, IBotStrategy>;

  constructor(welcomeOrchestrator: WelcomeOrchestrator, clientRepository: IClientRepository) {
    this.strategies = new Map<string, IBotStrategy>();
    // Inyectamos el WelcomeOrchestrator dentro de la WelcomeStrategy
    this.strategies.set("WELCOME", new WelcomeStrategy(welcomeOrchestrator));
    this.strategies.set("AWAITING_NAME", new NameCaptureStrategy(clientRepository));
    this.strategies.set("AWAITING_MENU_OPTION", new MenuOptionStrategy());
  }

  public async processMessage(currentStep: string, userId: string, message: string) {
    const strategy = this.strategies.get(currentStep) || this.strategies.get("WELCOME");
    
    if (!strategy) {
      throw new Error(`No se encontró una estrategia para el estado: ${currentStep}`);
    }

    return await strategy.execute(userId, message);
  }
}
