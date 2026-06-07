/**
 * @file TopBar.tsx
 * @description Barra superior maestra que incluye el título del módulo y el ThemeSwitcher.
 */
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { ThemeSwitcher } from './ThemeSwitcher';

export const TopBar = () => {
  return (
    <header className="flex h-20 items-center justify-between border-b border-border-subtle bg-bg-panel px-8 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <MessageCircle className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-black text-text-main tracking-tight uppercase">ChatBot Pro</h1>
          <p className="text-[10px] font-bold text-primary tracking-widest">MÓDULO DE SALUDO</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeSwitcher />
      </div>
    </header>
  );
};
