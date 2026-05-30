/**
 * @file QuickTestBar.jsx
 * @description Barra de botones de prueba dinámicos con soporte para iconos de Lucide dinámicos.
 */

import React from 'react';
import { MousePointer2, Edit3, HelpCircle } from 'lucide-react';
import { ICON_LIBRARY } from './QuickActionManager';

export const QuickTestBar = ({ actions = [], onAction, onManageActions }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-surface-main border-t border-border-subtle overflow-x-auto no-scrollbar select-none shrink-0">
      <span className="text-[9px] font-black text-content-secondary/70 uppercase tracking-widest mr-1 flex items-center gap-1">
        <MousePointer2 size={10} /> Test:
      </span>
      <button 
        type="button"
        onClick={onManageActions}
        className="p-1.5 hover:bg-white/5 text-content-secondary hover:text-emerald-400 rounded-lg transition-all cursor-pointer mr-2 shrink-0 active:scale-90 border border-border-subtle bg-surface-raised/30 hover:border-emerald-500/20 flex items-center justify-center"
        title="Gestionar Botones de Prueba (CRUD)"
      >
        <Edit3 size={11} />
      </button>

      {actions.map((action) => {
        const IconComponent = ICON_LIBRARY[action.icon] || HelpCircle;

        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction(action)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/15 bg-amber-500/5 hover:bg-amber-500/15 dark:text-amber-500 text-amber-700 hover:text-amber-600 dark:hover:text-amber-300 text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm animate-in fade-in zoom-in duration-200"
          >
            <IconComponent size={13} className="opacity-80 shrink-0" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
};
