/**
 * @file EventBus.ts
 * @description Central mediadora de Eventos de Dominio.
 * Implementa el patrón Observer garantizando desacoplamiento absoluto (SOLID - O).
 */
import logger from '../../../infrastructure/logging/Logger';

export interface IDomainEvent {
  eventName: string;
  occurredAt: Date;
  correlationId: string;
  payload: Record<string, any>;
}

export type EventListenerCallback = (event: IDomainEvent) => Promise<void> | void;

export class EventBus {
  private static instance: EventBus | null = null;
  private readonly listenersRegistry: Map<string, EventListenerCallback[]> = new Map();

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Registra un componente oyente vinculado a un token o acción específica del ecosistema.
   */
  public subscribe(targetEventName: string, listenerCallback: EventListenerCallback): void {
    if (!this.listenersRegistry.has(targetEventName)) {
      this.listenersRegistry.set(targetEventName, []);
    }
    this.listenersRegistry.get(targetEventName)!.push(listenerCallback);
    logger.info(`🔌 [Event Bus] Componente suscrito con éxito al evento: ${targetEventName}`);
  }

  /**
   * Despacha un evento de dominio notificando en paralelo a la totalidad de los suscriptores.
   */
  public publish(event: IDomainEvent): void {
    const activeListeners = this.listenersRegistry.get(event.eventName);
    if (!activeListeners || activeListeners.length === 0) {
      return;
    }

    activeListeners.forEach((listener) => {
      setImmediate(async () => {
        try {
          await listener(event);
        } catch (listenerException: any) {
          logger.error(`🚨 [Event Bus Crash] El oyente colapsó al procesar ${event.eventName}: ${listenerException.message}`, {
            correlationId: event.correlationId
          });
        }
      });
    });
  }
}
