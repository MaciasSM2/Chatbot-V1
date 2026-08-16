import { create } from 'zustand';
import { getApiUrl, executeSecureRequest } from '../../core/apiClient';

interface ModuleItem {
  id: string;
  is_enabled?: boolean;
  active?: boolean;
  [key: string]: any;
}

interface ModuleStoreState {
  modules: ModuleItem[];
  auditLogs: any[];
  isLoading: boolean;
  error: string | null;
  isModuleEnabled: (id: string) => boolean;
  loadModules: () => Promise<void>;
  fetchModules: () => Promise<void>;
  loadAuditLogs: () => Promise<void>;
  toggleModule: (id: string, status: boolean, adminName?: string) => Promise<void>;
}

export const useModuleStore = create<ModuleStoreState>((set, get) => ({
  modules: [],
  auditLogs: [],
  isLoading: false,
  error: null,

  isModuleEnabled: (id: string) => {
    const mod = get().modules.find((m: ModuleItem) => m.id === id);
    return mod ? !!(mod.is_enabled || mod.active) : false;
  },

  loadModules: async () => {
    set({ isLoading: true });
    try {
      const result: any = await executeSecureRequest(`${getApiUrl()}/admin/settings/modules`, {
        credentials: 'include'
      });

      const rawData = result.data || result;
      const data = Array.isArray(rawData) ? rawData : [];
      const mappedData = data.map((m: ModuleItem) => ({
        ...m,
        active: !!m.is_enabled
      }));
      set({ modules: mappedData, error: null });
    } catch (err: any) {
      console.error("[useModuleStore] Error cargando módulos:", err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchModules: async () => {
    await get().loadModules();
  },

  loadAuditLogs: async () => {
    try {
      const result: any = await executeSecureRequest(`${getApiUrl()}/admin/settings/modules/audit`, {
        credentials: 'include'
      });
      const rawAuditData = result.data || result;
      const auditData = Array.isArray(rawAuditData) ? rawAuditData : [];
      set({ auditLogs: auditData });
    } catch (err) {
      console.error("[useModuleStore] Error cargando logs de auditoría:", err);
    }
  },

  toggleModule: async (id: string, status: boolean, adminName?: string) => {
    const current = get().modules.find((m: ModuleItem) => m.id === id);
    const currentStatus = current ? !!(current.active || current.is_enabled) : false;
    const targetStatus = status === currentStatus ? !currentStatus : !!status;

    set((state: ModuleStoreState) => ({
      modules: state.modules.map((m: ModuleItem) => m.id === id ? { ...m, is_enabled: targetStatus, active: targetStatus } : m)
    }));

    try {
      await executeSecureRequest(`${getApiUrl()}/admin/settings/modules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_enabled: targetStatus, adminName })
      });

      await get().loadAuditLogs();
    } catch (err) {
      console.error("[useModuleStore] Error actualizando módulo:", err);
      set((state: ModuleStoreState) => ({
        modules: state.modules.map((m: ModuleItem) => m.id === id ? { ...m, is_enabled: !targetStatus, active: !targetStatus } : m)
      }));
    }
  }
}));
