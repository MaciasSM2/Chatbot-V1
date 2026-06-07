/**
 * @file ServiceUnavailableException.ts
 * @description Excepción de dominio para representar la indisponibilidad temporal de un servicio externo o base de datos.
 */
export class ServiceUnavailableException extends Error {
  constructor(serviceName: string, message: string = 'Servicio temporalmente no disponible.') {
    super(`[${serviceName}] ${message}`);
    this.name = 'ServiceUnavailableException';
    Object.setPrototypeOf(this, ServiceUnavailableException.prototype);
  }
}
