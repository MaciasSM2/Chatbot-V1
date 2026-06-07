/**
 * @file useDiagnosticStore.ts
 * @description Store Zustand encargado de vigilar las constantes operativas del monorepo de Docker.
 */
import { create } from 'zustand';
import { executeSecureRequest, getApiUrl } from '../../core/apiClient';

interface InfraStatus {
  mariaDb: 'OK' | 'DOWN';
  redis: 'OK' | 'DOWN';
  metaApi: 'OK' | 'DOWN';
}

interface DiagnosticState {
  systemStatus: 'HEALTHY' | 'DEGRADED' | 'LOADING';
  infra: InfraStatus;
  pollingIntervalId: NodeJS.Timeout | null;
  fetchVitals: () => Promise<void>;
  startRealtimeMonitoring: () => void;
  stopRealtimeMonitoring: () => void;
}

export const useDiagnosticStore = create<DiagnosticState>((set, get) => ({
  systemStatus: 'LOADING',
  infra: { mariaDb: 'OK', redis: 'OK', metaApi: 'OK' },
  pollingIntervalId: null,

  /**
   * Ejecuta el sondeo HTTP contra el backend relacional.
   */
  fetchVitals: async () => {
    try {
      const result: any = await executeSecureRequest(`${getApiUrl()}/health`, { cache: 'no-store' as any });
      
      if (result.success && result.infrastructure) {
        set({
          systemStatus: result.status,
          infra: result.infrastructure
        });
      }
    } catch (err) {
      // Si el backend completo está caído, marcar toda la infraestructura en DOWN
      set({
        systemStatus: 'DEGRADED',
        infra: { mariaDb: 'DOWN', redis: 'DOWN', metaApi: 'DOWN' }
      });
    }
  },

  /**
   * Inicia el bucle de monitoreo cíclico cada 10 segundos.
   */
  startRealtimeMonitoring: () => {
    if (get().pollingIntervalId) return; // Evitar la duplicación de hilos timers
    
    get().fetchVitals(); // Ejecución inmediata de control inicial
    
    const interval = setInterval(() => {
      get().fetchVitals();
    }, 10 * 1000);

    set({ pollingIntervalId: interval });
  },

  /**
   * Limpia los recursos al desmontar el layout del simulador para evitar fugas de memoria.
   */
  stopRealtimeMonitoring: () => {
    const interval = get().pollingIntervalId;
    if (interval) {
      clearInterval(interval);
      set({ pollingIntervalId: null });
    }
  }
}));
