/**
 * @file AdvancedCircuitBreaker.ts
 * @description Patrón de diseño estructural para prevenir fallos en cascada en servicios de IA/Bases de datos.
 */
import { ICircuitBreaker } from '../../core/interfaces/resilience/ICircuitBreaker';
import logger from '../logging/Logger';

enum CircuitState {
  CLOSED,    // Operación normal: el tráfico fluye
  OPEN,      // Infraestructura caída: se desvía el tráfico al Fallback de inmediato
  HALF_OPEN  // Periodo de prueba: verifica si el servicio se recuperó
}

export class AdvancedCircuitBreaker implements ICircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private nextAttemptTimestamp: number = 0;
  private probing: boolean = false;

  // Parámetros de umbral configurables (Inyección por constructor - OCP)
  constructor(
    private readonly failureThreshold: number = 3,       // Intentos antes de abrir el circuito
    private readonly recoveryTimeoutMs: number = 10000   // Tiempo de espera en estado OPEN (10s)
  ) {}

  /**
   * Determina si el circuito está saludable (no está abierto).
   */
  public isHealthy(): boolean {
    this.evaluateState();
    return this.state !== CircuitState.OPEN;
  }

  /**
   * Ejecuta de forma segura protegiendo la latencia del sistema central.
   */
  public async execute<T>(action: () => Promise<T>, fallbackAction: () => Promise<T>): Promise<T> {
    this.evaluateState();

    if (this.state === CircuitState.OPEN) {
      logger.warn('[CircuitBreaker] Circuito ABIERTO. Derivando flujo al Fallback Strategy.');
      return fallbackAction();
    }

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.probing) {
        logger.warn('[CircuitBreaker] HALF_OPEN con probe activo. Derivando al Fallback.');
        return fallbackAction();
      }
      this.probing = true;
    }

    try {
      const result = await action();
      this.resetCounter();
      return result;
    } catch (error) {
      return await this.handleFailure(fallbackAction);
    }
  }

  /**
   * Evalúa transiciones de estado basadas en el tiempo transcurrido (Time-driven transition).
   */
  private evaluateState(): void {
    if (this.state === CircuitState.OPEN && Date.now() > this.nextAttemptTimestamp) {
      this.state = CircuitState.HALF_OPEN;
      this.probing = false;
      logger.info('[CircuitBreaker] Pasando a estado HALF_OPEN. Probando salud del servicio.');
    }
  }

  /**
   * Registra el fallo, incrementa métricas e intercepta la excepción para evitar pánico en el runtime.
   */
  private async handleFailure<T>(fallbackAction: () => Promise<T>): Promise<T> {
    this.failureCount++;
    this.probing = false;
    logger.error(`[CircuitBreaker] Fallo registrado (${this.failureCount}/${this.failureThreshold}).`);

    if (this.failureCount >= this.failureThreshold || this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTimestamp = Date.now() + this.recoveryTimeoutMs;
      logger.error('[CircuitBreaker] Umbral crítico alcanzado. Circuito ABIERTO temporalmente.');
    }

    return fallbackAction();
  }

  private resetCounter(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.probing = false;
  }
}
