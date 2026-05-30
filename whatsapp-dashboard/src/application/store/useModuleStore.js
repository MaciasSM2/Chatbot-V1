import { create } from 'zustand';

const API_URL = process.env.NEXT_PUBLIC_API_URL_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const normalizedApiUrl = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

// Token estático de desarrollo para pruebas de configuración
const DEV_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZG1pbklkIjoiYWRtaW4xIiwidXNlcm5hbWUiOiJTdXBlckFkbWluIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzgwMDk3Njk4LCJleHAiOjIwOTU2NzM2OTh9.cRj7JJmmhLZzXPDTgiBqVSeZqiROf_r-AlreTpf2Oj0';

export const useModuleStore = create((set, get) => ({
  modules: [],
  auditLogs: [],
  isLoading: false,
  error: null,

  loadModules: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${normalizedApiUrl}/settings/modules`, {
        headers: { 'Authorization': `Bearer ${DEV_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ modules: data, error: null });
      } else {
        throw new Error("No se pudieron cargar los módulos.");
      }
    } catch (err) {
      console.error("[useModuleStore] Error cargando módulos:", err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadAuditLogs: async () => {
    try {
      const res = await fetch(`${normalizedApiUrl}/settings/modules/audit`, {
        headers: { 'Authorization': `Bearer ${DEV_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ auditLogs: data });
      } else {
        console.error("No se pudieron cargar los logs de auditoría.");
      }
    } catch (err) {
      console.error("[useModuleStore] Error cargando logs de auditoría:", err);
    }
  },

  toggleModule: async (id, status, adminName) => {
    // Optimistic update
    set(state => ({
      modules: state.modules.map(m => m.id === id ? {...m, is_enabled: status} : m)
    }));

    try {
      const res = await fetch(`${normalizedApiUrl}/settings/modules/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEV_TOKEN}`
        },
        body: JSON.stringify({ is_enabled: status, adminName })
      });
      
      if (!res.ok) {
        throw new Error("No se pudo actualizar el módulo en el servidor.");
      }

      // Recargar logs de auditoría tras cambio exitoso
      await get().loadAuditLogs();
    } catch (err) {
      console.error("[useModuleStore] Error actualizando módulo:", err);
      // Revert optimistic update on failure
      set(state => ({
        modules: state.modules.map(m => m.id === id ? {...m, is_enabled: !status} : m)
      }));
    }
  }
}));
