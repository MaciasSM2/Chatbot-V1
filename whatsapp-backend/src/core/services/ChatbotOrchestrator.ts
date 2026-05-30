import { IBotStrategy } from "./strategies/BotStrategy.interface";
import { WelcomeStrategy } from "./strategies/WelcomeStrategy";
import { MenuOptionStrategy } from "./strategies/MenuOptionStrategy";
import { WelcomeOrchestrator } from "./WelcomeOrchestrator";
import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { ISessionRepository } from "../interfaces/repositories/ISessionRepository";
import { RegistrationStrategy } from "./strategies/RegistrationStrategy";
import { RegistrationService } from "./RegistrationService";
import { IdentityRecoveryStrategy } from "./strategies/IdentityRecoveryStrategy";

export class ChatbotOrchestrator {
  private strategies: Map<string, IBotStrategy>;

  constructor(
    welcomeOrchestrator: WelcomeOrchestrator,
    clientRepository: IClientRepository,
    sessionRepository: ISessionRepository
  ) {
    this.strategies = new Map<string, IBotStrategy>();
    const registrationService = new RegistrationService(clientRepository);
    const registrationStrategy = new RegistrationStrategy(sessionRepository, registrationService);
    const identityRecoveryStrategy = new IdentityRecoveryStrategy(sessionRepository, clientRepository);

    // Inyectamos el WelcomeOrchestrator dentro de la WelcomeStrategy
    this.strategies.set("WELCOME", new WelcomeStrategy(welcomeOrchestrator));
    this.strategies.set("CHECKING_REGISTRATION", identityRecoveryStrategy);
    this.strategies.set("AWAITING_ID_VERIFICATION", identityRecoveryStrategy);
    this.strategies.set("ASKING_NAME", registrationStrategy);
    this.strategies.set("ASKING_ID", registrationStrategy);
    this.strategies.set("ASKING_GENDER", registrationStrategy);
    this.strategies.set("AWAITING_NAME", registrationStrategy);
    this.strategies.set("AWAITING_REGISTRATION_DATA", registrationStrategy);
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
