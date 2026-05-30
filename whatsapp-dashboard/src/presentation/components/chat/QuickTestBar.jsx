/**
 * @file QuickTestBar.jsx
 * @description Accesos directos para inyectar comportamientos de usuario comunes en la simulación.
 */

import React from 'react';
import { MousePointer2, Ghost, AlertTriangle, CreditCard, HelpCircle } from 'lucide-react';

export const QuickTestBar = ({ onAction }) => {
  const actions = [
    { 
      id: 'typo', 
      label: 'Error de Dedo', 
      icon: <AlertTriangle size={14} />, 
      payload: 'Quiero pagaar', 
      color: 'hover:bg-amber-500/20 text-amber-500' 
    },
    { 
      id: 'ghosting', 
      label: 'Simular Silencio', 
      icon: <Ghost size={14} />, 
      payload: '[TIMEOUT_TRIGGER]', 
      color: 'hover:bg-purple-500/20 text-purple-500' 
    },
    { 
      id: 'payment', 
      label: 'Comando Pago', 
      icon: <CreditCard size={14} />, 
      payload: 'Pagar mi factura', 
      color: 'hover:bg-emerald-500/20 text-emerald-500' 
    },
    { 
      id: 'confused', 
      label: 'Mensaje Aleatorio', 
      icon: <HelpCircle size={14} />, 
      payload: '¿Cuál es el sentido de la vida?', 
      color: 'hover:bg-sky-500/20 text-sky-500' 
    },
  ];

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#0b141a] border-t border-white/5 overflow-x-auto no-scrollbar select-none">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mr-2 flex items-center gap-1">
        <MousePointer2 size={10} /> Test:
      </span>
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.payload)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-[#202c33] text-[11px] font-bold transition-all active:scale-95 whitespace-nowrap cursor-pointer ${action.color}`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
};
