/**
 * @file TaskOrchestrator.ts
 * @description Controla y cancela procesos de respuesta del bot en tiempo real.
 */

import logger from "../../infrastructure/logging/Logger";

export class TaskOrchestrator {
  private static instance: TaskOrchestrator;
  private activeTasks = new Map<string, NodeJS.Timeout>();
  private interruptionsList: Array<{ userId: string; time: string; message: string; type: 'INTERRUPTION' | 'INFO' }> = [];

  private constructor() {}

  public static getInstance(): TaskOrchestrator {
    if (!TaskOrchestrator.instance) {
      TaskOrchestrator.instance = new TaskOrchestrator();
    }
    return TaskOrchestrator.instance;
  }

  /**
   * Registra una nueva tarea de respuesta. Si ya existe una, la cancela.
   */
  public registerTask(userId: string, task: NodeJS.Timeout) {
    if (this.activeTasks.has(userId)) {
      clearTimeout(this.activeTasks.get(userId)!);
      logger.info(`[Interruptor] 🛑 Tarea previa de ${userId} cancelada por nueva entrada.`);
      this.logEvent(userId, "Respuesta interrumpida por nuevo mensaje del usuario", "INTERRUPTION");
    }
    this.activeTasks.set(userId, task);
  }

  /**
   * Limpia la tarea cuando el bot termina de responder con éxito.
   */
  public clearTask(userId: string) {
    this.activeTasks.delete(userId);
  }

  /**
   * Agrega un evento al registro de interrupciones
   */
  public logEvent(userId: string, message: string, type: 'INTERRUPTION' | 'INFO' = 'INFO') {
    const event = {
      userId,
      time: new Date().toLocaleTimeString(),
      message,
      type
    };
    this.interruptionsList.push(event);
    if (this.interruptionsList.length > 50) {
      this.interruptionsList.shift();
    }
  }

  /**
   * Devuelve los eventos registrados para un usuario
   */
  public getEvents(userId: string) {
    return this.interruptionsList.filter(e => e.userId === userId);
  }
}
