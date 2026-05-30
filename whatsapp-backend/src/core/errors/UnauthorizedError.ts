/**
 * @file UnauthorizedError.ts
 * @description Excepción de dominio específica para fallos de seguridad (401).
 */

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
