/**
 * @file IWhatsAppGateway.ts
 * @description Interfaz pura que define las operaciones permitidas con el proveedor externo.
 * Garantiza el desacoplamiento total del negocio respecto al SDK de Meta.
 */

export interface IWhatsAppResponse {
  messageId: string;
  providerTimestamp: Date;
  status: 'sent' | 'failed';
}

export interface IWhatsAppGateway {
  /**
   * Envía un mensaje de texto plano hacia la API del proveedor.
   * @throws {Error} Si el proveedor externo rechaza la petición o está caído.
   */
  sendMessage(to: string, text: string): Promise<IWhatsAppResponse>;
}
