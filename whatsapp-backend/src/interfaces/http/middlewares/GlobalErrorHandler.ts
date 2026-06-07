/**
 * @file GlobalErrorHandler.ts
 * @description Interceptor global de excepciones y formateador de logs estructurados.
 */
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../core/domain/exceptions/AppError';

/**
 * Catch-all 404 para rutas no registradas — retorna JSON en vez de texto plano.
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
};

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const isOperational = err instanceof AppError ? err.isOperational : false;

  // Log Estructurado en formato JSON ideal para herramientas de observabilidad
  const structuredLog = {
    timestamp: new Date().toISOString(),
    level: statusCode >= 500 ? 'CRITICAL' : 'WARN',
    path: req.originalUrl,
    method: req.method,
    message: err.message,
    isOperational,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };

  console.error(JSON.stringify(structuredLog));

  // Mitigar la fuga de información de infraestructura en producción
  const clientResponse = {
    success: false,
    error: isOperational ? err.message : 'Ocurrió un fallo crítico e inesperado en la plataforma central.',
    ...(process.env.NODE_ENV === 'development' && { dev_stack: err.stack }),
  };

  res.status(statusCode).json(clientResponse);
};
