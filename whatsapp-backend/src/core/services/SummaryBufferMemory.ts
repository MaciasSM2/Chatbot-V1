/**
 * @file SummaryBufferMemory.ts
 * @description Administrador de memoria conversacional basado en la técnica Summary Buffer.
 * Mantiene un resumen acumulativo de las interacciones anteriores para evitar enviar todo el historial de chat.
 */

import { ITenantRepository } from '../interfaces/repositories/ITenantRepository';

export class SummaryBufferMemory {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  /**
   * Obtiene el resumen histórico activo para una sesión específica.
   */
  public async getSummary(tenantId: string, userPhone: string): Promise<string> {
    const activeSummary = await this.tenantRepository.getConversationSummary(tenantId, userPhone);
    return activeSummary || 'Sin historial previo. Primera interacción.';
  }

  /**
   * Actualiza el resumen de la conversación agregando el nuevo turno de diálogo de forma condensada.
   * 
   * @param tenantId Identificador del Tenant.
   * @param userPhone Teléfono del usuario.
   * @param userMessage Mensaje enviado por el usuario.
   * @param botResponse Respuesta generada por el bot.
   */
  public async updateSummary(
    tenantId: string,
    userPhone: string,
    userMessage: string,
    botResponse: string
  ): Promise<void> {
    const previousSummary = await this.getSummary(tenantId, userPhone);

    // Condensar el turno en una línea ejecutiva
    const newTurnLine = `[Usuario]: ${userMessage.substring(0, 100)} | [Bot]: ${botResponse.substring(0, 100)}`;
    
    let updatedSummary = `${previousSummary}\n${newTurnLine}`;

    // Si el resumen excede los 800 caracteres, recortar las líneas más antiguas
    if (updatedSummary.length > 800) {
      const lines = updatedSummary.split('\n');
      updatedSummary = `[Resumen anterior condensado]... \n` + lines.slice(-4).join('\n');
    }

    await this.tenantRepository.saveConversationSummary(tenantId, userPhone, updatedSummary);
  }
}
