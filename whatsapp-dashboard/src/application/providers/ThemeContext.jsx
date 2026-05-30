'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({ isDark: true, setIsDark: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme');
    if (saved !== null) {
      setIsDark(saved === 'dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-surface-main text-content-primary">
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark }}>
      <div className="transition-colors duration-300 min-h-screen bg-surface-main text-content-primary">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
