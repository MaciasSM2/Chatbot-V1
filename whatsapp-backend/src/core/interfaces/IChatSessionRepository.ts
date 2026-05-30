/**
 * @file IChatSessionRepository.ts
 * @description Contrato inmutable que define las operaciones permitidas sobre el caché de sesiones.
 */

import { ChatSession } from '../domain/ChatSession';

export interface IChatSessionRepository {
  /**
   * Recupera la sesión activa desde la memoria rápida.
   * Retorna null si la sesión expiró o no existe en el caché.
   */
  findById(phoneNumber: string): Promise<ChatSession | null>;

  /**
   * Persiste o actualiza de forma completa la sesión utilizando estructuras Hash.
   */
  save(session: ChatSession): Promise<void>;

  /**
   * Actualiza una propiedad específica de la sesión de manera atómica sin alterar el resto del Hash.
   */
  updateField(phoneNumber: string, field: string, value: string | number | boolean): Promise<void>;

  /**
   * Remueve de forma explícita la sesión del caché rápido (ej: al limpiar el chat).
   */
  delete(phoneNumber: string): Promise<void>;
}
