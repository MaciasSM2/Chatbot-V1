'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  // SSR-safe: start with 'dark' (matches server default), read localStorage after mount
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted preference only on client after hydration
    const saved =
      (localStorage.getItem('admin_theme') as 'light' | 'dark') ||
      (localStorage.getItem('theme') as 'light' | 'dark') ||
      'dark';
    setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('admin_theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const themeValue: ThemeContextType = {
    isDark: theme === 'dark',
    setIsDark: (val) => {
      if (typeof val === 'function') {
        setTheme(prev => (val as Function)(prev === 'dark') ? 'dark' : 'light');
      } else {
        setTheme(val ? 'dark' : 'light');
      }
    },
    theme,
    setTheme,
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
