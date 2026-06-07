/**
 * @file ThemeSwitcher.tsx
 * @description Botón animado para alternar entre modo claro y oscuro.
 * Usa `mounted` para evitar hydration mismatch en Next.js SSR.
 */
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../application/providers/ThemeContext';

export function TopBar({ operatorEmail }: { operatorEmail: string }) {
  return (
    <header className="h-16 border-b border-border-subtle bg-bg-panel/75 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-text-muted tracking-wider">
          {operatorEmail}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <ThemeSwitcher />
      </div>
    </header>
  );
}

export const ThemeSwitcher = () => {
  const { theme, toggleTheme, mounted } = useTheme();

  // Render neutral placeholder until client has hydrated
  // This ensures server HTML matches initial client render
  if (!mounted) {
    return (
      <button
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-bg-header border border-border-subtle text-text-main"
        aria-label="Cambiar tema"
        suppressHydrationWarning
      >
        <div className="relative h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-bg-header border border-border-subtle text-text-main transition-all hover:scale-110 active:scale-95 shadow-sm"
      title={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
      aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
    >
      <div className="relative h-5 w-5">
        {/* Ícono de Sol: visible solo en modo dark (para cambiar a light) */}
        <Sun
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'dark' ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
          }`}
        />
        {/* Ícono de Luna: visible solo en modo light (para cambiar a dark) */}
        <Moon
          className={`absolute inset-0 transition-all duration-500 ${
            theme === 'light' ? 'rotate-0 opacity-100' : 'rotate-90 opacity-0'
          }`}
        />
      </div>
    </button>
  );
};
