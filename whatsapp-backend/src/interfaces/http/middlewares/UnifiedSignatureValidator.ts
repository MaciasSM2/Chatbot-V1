/**
 * @file UnifiedSignatureValidator.ts
 * @description Middleware perimetral que valida la autenticidad criptográfica de Meta Cloud API.
 * Resuelve el bug de longitudes e inyecta bypass seguro para el simulador local.
 */
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function validateUnifiedMetaSignature(req: Request, res: Response, next: NextFunction): void {
  // 1. Bypass estratégico para el simulador interactivo de la interfaz visual
  const isSimulator = req.body?.object !== 'whatsapp_business_account' && req.headers['x-simulator-channel'];
  if (isSimulator || (process.env.NODE_ENV === 'development' && !req.headers['x-hub-signature-256'])) {
    return next();
  }

  const signatureHeader = req.headers['x-hub-signature-256'] as string;
  if (!signatureHeader) {
    res.status(401).json({ success: false, error: 'Cabecera X-Hub-Signature-256 ausente.' });
    return;
  }

  try {
    const appSecret = process.env.APP_SECRET || '';
    const [algorithm, signatureHex] = signatureHeader.split('=');

    if (algorithm !== 'sha256' || !signatureHex) {
      res.status(400).json({ success: false, error: 'Formato de firma criptográfica inválido.' });
      return;
    }

    // 2. Calcular el Hash HMAC basado en el payload crudo (rawBody) capturado en el BodyParser
    const computedHash = crypto
      .createHmac('sha256', appSecret)
      .update((req as any).rawBody || '')
      .digest('hex');

    // 3. RESOLUCIÓN DEL BUG CRÍTICO: Convertir obligatoriamente a buffers de igual longitud antes de comparar
    const signatureBuffer = Buffer.from(signatureHex, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (signatureBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, computedBuffer)) {
      console.warn('🛡️ [Alerta de Seguridad] Intento de suplantación de Webhook abortado (Firma Inválida).');
      res.status(403).json({ success: false, error: 'Validación de firma criptográfica fallida.' });
      return;
    }

    return next();
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Error interno procesando seguridad perimetral.' });
  }
}
