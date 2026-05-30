import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { EnqueueMessageUseCase } from "../../core/usecases/EnqueueMessageUseCase";
import logger from "../../infrastructure/logging/Logger";
import { messageCounter } from "../../infrastructure/metrics/Metrics";

export class WhatsappWebhookController {
  constructor(private readonly enqueueMessageUseCase: EnqueueMessageUseCase) {}

  public async handleWebhook(req: Request, res: Response): Promise<void> {
    const correlationId = randomUUID();
    
    try {
      const body = req.body;
      let messageId: string;
      let userId: string;
      let messageBody: string;

      if (body.object === "whatsapp_business_account" && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        // Formato Real de Meta (WhatsApp Cloud API)
        const message = body.entry[0].changes[0].value.messages[0];
        messageId = message.id;
        userId = message.from;
        messageBody = message.text?.body || "";
      } else {
        // Formato del Simulador
        messageId = body.messageId || `sim_${Date.now()}`;
        userId = body.userId;
        messageBody = body.messageBody;
      }

      logger.info("Webhook recibido", {
        correlationId,
        messageId,
        userId,
        bodySize: JSON.stringify(body).length
      });

      if (!userId || messageBody === undefined || messageBody.trim() === "") {
        logger.warn("Petición de webhook inválida - Faltan parámetros o cuerpo vacío", { correlationId });
        res.status(400).send("Faltan parámetros o el mensaje está vacío");
        return;
      }

      await this.enqueueMessageUseCase.execute(messageId, userId, messageBody);
      messageCounter.inc({ status: "success" });

      res.status(200).send("EVENT_RECEIVED");
    } catch (error) {
      logger.error("Error procesando webhook", { 
        correlationId, 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
      res.status(500).send("Internal Server Error");
    }
  }

  public verifyWebhook(req: Request, res: Response): void {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "test_token";

    if (mode && token) {
      if (mode === "subscribe" && token === VERIFY_TOKEN) {
        logger.info("Webhook verificado correctamente");
        res.status(200).send(challenge);
      } else {
        logger.warn("Fallo en verificación de webhook - Token incorrecto");
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  }
}
