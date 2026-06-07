/**
 * @file CorrelationIdMiddleware.ts
 * @description Middleware encargado de estampar identificadores únicos de correlación en las cabeceras HTTP.
 * Habilita el rastreo forense end-to-end de los mensajes a través de hilos asíncronos y colas BullMQ.
 */
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export class CorrelationIdMiddleware {
  private readonly HEADER_NAME = 'x-correlation-id';

  /**
   * Intercepta la llamada HTTP y asegura la existencia inmutable del token de seguimiento.
   */
  public injectCorrelationId = (req: Request, res: Response, next: NextFunction): void => {
    const existingCorrelationId = req.headers[this.HEADER_NAME] as string | undefined;
    const activeCorrelationId = existingCorrelationId || crypto.randomUUID();

    req.headers[this.HEADER_NAME] = activeCorrelationId;
    (req as any).correlationId = activeCorrelationId;
    
    res.setHeader(this.HEADER_NAME, activeCorrelationId);

    return next();
  };
}
