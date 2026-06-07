/**
 * @file ICircuitBreaker.ts
 * @description Interfaz segregada para el control de resiliencia en operaciones I/O propensas a fallos.
 */
export interface ICircuitBreaker {
  /**
   * Ejecuta una acción protegida bajo el control del Circuit Breaker.
   * @param action Promesa de una función asíncrona a ejecutar.
   * @param fallbackAction Acción de contingencia en caso de que el circuito esté abierto o falle.
   */
  execute<T>(action: () => Promise<T>, fallbackAction: () => Promise<T>): Promise<T>;
}
