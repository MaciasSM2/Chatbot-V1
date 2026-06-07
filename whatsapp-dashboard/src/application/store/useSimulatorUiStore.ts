/**
 * @file useSimulatorUiStore.ts
 * @description Store de Zustand encargado de la gobernanza de estados visuales del simulador.
 */
import { create } from 'zustand';

interface SimulatorUiState {
  isFullScreen: boolean;
  isConfiguring: boolean;
  toggleFullScreen: () => void;
  setIsConfiguring: (val: boolean) => void;
}

export const useSimulatorUiStore = create<SimulatorUiState>((set) => ({
  isFullScreen: false,
  isConfiguring: false,
  toggleFullScreen: () => set((state) => ({ isFullScreen: !state.isFullScreen })),
  setIsConfiguring: (val) => set({ isConfiguring: val })
}));
