import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PRESETS } from '../../core/colorScale';

type ThemeMode = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  primaryColor: string;
  presetName: string;
  setMode: (mode: ThemeMode) => void;
  setPrimaryColor: (color: string) => void;
  setPreset: (name: string, hex: string) => void;
}

function hexToPresetName(hex: string): string {
  const match = PRESETS.find(p => p.hex.toUpperCase() === hex.toUpperCase());
  return match?.name ?? hex;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      primaryColor: '#25D366',
      presetName: 'Verde WhatsApp',
      setMode: (mode) => set({ mode }),
      setPrimaryColor: (color) => set({ primaryColor: color, presetName: hexToPresetName(color) }),
      setPreset: (name, hex) => set({ presetName: name, primaryColor: hex }),
    }),
    {
      name: 'theme-storage',
    }
  )
);
