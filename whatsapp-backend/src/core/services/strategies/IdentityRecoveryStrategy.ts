import { IBotStrategy } from "./BotStrategy.interface";
import { ISessionRepository } from "../../interfaces/repositories/ISessionRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { ChatSession } from "../../entities/ChatSession";

export class IdentityRecoveryStrategy implements IBotStrategy {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly clientRepository: IClientRepository
  ) {}

  async execute(userId: string, messageBody: string): Promise<{ nextStep: string; responseMessage: string }> {
    let session = await this.sessionRepository.findByUserId(userId);
    if (!session) {
      session = new ChatSession({
        userId,
        currentStep: "CHECKING_REGISTRATION",
        updatedAt: new Date()
      });
    }

    const input = messageBody.toLowerCase().trim();
    const currentStep = session.currentStep;

    // PASO 1: ¿Está registrado?
    if (currentStep === 'CHECKING_REGISTRATION') {
      if (input.includes('sí') || input === 'si') {
        // En la FSM, la transición real la hace MessageWorker, pero podemos cambiar el estado aquí
        // o dejar que MessageWorker haga la transición de estado basada en nextStep.
        // Espera, MessageWorker hace `session.transitionTo(nextStep)` automáticamente!
        // Así que simplemente retornamos la respuesta y el nextStep correcto.
        return {
          nextStep: 'AWAITING_ID_VERIFICATION',
          responseMessage: "¡Genial! Para validar tu identidad, por favor ingresa tu *Número de Identificación (Cédula)* sin puntos ni comas."
        };
      } else {
        // Si dice NO, mandamos a encuesta de nuevo cliente (ASKING_NAME)
        return {
          nextStep: 'ASKING_NAME',
          responseMessage: "No te preocupes. Vamos a registrarte rápidamente. ¿Cuál es tu *Nombre Completo*?"
        };
      }
    }

    // PASO 2: Validación de Cédula y Búsqueda
    if (currentStep === 'AWAITING_ID_VERIFICATION') {
      // A. Validación de Formato (Solo números)
      const onlyNumbers = /^\d+$/;
      if (!onlyNumbers.test(input)) {
        return {
          nextStep: 'AWAITING_ID_VERIFICATION',
          responseMessage: "⚠️ El formato no es válido. Por favor, ingresa solo números para tu identificación."
        };
      }

      // B. Búsqueda en Base de Datos
      const allClients = await this.clientRepository.findAll();
      const found = allClients.find(c => c.metadata?.identification === input || c.phoneNumber === userId && c.isRegistered);

      if (found) {
        // ÉXITO: Match encontrado
        // Cargamos sus datos en la sesión activa
        session.updateMetadata({
          phone: found.phoneNumber,
          fullName: found.name,
          identification: found.metadata?.identification || input,
          gender: found.metadata?.gender || 'No especificado',
          isVip: found.metadata?.isVip || false,
          lastPurchaseDate: found.metadata?.lastPurchaseDate || null,
          activeSubscription: found.metadata?.activeSubscription || null,
          totalSpent: found.metadata?.totalSpent || 0,
          loyaltyPoints: found.metadata?.loyaltyPoints || 0,
          preferredCategory: found.metadata?.preferredCategory || null,
          tags: found.metadata?.tags || [],
          city: found.metadata?.city || null
        });
        
        await this.sessionRepository.save(session);

        return {
          nextStep: 'AWAITING_MENU_OPTION',
          responseMessage: `¡Confirmado! Te he encontrado en el sistema. Hola de nuevo, *${found.name}*. 👋 ¿En qué puedo ayudarte hoy?\n\n1. Soporte Técnico\n2. Ventas\n3. Horarios`
        };
      } else {
        // FALLO: No existe en la base de datos
        return {
          nextStep: 'ASKING_NAME',
          responseMessage: "🔍 No logré encontrarte en mis registros con ese número. Vamos a crear una ficha nueva. ¿Cuál es tu *Nombre Completo*?"
        };
      }
    }

    // Fallback
    return {
      nextStep: 'ASKING_NAME',
      responseMessage: "Vamos a crear una ficha nueva. ¿Cuál es tu *Nombre Completo*?"
    };
  }
}
