/**
 * @file TestSummaryStep.jsx
 * @description Componente modular para el resumen de confirmación del asistente de test.
 */

import React from 'react';
import { Play, Edit3, RotateCcw } from 'lucide-react';

export const TestSummaryStep = ({ 
  config, 
  setConfig, 
  setCurrentStep, 
  onStartTest, 
  steps, 
  initialDefaults 
}) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card de Resumen Dinámico */}
        {steps.map((step) => (
          <div key={step.id} className="bg-surface-panel p-4 rounded-2xl border border-border-subtle shadow-inner">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-emerald-500 opacity-70 scale-75 shrink-0">{step.icon}</div>
              <span className="text-[10px] font-black text-content-secondary uppercase tracking-widest">{step.title}</span>
            </div>
            <p className="text-xs font-bold text-content-primary">
              {step.options.find(o => o.value === config[step.key])?.label}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Botón Principal de Inicio */}
        <button 
          onClick={() => onStartTest(config)}
          className="w-full bg-brand-green hover:brightness-110 text-white py-5 rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/20 transition-all active:scale-95 cursor-pointer uppercase tracking-wider"
        >
          INICIAR SIMULACIÓN <Play size={16} fill="currentColor" />
        </button>

        <div className="flex gap-3">
          {/* Botón de Editar */}
          <button 
            onClick={() => setCurrentStep(0)} // Regresa al inicio manteniendo el estado
            className="flex-1 bg-surface-raised hover:bg-surface-header text-content-primary py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Edit3 size={14} /> EDITAR
          </button>

          {/* Botón de Limpiar */}
          <button 
            onClick={() => {
              setConfig(initialDefaults); // Resetea el objeto
              setCurrentStep(0); // Regresa al inicio
            }}
            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 py-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw size={14} /> LIMPIAR
          </button>
        </div>
      </div>
    </div>
  );
};
