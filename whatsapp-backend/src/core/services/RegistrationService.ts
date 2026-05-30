import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { Client } from "../entities/Client";
import { randomUUID } from "crypto";

export class RegistrationService {
  constructor(private readonly clientRepository: IClientRepository) {}

  public async processRegistration(
    session: any,
    userInput: string | null
  ): Promise<{ text: string; nextState: string; isComplete: boolean }> {
    const metadata = session.metadata || {};
    const currentStep = session.currentStep;

    // 1. Extraer el teléfono si no existe
    if (!metadata.phone) {
      metadata.phone = session.userId || session.phoneNumber;
    }

    // 2. Manejar la encuesta secuencial utilizando los estados ASKING_NAME, ASKING_ID y ASKING_GENDER
    if (currentStep === 'AWAITING_REGISTRATION_DATA' || currentStep === 'ASKING_NAME') {
      if (userInput && userInput.trim()) {
        metadata.fullName = userInput.trim();
        session.updateMetadata(metadata);
        return {
          text: `Entendido, *${metadata.fullName}*. Ahora, por favor indícame tu *número de identificación (Cédula)*.`,
          nextState: 'ASKING_ID',
          isComplete: false
        };
      }
      return {
        text: '¡Hola! 👋 Notamos que eres nuevo por aquí. ¿Me regalas tu Nombre Completo?',
        nextState: 'ASKING_NAME',
        isComplete: false
      };
    }

    if (currentStep === 'ASKING_ID') {
      if (userInput && userInput.trim()) {
        metadata.identification = userInput.trim();
        session.updateMetadata(metadata);
        return {
          text: 'Gracias. Por último, ¿con qué género te identificas? (Caballero / Dama)',
          nextState: 'ASKING_GENDER',
          isComplete: false
        };
      }
      return {
        text: 'Por favor, indícame tu *número de identificación (Cédula)* para continuar.',
        nextState: 'ASKING_ID',
        isComplete: false
      };
    }

    if (currentStep === 'ASKING_GENDER') {
      if (userInput && userInput.trim()) {
        metadata.gender = userInput.trim();
        session.updateMetadata(metadata);

        // Registro finalizado: persistir en PostgreSQL
        const userId = session.userId;
        const existingClient = await this.clientRepository.findByPhoneNumber(userId);
        const clientId = existingClient ? existingClient.id : randomUUID();

        const client = new Client(
          clientId,
          userId,
          metadata.fullName || 'Usuario Registrado',
          true,
          metadata
        );

        await this.clientRepository.save(client);

        return {
          text: `¡Registro exitoso, ${metadata.fullName}! 🎊 Ya puedes disfrutar de nuestra atención personalizada. ¿En qué puedo ayudarte hoy?\n\n1. Soporte Técnico\n2. Ventas\n3. Horarios`,
          nextState: 'AWAITING_MENU_OPTION',
          isComplete: true
        };
      }
      return {
        text: '¿Con qué género te identificas? (Caballero / Dama)',
        nextState: 'ASKING_GENDER',
        isComplete: false
      };
    }

    // Fallback por defecto
    return {
      text: '¡Hola! 👋 ¿Me regalas tu Nombre Completo?',
      nextState: 'ASKING_NAME',
      isComplete: false
    };
  }
}
