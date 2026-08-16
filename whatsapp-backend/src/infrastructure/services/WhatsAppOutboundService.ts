/**
 * @file WhatsAppOutboundService.ts
 * @description Despachador oficial de salida para Meta API v21.0.
 * Incorpora el AdvancedCircuitBreaker para neutralizar bloqueos por fallos de red externos.
 */
import { IWhatsAppOutboundService } from '../../core/interfaces/services/IWhatsAppOutboundService';
import { AdvancedCircuitBreaker } from '../resilience/AdvancedCircuitBreaker';
import { CorporateFallbackService } from '../../core/services/CorporateFallbackService';
import logger from '../logging/Logger';

export class WhatsAppOutboundService implements IWhatsAppOutboundService {
  private readonly META_GRAPH_URL: string;
  private readonly ACCESS_TOKEN: string;

  constructor(
    private readonly circuitBreaker: AdvancedCircuitBreaker,
    private readonly fallbackService: CorporateFallbackService,
    private readonly phoneIdFromEnv: string
  ) {
    this.ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || '';
    this.META_GRAPH_URL = `https://graph.facebook.com/v21.0/${this.phoneIdFromEnv}/messages`;
  }

  /**
   * Despacha un mensaje de texto de WhatsApp envolviendo la petición en el cortafuegos del Circuit Breaker.
   */
  public async sendMessage(recipientPhone: string, textPayload: string): Promise<boolean> {
    
    // Ejecutar la operación de red dentro del objeto de resiliencia estructurado
    try {
      return await this.circuitBreaker.execute(
        async () => {
          return await this.dispatchHttpToFacebookCloud(recipientPhone, textPayload);
        },
        async () => {
          logger.warn(`🚨 [Circuit Breaker Open/Failed] Desviando mensaje al servicio de contingencia local.`);
          await this.fallbackService.enqueueUndeliveredMessage(recipientPhone, textPayload, 'META_GATEWAY_DOWN');
          return false;
        }
      );
    } catch (circuitException: any) {
      logger.error(`🚨 [Circuit Breaker EXCEPTION] Fallo total de ejecución: ${circuitException.message}`);
      return false; // Retorna falso para alertar de forma controlada a las colas de BullMQ
    }
  }

  /**
   * Realiza el envío físico de bytes utilizando Fetch nativo con un límite estricto de tiempo (Timeout).
   */
  private async dispatchHttpToFacebookCloud(phone: string, text: string): Promise<boolean> {
    const networkController = new AbortController();
    const timeoutTimer = setTimeout(() => networkController.abort(), 8000); // Timeout límite: 8 segundos

    try {
      const response = await fetch(this.META_GRAPH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phone,
          type: "text",
          text: { preview_url: false, body: text }
        }),
        signal: networkController.signal
      });

      clearTimeout(timeoutTimer);

      // Si Meta devuelve códigos de error de Servidor o Rate Limits, forzar el disparo del Circuit Breaker
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`META_SERVER_DEGRADED_HTTP_STATUS_${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`META_API_REJECTED_PAYLOAD_STATUS_${response.status}`);
      }

      logger.info(`✅ [Outbound Gateway Success] Mensaje enviado a Meta Cloud API v21.0 para: ${phone}`);
      return true;

    } catch (fetchError: any) {
      clearTimeout(timeoutTimer);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('META_API_NETWORK_TIMEOUT_EXCEEDED_8S');
      }
      throw fetchError;
    }
  }
}
