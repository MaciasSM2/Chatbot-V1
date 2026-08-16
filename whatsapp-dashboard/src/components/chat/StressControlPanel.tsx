/**
 * @file StressControlPanel.jsx
 * @description Panel para activar el test de estrés concurrente con 5 usuarios fantasmas.
 */

import React from 'react';
import { Zap } from 'lucide-react';

export const StressControlPanel = ({ onTrigger }: { onTrigger: () => void }) => {
  return (
    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
          <Zap size={14} className="animate-pulse" /> Stress Test (5 Users)
        </h4>
        <button 
          onClick={onTrigger}
          className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] px-3 py-1 rounded-full font-bold transition-all active:scale-95 uppercase tracking-wider"
        >
          EJECUTAR CAOS
        </button>
      </div>
      <p className="text-[9px] text-rose-300/70 leading-relaxed italic">
        Lanza 5 conversaciones paralelas con lógica de interrupción y ambigüedad para validar la integridad de la RAM local.
      </p>
    </div>
  );
};
