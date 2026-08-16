'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { generateColorScale } from '../../core/colorScale';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  setIsDark: () => {},
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  mounted: false,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { mode, primaryColor, setMode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(mode);

    const fullScale = generateColorScale(primaryColor);
    const colors = mode === 'dark' ? fullScale.dark : fullScale.light;

    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-bg-base', colors.bgBase);
    root.style.setProperty('--theme-bg-gradient-end', colors.bgGradientEnd);
    root.style.setProperty('--theme-bg-card', colors.bgCard);
    root.style.setProperty('--theme-bg-sidebar', colors.bgSidebar);
    root.style.setProperty('--theme-bg-card-hover', colors.bgCardHover);
    root.style.setProperty('--theme-bg-input', colors.bgInput);
    root.style.setProperty('--theme-bg-header', colors.bgHeader);
    root.style.setProperty('--theme-icon-bg', colors.iconBg);
    root.style.setProperty('--theme-kpi-stripe', colors.kpiStripe);
    root.style.setProperty('--theme-avatar-bg', colors.avatarBg);
    root.style.setProperty('--theme-bubble-user', colors.bubbleUser);
    root.style.setProperty('--theme-bubble-bot', colors.bubbleBot);
    root.style.setProperty('--theme-border-subtle', colors.borderSubtle);
    root.style.setProperty('--theme-border-strong', colors.borderStrong);

    root.style.setProperty('--bg-main', colors.bgBase);
    root.style.setProperty('--bg-panel', colors.bgCard);
    root.style.setProperty('--bg-header', colors.bgHeader);
    root.style.setProperty('--bg-input', colors.bgInput);
    root.style.setProperty('--border-subtle', colors.borderSubtle);
    root.style.setProperty('--border-strong', colors.borderStrong);
    root.style.setProperty('--bubble-user', colors.bubbleUser);
    root.style.setProperty('--bubble-bot', colors.bubbleBot);
    root.style.setProperty('--brand-primary', colors.accent);
    root.style.setProperty('--brand-green', colors.accent);
    root.style.setProperty('--bg-raised', mode === 'dark' ? '#182229' : '#f7f8fa');
    root.style.setProperty('--bg-welcome', mode === 'dark' ? '#050505' : '#efeae2');
    root.style.setProperty('--separator-accent', mode === 'dark' ? '#1e293b' : '#e2e8f0');
    root.style.setProperty('--border-color', mode === 'dark'
      ? `rgba(16, 185, 129, 0.12)`
      : `rgba(15, 23, 42, 0.15)`);
    root.style.setProperty('--brand-accent', mode === 'dark' ? '#1e293b' : '#e2e8f0');
    root.style.setProperty('--text-main', mode === 'dark' ? '#f1f5f9' : '#0f172a');
    root.style.setProperty('--text-dim', mode === 'dark' ? '#88929b' : '#64748b');
    root.style.setProperty('--brand-green-hover', mode === 'dark'
      ? `color-mix(in srgb, ${colors.accent} 85%, #ffffff)`
      : `color-mix(in srgb, ${colors.accent} 85%, #000000)`);
  }, [mode, primaryColor, mounted]);

  const toggleTheme = () => setMode(mode === 'light' ? 'dark' : 'light');

  const themeValue: ThemeContextType = {
    isDark: mode === 'dark',
    setIsDark: (val) => {
      if (typeof val === 'function') {
        setMode((val as (isDark: boolean) => boolean)(mode === 'dark') ? 'dark' : 'light');
      } else {
        setMode(val ? 'dark' : 'light');
      }
    },
    theme: mode,
    setTheme: (val) => {
      if (typeof val === 'function') {
        setMode((val as (t: 'light' | 'dark') => 'light' | 'dark')(mode));
      } else {
        setMode(val);
      }
    },
    toggleTheme,
    mounted,
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="transition-colors duration-300 min-h-screen bg-surface-main text-content-primary">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
