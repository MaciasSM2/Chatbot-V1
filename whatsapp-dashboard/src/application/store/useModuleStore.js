import { create } from 'zustand';
import { getApiUrl, executeSecureRequest } from '../../core/apiClient';

export const useModuleStore = create((set, get) => ({
  modules: [],
  auditLogs: [],
  isLoading: false,
  error: null,

  isModuleEnabled: (id) => {
    const modules = get().modules;
    const mod = modules.find(m => m.id === id);
    return mod ? !!(mod.is_enabled || mod.active) : false;
  },

  loadModules: async () => {
    set({ isLoading: true });
    try {
      const result = await executeSecureRequest(`${getApiUrl()}/admin/settings/modules`, {
        credentials: 'include'
      });

      const data = result.data || result;
      const mappedData = data.map(m => ({
        ...m,
        active: !!m.is_enabled
      }));
      set({ modules: mappedData, error: null });
    } catch (err) {
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
      const result = await executeSecureRequest(`${getApiUrl()}/admin/settings/modules/audit`, {
        credentials: 'include'
      });
      const auditData = result.data || result;
      set({ auditLogs: auditData });
    } catch (err) {
      console.error("[useModuleStore] Error cargando logs de auditoría:", err);
    }
  },

  toggleModule: async (id, status, adminName) => {
    const current = get().modules.find(m => m.id === id);
    const currentStatus = current ? !!(current.active || current.is_enabled) : false;
    const targetStatus = status === currentStatus ? !currentStatus : !!status;

    set(state => ({
      modules: state.modules.map(m => m.id === id ? { ...m, is_enabled: targetStatus, active: targetStatus } : m)
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
      set(state => ({
        modules: state.modules.map(m => m.id === id ? { ...m, is_enabled: !targetStatus, active: !targetStatus } : m)
      }));
    }
  }
}));
