import { create } from 'zustand';
import { getApiUrl, executeSecureRequest } from '../../core/apiClient';

export const useModuleStore = create((set, get) => ({
  modules: [],
  auditLogs: [],
  isLoading: false,
  error: null,
  authToken: typeof window !== 'undefined' ? localStorage.getItem('admin_session_token') : null,

  authenticateAdmin: (token) => {
    if (token) {
      localStorage.setItem('admin_session_token', token);
    } else {
      localStorage.removeItem('admin_session_token');
    }
    set({ authToken: token });
  },

  setAuthToken: (token) => {
    get().authenticateAdmin(token);
  },

  isModuleEnabled: (id) => {
    const modules = get().modules;
    const mod = modules.find(m => m.id === id);
    return mod ? !!(mod.is_enabled || mod.active) : false;
  },

  loadModules: async () => {
    set({ isLoading: true });
    try {
      const headers = {};
      const token = get().authToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let result;
      try {
        result = await executeSecureRequest(`${getApiUrl()}/admin/settings/modules`, {
          headers,
          credentials: 'include'
        });
      } catch (firstErr) {
        // Auto-login fallback for ease of development/testing
        const loginResult = await executeSecureRequest(`${getApiUrl()}/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ username: 'admin', password: 'admin' }),
          credentials: 'include'
        });
        const loginData = loginResult.data || loginResult;
        if (loginData.token) {
          get().setAuthToken(loginData.token);
        }
        result = await executeSecureRequest(`${getApiUrl()}/admin/settings/modules`, {
          headers: loginData.token ? { 'Authorization': `Bearer ${loginData.token}` } : {},
          credentials: 'include'
        });
      }

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
      const headers = {};
      const token = get().authToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const result = await executeSecureRequest(`${getApiUrl()}/admin/settings/modules/audit`, {
        headers,
        credentials: 'include'
      });
      const auditData = result.data || result;
      set({ auditLogs: auditData });
    } catch (err) {
      console.error("[useModuleStore] Error cargando logs de auditoría:", err);
    }
  },

  toggleModule: async (id, status, adminName) => {
    // Resolve target status: if caller passed current state, we negate it.
    const current = get().modules.find(m => m.id === id);
    const currentStatus = current ? !!(current.active || current.is_enabled) : false;
    const targetStatus = status === currentStatus ? !currentStatus : !!status;

    set(state => ({
      modules: state.modules.map(m => m.id === id ? { ...m, is_enabled: targetStatus, active: targetStatus } : m)
    }));

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      const token = get().authToken;
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      await executeSecureRequest(`${getApiUrl()}/admin/settings/modules/${id}`, {
        method: 'PATCH',
        headers,
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
