import { IBotStrategy } from "./BotStrategy.interface";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { Client } from "../../entities/Client";
import { randomUUID } from "crypto";
import { WelcomeOrchestrator } from "../WelcomeOrchestrator";

export class NameCaptureStrategy implements IBotStrategy {
  constructor(private readonly clientRepository: IClientRepository) {}

  async execute(userId: string, messageBody: string): Promise<{ nextStep: string; responseMessage: string }> {
    const userName = messageBody.trim();

    // 1. Buscamos si ya existe el cliente para conservar su UUID único original
    const existingClient = await this.clientRepository.findByPhoneNumber(userId);
    const clientId = existingClient ? existingClient.id : randomUUID();

    // Extraer género de la sesión de prueba e insertarlo en metadata
    const gender = WelcomeOrchestrator.sessionGenders.get(userId) || 'M';
    const metadata = { ...(existingClient?.metadata || {}), gender };

    // 2. Creamos/Actualizamos la entidad del cliente
    const client = new Client(
      clientId, 
      userId, // El phoneNumber es nuestro userId en este contexto
      userName, 
      true,
      metadata
    );

    // 3. Persistimos en PostgreSQL (Hará INSERT o ON CONFLICT UPDATE)
    await this.clientRepository.save(client);

    // 3. Generamos respuesta de transición
    const response = `¡Mucho gusto, ${userName}! He guardado tu perfil correctamente.\n\n` +
                     `¿En qué puedo ayudarte hoy?\n` +
                     `1. Soporte Técnico\n2. Ventas\n3. Horarios`;

    return {
      nextStep: "AWAITING_MENU_OPTION",
      responseMessage: response
    };
  }
}
