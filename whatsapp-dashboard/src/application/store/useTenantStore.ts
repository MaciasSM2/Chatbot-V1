/**
 * @file useTenantStore.ts
 * @description Estado global Zustand 5 para almacenar la configuración activa del Tenant y sincronización en tiempo real.
 */

import { create } from 'zustand';

export interface ITenantConfigState {
  tenantId: string;
  providerActive: string;
  selectedModel: string;
  hybridThreshold: number;
  lastUpdated: string;
  hasApiKey: boolean;
  aiModel: string;

  setTenantConfig: (config: Partial<ITenantConfigState>) => void;
  reloadConfigFromApi: (tenantId: string) => Promise<void>;
  fetchSettings: (tenantId?: string) => Promise<void>;
  saveApiKey: (apiKey: string, provider?: string, selectedModel?: string) => Promise<boolean>;
}

export const useTenantStore = create<ITenantConfigState>((set, get) => ({
  tenantId: 'tenant-demo-01',
  providerActive: 'OPENAI',
  selectedModel: 'gpt-4o-mini',
  hybridThreshold: 0.5,
  lastUpdated: new Date().toISOString(),
  hasApiKey: false,
  aiModel: 'gpt-4o-mini',

  setTenantConfig: (config) => set((state) => ({ ...state, ...config })),

  reloadConfigFromApi: async (tenantId: string) => {
    try {
      const targetId = tenantId || get().tenantId;
      const response = await fetch(`/api/v2/widget/config/${targetId}`);
      const json = await response.json();

      if (json.success && json.data) {
        set({
          tenantId: targetId,
          providerActive: json.data.providerActive || 'OPENAI',
          hasApiKey: Boolean(json.data.hasApiKey),
          aiModel: json.data.selectedModel || json.data.aiModel || 'gpt-4o-mini',
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error al re-sincronizar configuración del Tenant:', error);
    }
  },

  fetchSettings: async (tenantId?: string) => {
    const targetId = tenantId || get().tenantId;
    await get().reloadConfigFromApi(targetId);
  },

  saveApiKey: async (apiKey: string, provider = 'OPENAI', selectedModel = 'gpt-4o-mini') => {
    try {
      const res = await fetch('/api/v2/tenant/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: get().tenantId,
          provider,
          apiKey,
          selectedModel
        })
      });
      const data = await res.json();
      if (data.success) {
        set({ hasApiKey: true, aiModel: selectedModel, providerActive: provider });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}));
