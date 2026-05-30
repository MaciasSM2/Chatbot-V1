import React, { useState } from 'react';
import { UserPlus, UserCheck, Clock, Calendar, Play, HelpCircle, MessageSquare, X } from 'lucide-react';

export const ConversationSetupModal = ({ onStart, onClose }) => {
  const [config, setConfig] = useState({
    profile: 'NEW', // 'NEW' o 'EXISTING'
    dayType: 'WEEKDAY',
    timePeriod: 'MORNING',
    category: 'INITIATION',
    gender: 'M'
  });

  return (
    <div className="flex items-center justify-center min-h-[500px] w-full p-4 animate-in fade-in zoom-in duration-300">
      <div className="bg-surface-panel p-6 md:p-8 rounded-3xl border border-border-subtle shadow-2xl max-w-md w-full relative overflow-hidden">
        {/* Glow de acento en fondo */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-content-secondary hover:text-content-primary hover:bg-white/5 rounded-full transition-all cursor-pointer z-10 active:scale-95"
            title="Cerrar modal"
          >
            <X size={18} />
          </button>
        )}

        <h2 className="text-xl font-extrabold text-content-primary mb-6 flex items-center gap-3 select-none">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <Play fill="currentColor" size={20} />
          </div>
          Configurar Escenario de Prueba
        </h2>

        <div className="space-y-5">
          {/* Perfil del Cliente */}
          <div>
            <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest block mb-2 select-none">Perfil del Cliente</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setConfig({...config, profile: 'NEW'})}
                className={`flex-1 p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all duration-300 cursor-pointer active:scale-95 ${
                  config.profile === 'NEW' 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.15)] font-bold' 
                    : 'bg-surface-header hover:bg-surface-header/85 border-border-subtle text-content-secondary'
                }`}
              >
                <UserPlus size={20} className={config.profile === 'NEW' ? 'animate-bounce' : ''} />
                <span className="text-[10px] font-extrabold tracking-wider">NUEVO</span>
              </button>
              <button 
                type="button"
                onClick={() => setConfig({...config, profile: 'EXISTING'})}
                className={`flex-1 p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all duration-300 cursor-pointer active:scale-95 ${
                  config.profile === 'EXISTING' 
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.15)] font-bold' 
                    : 'bg-surface-header hover:bg-surface-header/85 border-border-subtle text-content-secondary'
                }`}
              >
                <UserCheck size={20} className={config.profile === 'EXISTING' ? 'animate-bounce' : ''} />
                <span className="text-[10px] font-extrabold tracking-wider">EXISTENTE</span>
              </button>
            </div>
          </div>

          {/* Género del Cliente (Caballero / Dama) */}
          <div>
            <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest block mb-2 select-none">Trato / Género</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setConfig({...config, gender: 'M'})}
                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-95 text-xs font-bold ${
                  config.gender === 'M' 
                    ? 'bg-cyan-600/20 border-cyan-500 text-cyan-400 shadow-[0_4px_12px_rgba(6,182,212,0.15)]' 
                    : 'bg-surface-header border-border-subtle text-content-secondary'
                }`}
              >
                <span>👨 Caballero</span>
              </button>
              <button 
                type="button"
                onClick={() => setConfig({...config, gender: 'F'})}
                className={`flex-1 p-3 rounded-xl border flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer active:scale-95 text-xs font-bold ${
                  config.gender === 'F' 
                    ? 'bg-pink-600/20 border-pink-500 text-pink-400 shadow-[0_4px_12px_rgba(236,72,153,0.15)]' 
                    : 'bg-surface-header border-border-subtle text-content-secondary'
                }`}
              >
                <span>👩 Dama</span>
              </button>
            </div>
          </div>

          {/* Configuración de Calendario Colombia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest block mb-2 flex items-center gap-1 select-none">
                <Calendar size={12} /> Día de Ejecución
              </label>
              <select 
                value={config.dayType}
                onChange={(e) => setConfig({...config, dayType: e.target.value})}
                className="w-full bg-surface-header text-content-primary text-xs py-3 px-3.5 rounded-2xl border border-border-subtle focus:border-emerald-500 focus:outline-none transition-colors cursor-pointer select-none font-bold"
              >
                <option value="WEEKDAY">Día de Semana</option>
                <option value="SATURDAY_WORKABLE">Sábado Laborable</option>
                <option value="WEEKEND">Fin de Semana</option>
                <option value="HOLIDAY_NON_WORKABLE">Festivo (Colombia)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest block mb-2 flex items-center gap-1 select-none">
                <Clock size={12} /> Horario Asignado
              </label>
              <select 
                value={config.timePeriod}
                onChange={(e) => setConfig({...config, timePeriod: e.target.value})}
                className="w-full bg-surface-header text-content-primary text-xs py-3 px-3.5 rounded-2xl border border-border-subtle focus:border-emerald-500 focus:outline-none transition-colors cursor-pointer select-none font-bold"
              >
                <option value="MORNING">Mañana</option>
                <option value="AFTERNOON">Tarde</option>
                <option value="NIGHT">Noche</option>
              </select>
            </div>
          </div>

          {/* Categoría de Simulación */}
          <div>
            <label className="text-[10px] font-black text-content-secondary uppercase tracking-widest block mb-2 select-none">Categoría de Simulación</label>
            <div className="flex bg-surface-header p-1 rounded-2xl border border-border-subtle">
              <button
                type="button"
                onClick={() => setConfig({...config, category: 'INITIATION'})}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  config.category === 'INITIATION'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Inicio
              </button>
              <button
                type="button"
                onClick={() => setConfig({...config, category: 'RESPONSE'})}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  config.category === 'RESPONSE'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Respuesta
              </button>
              <button
                type="button"
                onClick={() => setConfig({...config, category: 'CONTINUITY'})}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  config.category === 'CONTINUITY'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                Continuidad
              </button>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => onStart(config)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-extrabold py-4 px-6 rounded-2xl mt-4 transition-all duration-300 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 uppercase tracking-widest active:scale-98 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            <Play fill="currentColor" size={16} />
            Iniciar Conversación
          </button>
        </div>
      </div>
    </div>
  );
};
