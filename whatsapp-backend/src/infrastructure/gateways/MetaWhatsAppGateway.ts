/**
 * @file MetaWhatsAppGateway.ts
 * @description Implementación de producción para interactuar con la API oficial de Meta (WhatsApp Cloud API).
 */

import axios from "axios";
import { IWhatsAppGateway, IWhatsAppResponse } from "../../core/interfaces/IWhatsAppGateway";
import logger from "../logging/Logger";

export class MetaWhatsAppGateway implements IWhatsAppGateway {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(phoneNumberId: string, accessToken: string) {
    this.baseUrl = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`;
    this.token = accessToken;
  }

  async sendMessage(to: string, text: string): Promise<IWhatsAppResponse> {
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          messaging_product: "whatsapp",
          to: to,
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 segundos de timeout
        }
      );
      logger.info("Mensaje enviado vía WhatsApp Cloud API", { to });
      
      const messageId = response.data?.messages?.[0]?.id || `meta_id_${Date.now()}`;
      
      return {
        messageId,
        providerTimestamp: new Date(),
        status: 'sent'
      };
    } catch (error) {
      logger.error("Fallo al enviar mensaje vía WhatsApp Cloud API", {
        to,
        error: axios.isAxiosError(error) ? error.response?.data : error
      });
      // Mantener la semántica de la falla requerida por BullMQ
      throw new Error(`Meta API Error: ${axios.isAxiosError(error) ? error.message : String(error)}`);
    }
  }
}
