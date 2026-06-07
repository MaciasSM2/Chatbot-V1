/**
 * @file BaseCliTask.ts
 * @description Clase abstracta base para la creación de tareas automatizadas por CLI.
 * Aplica los principios de Encapsulamiento y Abstracción de POO.
 */
import { Pool } from 'mysql2/promise';
import { dbPool } from '../database/MySQLConnection';

export abstract class BaseCliTask {
  protected contextPool: Pool;

  constructor() {
    this.contextPool = dbPool; // Asignar de forma segura el pool unificado hacia chatbot_crm_db
  }

  /**
   * Método abstracto obligatorio que define el cuerpo de ejecución del comando.
   */
  public abstract execute(): Promise<void>;
}
