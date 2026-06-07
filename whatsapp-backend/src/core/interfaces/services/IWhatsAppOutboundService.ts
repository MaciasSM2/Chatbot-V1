/**
 * @file IWhatsAppOutboundService.ts
 * @description Contrato abstracto para el envío de paquetes de mensajería hacia WhatsApp.
 */
export interface IWhatsAppOutboundService {
  /**
   * Despacha un mensaje de texto plano o estructurado al número del destinatario.
   * @param to Número telefónico del cliente en formato internacional (Ej: 573000000000).
   * @param text Cuerpo del mensaje generado por la FSM.
   */
  sendMessage(to: string, text: string): Promise<boolean>;
}
