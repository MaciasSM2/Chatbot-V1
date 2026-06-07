/**
 * @file AppError.ts
 * @description Excepción de dominio inmutable para control semántico de fallos.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Capturar la traza de ejecución nativa omitiendo el constructor de la clase
    Error.captureStackTrace(this, this.constructor);
  }
}
