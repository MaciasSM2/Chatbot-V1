/**
 * @file QuickTestBar.jsx
 * @description Barra de botones de prueba dinámicos con atajo para su gestión (CRUD).
 */

import React from 'react';
import { MousePointer2, Edit3 } from 'lucide-react';

export const QuickTestBar = ({ actions = [], onAction, onManageActions }) => {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#0b141a] border-t border-white/5 overflow-x-auto no-scrollbar select-none shrink-0">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-1 flex items-center gap-1">
        <MousePointer2 size={10} /> Test:
      </span>
      <button 
        type="button"
        onClick={onManageActions}
        className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-emerald-400 rounded-lg transition-all cursor-pointer mr-2 shrink-0 active:scale-90 border border-white/5 bg-[#1b2730]/30 hover:border-emerald-500/20 flex items-center justify-center"
        title="Gestionar Botones de Prueba (CRUD)"
      >
        <Edit3 size={11} />
      </button>

      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onAction(action)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/15 bg-amber-500/5 hover:bg-amber-500/15 text-amber-400 hover:text-amber-300 text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};
