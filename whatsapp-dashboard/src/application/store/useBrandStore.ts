/**
 * @file useBrandStore.ts
 * @description Store Zustand con control de excepciones perimetrales, compatibilidad de métodos, inyector cromático de marca blanca, interpolación de Hex y sincronización multi-pestaña.
 */
import { create } from 'zustand';
import { executeSecureRequest, getApiUrl } from '../../core/apiClient';

// Instanciar canal de comunicación inter-procesos del navegador
let themeBroadcastChannel = typeof window !== 'undefined' ? new BroadcastChannel('prochat_theme_sync') : null;

// Interfaz que mapea exactamente el contrato del Core de Dominio del Backend
export interface BrandSettings {
  companyName: string;
  companySlogan: string | null;
  companyLogoUrl: string;
  institutionalLanguage: string;
  startWorkHour: string;
  endWorkHour: string;
  operationMode: number;
  themeAccent: string;
}

export type BrandData = BrandSettings;

interface BrandState {
  settings: BrandSettings | null;
  brandData: BrandSettings | null; // Alias de compatibilidad
  isLoading: boolean;
  isSaving: boolean;
  hasError: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  fetchBrandConfig: () => Promise<void>;
  saveSettings: (newSettings: BrandSettings) => Promise<boolean>;
  updateBrandConfig: (newSettings: BrandSettings) => Promise<boolean>;
  loadFromDatabase: () => Promise<void>;
  persistChanges: (updatedFields: BrandSettings) => Promise<boolean>;
  updateThemePalette: (newTheme: string, isDarkMode: boolean, broadcast?: boolean) => void;
  listenCrossTabChanges: () => void;
  destroyThemeChannel: () => void;
}

// Objeto de contingencia inmutable (Patrón Null Object / Fallback Seguro)
const WHITE_LABEL_FALLBACK_IDENTITY: BrandSettings = {
  companyName: 'Empresa de Logística S.A.S.',
  companySlogan: 'Despachos eficientes en territorio nacional',
  companyLogoUrl: 'https://cdn.logistica.com/default-logo.png',
  institutionalLanguage: 'Tono corporativo e institucional. Priorizar cotización guiada de fletes.',
  startWorkHour: '08:00',
  endWorkHour: '18:00',
  operationMode: 1, // Forzar modo simulador interactivo de forma segura
  themeAccent: 'WHATSAPP_GREEN'
};

export const useBrandStore = create<BrandState>((set, get) => ({
  settings: null,
  brandData: null,
  isLoading: false,
  isSaving: false,
  hasError: false,
  error: null,

  loadFromDatabase: async () => {
    set({ isLoading: true, hasError: false, error: null });
    try {
      const result = await executeSecureRequest(`${getApiUrl()}/admin/settings/brand`, {
        headers: { 'Cache-Control': 'no-cache' } as any
      });

      if (result.success && result.data) {
        set({ settings: result.data, brandData: result.data, hasError: false, error: null });
        // Disparar la inyección cromática
        const isDark = document.documentElement.classList.contains('dark');
        get().updateThemePalette(result.data.themeAccent || 'WHATSAPP_GREEN', isDark, false);
      } else {
        throw new Error('PAYLOAD_INVALID_STRUCTURE');
      }
    } catch (networkError: any) {
      console.warn('⚠️ [BrandStore Backup Active] Servidor inaccesible o error de sesión. Inyectando Fallback.');
      set({ 
        settings: WHITE_LABEL_FALLBACK_IDENTITY, 
        brandData: WHITE_LABEL_FALLBACK_IDENTITY, 
        hasError: true,
        error: networkError.message || 'Error de conexión'
      });
      const isDark = document.documentElement.classList.contains('dark');
      get().updateThemePalette(WHITE_LABEL_FALLBACK_IDENTITY.themeAccent, isDark, false);
    } finally {
      set({ isLoading: false });
    }
  },

  persistChanges: async (updatedFields: BrandSettings): Promise<boolean> => {
    set({ isSaving: true, isLoading: true, error: null });
    try {
      const result = await executeSecureRequest(`${getApiUrl()}/admin/settings/brand`, {
        method: 'PUT',
        body: JSON.stringify(updatedFields)
      });
      if (result.success) {
        set({ settings: updatedFields, brandData: updatedFields, hasError: false, error: null });
        const isDark = document.documentElement.classList.contains('dark');
        get().updateThemePalette(updatedFields.themeAccent || 'WHATSAPP_GREEN', isDark, true);
        return true;
      }
      set({ error: result.error });
      return false;
    } catch (err: any) {
      console.error('X [BrandStore] No se pudo persistir la mutación:', err);
      set({ error: err.message || 'Error de persistencia' });
      return false;
    } finally {
      set({ isSaving: false, isLoading: false });
    }
  },

  /**
   * Mapea y reescribe los tokens de colores en el elemento :root del DOM, y sincroniza las pestañas.
   */
  updateThemePalette: (newTheme: string, isDarkMode: boolean, broadcast = true) => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;

    const presets: Record<string, { baseLight: string; endLight: string; baseDark: string; endDark: string; accent: string; userBubble: string }> = {
      WHATSAPP_GREEN: { baseLight: '#F4F9F5', endLight: '#FFFFFF', baseDark: '#070A0E', endDark: '#0A2315', accent: '#25D366', userBubble: '#E2F4C5' },
      BLUE:           { baseLight: '#F0F4FA', endLight: '#FFFFFF', baseDark: '#060A12', endDark: '#0F223A', accent: '#2563EB', userBubble: '#DBEAFE' },
      PURPLE:         { baseLight: '#F5F2FA', endLight: '#FFFFFF', baseDark: '#090612', endDark: '#22123B', accent: '#8B5CF6', userBubble: '#EDE9FE' },
      RED:            { baseLight: '#FAF0F1', endLight: '#FFFFFF', baseDark: '#0C0506', endDark: '#2D0A0E', accent: '#DC2626', userBubble: '#FEE2E2' },
      CYAN:           { baseLight: '#F0F8FA', endLight: '#FFFFFF', baseDark: '#04090D', endDark: '#0A2730', accent: '#06B6D4', userBubble: '#CFFAFE' },
      GOLD:           { baseLight: '#FAF8F2', endLight: '#FFFFFF', baseDark: '#080705', endDark: '#2A200B', accent: '#EAB308', userBubble: '#FEF9C3' },
      SILVER:         { baseLight: '#F2F4F5', endLight: '#FFFFFF', baseDark: '#0B0C0E', endDark: '#1F242C', accent: '#94A3B8', userBubble: '#E2E8F0' },
      ORANGE:         { baseLight: '#FAF2EE', endLight: '#FFFFFF', baseDark: '#0C0704', endDark: '#2D1405', accent: '#F97316', userBubble: '#FFEDD5' },
      MEDITERRANEAN: { baseLight: '#F5F7F2', endLight: '#F5F5DC', baseDark: '#050E14', endDark: '#162E1A', accent: '#2E6F40', userBubble: '#E2EFE0' },
      FLORAL:         { baseLight: '#FAF0F6', endLight: '#FFFDF0', baseDark: '#0E030D', endDark: '#36082F', accent: '#EC4899', userBubble: '#FCE7F3' }
    };

    let targetTheme = presets[newTheme];

    // Si no es un preset, calcular matemáticamente las escalas desde el HEX crudo
    if (!targetTheme && newTheme.startsWith('#')) {
      const hex = newTheme;
      targetTheme = {
        baseLight: '#F8FAFC',
        endLight: '#FFFFFF',
        baseDark: '#05070A',
        endDark: `${hex}1A`, // Inyectar opacidad del 10% en formato Hex para el degradé de la noche
        accent: hex,
        userBubble: `${hex}25` // Burbuja del usuario con 15% de opacidad para garantizar lectura
      };
    }

    if (!targetTheme) return;

    // Asignación de variables CSS dinámicas en caliente
    root.style.setProperty('--theme-bg-base', isDarkMode ? targetTheme.baseDark : targetTheme.baseLight);
    root.style.setProperty('--theme-bg-gradient-end', isDarkMode ? targetTheme.endDark : targetTheme.endLight);
    root.style.setProperty('--theme-accent', targetTheme.accent);
    root.style.setProperty('--theme-bubble-user', targetTheme.userBubble);
    root.style.setProperty('--theme-bubble-bot', isDarkMode ? '#111417' : '#FFFFFF');

    // Emitir el evento de red local hacia las otras pestañas de forma instantánea
    if (broadcast && themeBroadcastChannel) {
      themeBroadcastChannel.postMessage({ themeAccent: newTheme, isDarkMode });
    }
  },

  /**
   * Escucha modificaciones de estilos originados desde otras pestañas
   */
  listenCrossTabChanges: () => {
    if (!themeBroadcastChannel) return;
    themeBroadcastChannel.onmessage = (event) => {
      const { themeAccent, isDarkMode } = event.data;
      const currentSettings = get().settings;
      if (currentSettings) {
        const updated = { ...currentSettings, themeAccent };
        set({ settings: updated, brandData: updated });
      }
      // Forzar la reescritura de variables CSS inline en la pestaña pasiva
      get().updateThemePalette(themeAccent, isDarkMode, false);
    };
  },

  destroyThemeChannel: () => {
    if (themeBroadcastChannel) {
      console.log('⏳ [Theme Engine] Purgando listeners de red local de forma segura...');
      themeBroadcastChannel.onmessage = null; // Remover la función callback de memoria
      themeBroadcastChannel.close();           // Desconectar el canal del navegador
      themeBroadcastChannel = null;            // Destrucción física del puntero
    }
  },

  // Mapeos de compatibilidad relacional y legacy (White-Label UI)
  loadSettings: async () => {
    await get().loadFromDatabase();
  },

  fetchBrandConfig: async () => {
    await get().loadFromDatabase();
  },

  saveSettings: async (newSettings: BrandSettings) => {
    return await get().persistChanges(newSettings);
  },

  updateBrandConfig: async (newSettings: BrandSettings) => {
    return await get().persistChanges(newSettings);
  }
}));
