import { IBotStrategy } from "./BotStrategy.interface";
import { ISessionRepository } from "../../interfaces/repositories/ISessionRepository";
import { RegistrationService } from "../RegistrationService";
import { ChatSession } from "../../entities/ChatSession";

export class RegistrationStrategy implements IBotStrategy {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly registrationService: RegistrationService
  ) {}

  async execute(userId: string, messageBody: string): Promise<{ nextStep: string; responseMessage: string }> {
    let session = await this.sessionRepository.findByUserId(userId);
    if (!session) {
      session = new ChatSession({
        userId,
        currentStep: "AWAITING_REGISTRATION_DATA",
        updatedAt: new Date()
      });
    }

    const result = await this.registrationService.processRegistration(session, messageBody);

    return {
      nextStep: result.nextState,
      responseMessage: result.text
    };
  }
}
