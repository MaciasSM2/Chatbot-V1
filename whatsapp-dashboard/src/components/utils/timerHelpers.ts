/**
 * @file timerHelpers.ts
 * @description Helpers purificados para la conversión de milisegundos y 
 * determinación del estado de alerta de la FSM de continuidad.
 */

export type UrgencyLevel = 'STABLE' | 'WARNING' | 'CRITICAL';

export interface UrgencyUIConfig {
  containerClass: string;
  dotClass: string;
  textClass: string;
  pulse: boolean;
}

// Umbrales de tiempo configurables en milisegundos
const WARNING_THRESHOLD = 30000;  // 30 segundos
const CRITICAL_THRESHOLD = 10000; // 10 segundos

/**
 * Determina el nivel de urgencia operativa basado en el tiempo restante del Job asíncrono.
 * @param {number} ms - Tiempo restante en milisegundos devuelto por Redis/BullMQ.
 * @returns {UrgencyLevel} Nivel de urgencia tipado.
 */
export const getUrgencyLevel = (ms: number): UrgencyLevel => {
  if (ms <= CRITICAL_THRESHOLD) return 'CRITICAL';
  if (ms <= WARNING_THRESHOLD) return 'WARNING';
  return 'STABLE';
};

/**
 * Diccionario de estrategias visuales que mapea el nivel de urgencia con tokens de Tailwind.
 * Aplica el principio Open/Closed.
 */
export const URGENCY_STRATEGY: Record<UrgencyLevel, UrgencyUIConfig> = {
  STABLE: {
    containerClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
    pulse: false
  },
  WARNING: {
    containerClass: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    pulse: true
  },
  CRITICAL: {
    containerClass: 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse', // Cambié animate-shake por animate-pulse porque shake no es estándar de tailwind a menos que esté en tailwind.config
    dotClass: 'bg-rose-500 scale-125 animate-ping',
    textClass: 'text-rose-400 font-black',
    pulse: true
  }
};

/**
 * Formatea un stream de milisegundos a una cadena legible estructurada en MM:SS.
 * @param {number} ms - Milisegundos a formatear.
 */
export const formatMsToMinutes = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
