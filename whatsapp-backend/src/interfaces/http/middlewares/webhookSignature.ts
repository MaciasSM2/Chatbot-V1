import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import logger from "../../../infrastructure/logging/Logger";

export function verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
  const APP_SECRET = process.env.APP_SECRET;

  if (!APP_SECRET) {
    if (process.env.NODE_ENV === "production") {
      logger.error("❌ ERROR CRÍTICO DE SEGURIDAD: APP_SECRET debe estar configurado en producción.");
      res.status(500).send("Security configuration error");
      return;
    }
    logger.warn("⚠️ APP_SECRET no configurado. Omitiendo validación de firma de Webhook (Modo Bypass).");
    return next();
  }

  // Detectar si es una petición del simulador/dashboard.
  // El simulador no envía el formato de Meta y no está firmado (no tiene APP_SECRET en el cliente).
  const isSimulator = req.body && req.body.object !== "whatsapp_business_account";
  if (isSimulator) {
    logger.info("ℹ️ Petición del simulador detectada. Omitiendo validación de firma.");
    return next();
  }

  const signatureHeader = req.headers["x-hub-signature-256"] as string;
  if (!signatureHeader) {
    logger.warn("❌ Firma del Webhook ausente en cabecera x-hub-signature-256.");
    res.status(401).send("Signature missing");
    return;
  }

  const parts = signatureHeader.split("=");
  const algorithm = parts[0];
  const signature = parts[1];

  if (algorithm !== "sha256" || !signature) {
    logger.warn("❌ Formato de firma del Webhook inválido.");
    res.status(401).send("Invalid signature format");
    return;
  }

  try {
    const rawBody = (req as any).rawBody || Buffer.from("");
    const hmac = crypto.createHmac("sha256", APP_SECRET);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      logger.warn("❌ Firma del Webhook no coincide con el payload esperado.");
      res.status(401).send("Signature mismatch");
      return;
    }

    next();
  } catch (error) {
    logger.error("❌ Error interno validando la firma del Webhook:", error);
    res.status(500).send("Internal validation error");
  }
}
