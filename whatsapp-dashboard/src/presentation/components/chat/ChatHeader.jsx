/**
 * @file ChatHeader.jsx
 * @description Encabezado de la ventana de chat. Consume el estado derivado del timer 
 * del servidor y renderiza la alerta visual según la estrategia de urgencia.
 */

import React from 'react';
import { Clock, ShieldCheck, Hand, Bot, AlertCircle, Download } from 'lucide-react';
import { getUrgencyLevel, URGENCY_STRATEGY, formatMsToMinutes } from '../../utils/timerHelpers';
import { exportTestLogs } from '../../../application/services/exportTestLogs';

export const ChatHeader = ({
  clientName,
  phoneNumber,
  isOnline,
  continuityTimer,
  isBotPaused,
  onTogglePause,
  isTyping,
  messages = [],
  activeScenario = {},
  children
}) => {
  
  // --- Estado Derivado de la UI (No consume render loops adicionales de Zustand) ---
  const urgencyLevel = continuityTimer ? getUrgencyLevel(continuityTimer.time) : 'STABLE';
  const visualConfig = URGENCY_STRATEGY[urgencyLevel];

  // Calculamos métricas de eficiencia en tiempo real
  const userMsgs = (messages || []).filter(m => m.sender === 'user').length;
  const botMsgs = (messages || []).filter(m => m.sender === 'bot').length;
  const efficiency = botMsgs === 0 ? '0.0' : (userMsgs / botMsgs).toFixed(1);

  return (
    <div className={`text-slate-100 px-4 py-3 z-10 flex items-center justify-between border-b select-none transition-all duration-500 ease-in-out ${
      isBotPaused 
        ? 'bg-amber-950/40 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.08)]' 
        : 'bg-[#202c33]/95 backdrop-blur-md border-white/5'
    }`}>
      
      {/* Datos del Cliente */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center font-bold text-white uppercase shrink-0">
          {clientName.substring(0, 2)}
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#202c33] rounded-full animate-pulse" />
          )}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 leading-tight truncate max-w-[150px] md:max-w-[200px]">
            {clientName}
            <span title="Cliente validado en PostgreSQL" className="text-emerald-500">
              <ShieldCheck size={14} />
            </span>
          </h2>
          {isTyping ? (
            <p className="text-emerald-400 text-[11px] font-semibold animate-pulse leading-none mt-0.5">escribiendo...</p>
          ) : (
            <div className="flex items-center flex-wrap gap-2 text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
              <span>{phoneNumber}</span>
              <span className="text-slate-600">|</span>
              <span className="text-sky-400">U: {userMsgs}</span>
              <span className="text-emerald-400">B: {botMsgs}</span>
              <span className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] text-slate-300 font-bold uppercase tracking-tight">
                 Ratio: {efficiency}
              </span>
            </div>
          )}
        </div>

        {/* INDICADOR DE MODO */}
        <div className="ml-2 hidden sm:flex items-center gap-2 select-none">
          {isBotPaused ? (
            <span className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg animate-pulse">
              <AlertCircle size={12} /> Control Humano Activo
            </span>
          ) : (
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <Bot size={12} /> Bot Automatizado
            </span>
          )}
        </div>
        
        {/* Orquestación Visual del Temporizador de Backend (Redis) */}
        {continuityTimer && (
          <div className={`ml-2 flex items-center gap-2 px-3 py-1.5 border rounded-full transition-all duration-300 text-xs font-semibold ${visualConfig.containerClass}`}>
            <Clock size={12} className={`${visualConfig.pulse ? 'animate-spin [animation-duration:3s]' : ''}`} />
            <span className="tracking-tight hidden sm:inline">
              Seguimiento <span className={visualConfig.textClass}>{continuityTimer.label}</span> en:{' '}
              <span className="font-mono tracking-normal">{formatMsToMinutes(continuityTimer.time)}</span>
            </span>
            <span className="tracking-tight sm:hidden font-mono">
              {formatMsToMinutes(continuityTimer.time)}
            </span>
            <span className="relative flex h-2 w-2 ml-1 shrink-0">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${visualConfig.dotClass}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${visualConfig.dotClass.split(' ')[0]}`} />
            </span>
          </div>
        )}
      </div>

      {/* Acciones del Lado Derecho pasadas como children para no perder botones */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* BOTÓN DE ACCIÓN (EL FRENO DE MANO) */}
        <button
          onClick={onTogglePause}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all cursor-pointer active:scale-95 shadow border ${
            isBotPaused 
              ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/20 shadow-emerald-950/20' 
              : 'bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border-amber-500/10 shadow-amber-950/10'
          }`}
          title={isBotPaused ? 'Reactivar automatización del bot' : 'Pausar bot para intervenir manualmente'}
        >
          {isBotPaused ? <Bot size={14} /> : <Hand size={14} />}
          <span className="hidden md:inline">{isBotPaused ? 'REACTIVAR BOT' : 'PAUSAR BOT'}</span>
        </button>

        {/* BOTÓN DE EXPORTACIÓN */}
        <button 
           onClick={() => exportTestLogs(messages, activeScenario)}
           className="p-2 bg-[#2a3942] hover:bg-[#3b4a54] text-slate-300 rounded-xl transition-all cursor-pointer active:scale-90 border border-white/5 shadow-md flex items-center justify-center"
           title="Exportar Logs de Test (JSON)"
        >
           <Download size={16} />
        </button>

        {children}
      </div>

    </div>
  );
};
