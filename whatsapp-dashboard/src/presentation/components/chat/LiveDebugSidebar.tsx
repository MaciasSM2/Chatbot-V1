'use client';

/**
 * @file LiveDebugSidebar.tsx
 * @description Monitor de variables y estados internos de la simulación en tiempo real.
 */

import React from 'react';
import { Activity, Database, Cpu, AlertTriangle, ShieldCheck, Terminal, Heart, Brain } from 'lucide-react';
import { useChatStore } from '../../../application/store/useChatStore';
import { StressControlPanel } from './StressControlPanel';


export const LiveDebugSidebar = ({ currentChat, activeScenario }: { currentChat: any; activeScenario: any }) => {
  const triggerStressTest = useChatStore((state) => state.triggerStressTest);

  if (!currentChat) {
    return (
      <div className="w-80 bg-surface-panel border-l border-border-subtle flex flex-col h-full items-center justify-center p-6 text-center select-none">
        <Activity size={32} className="text-content-secondary/60 mb-3 animate-pulse" />
        <h4 className="text-xs font-bold text-content-secondary uppercase tracking-wider">Esperando Sesión...</h4>
        <p className="text-[10px] text-content-secondary/70 mt-1 max-w-[200px] leading-relaxed">
          Selecciona una conversación para activar el motor de monitoreo FSM.
        </p>
      </div>
    );
  }

  // Extraemos estado de la FSM
  const fsmState = currentChat.currentStep || activeScenario?.state || 'WELCOME';
  
  // Metadatos JSONB simulados/reales
  const jsonbMetadata = currentChat.metadata || {
    userId: currentChat.userId,
    clientName: currentChat.clientName || 'Invitado',
    isRegistered: currentChat.isRegistered,
    lastInteraction: currentChat.lastMessageTime,
    attempts: 0
  };

  const semanticIntention = currentChat.metadata?.semanticIntention;

  const isErrorInjected = activeScenario?.apiStatus && activeScenario.apiStatus !== 'SUCCESS';

  return (
    <div className="w-80 bg-surface-panel border-l border-border-subtle flex flex-col h-full overflow-hidden select-none animate-in slide-in-from-right duration-300">
      
      {/* Cabecera del Panel */}
      <div className="p-4 bg-surface-header flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-500 animate-pulse" />
          <h3 className="text-xs font-black text-content-primary uppercase tracking-wider">Motor de Simulación</h3>
        </div>
        <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full select-none tracking-wide">
          LIVE
        </span>
      </div>

      {/* Contenido con Scroll */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-surface-panel">
        
        {/* Sección 1: Estado de la FSM */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-content-secondary uppercase tracking-widest flex items-center gap-2">
            <Cpu size={13} className="text-emerald-500" /> Estado Actual (FSM)
          </label>
          <div className="bg-surface-header p-3.5 rounded-2xl border border-emerald-500/20 shadow-md transition-all duration-300 hover:border-emerald-500/40">
            <div className="flex items-center justify-between gap-2">
              <code className="text-emerald-400 text-xs font-mono font-bold">{fsmState}</code>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-[10px] text-content-secondary/70 leading-relaxed italic mt-2">
              Determina el nodo activo del árbol de decisión de saludos proactivos y seguimiento.
            </p>
          </div>
        </div>

        {/* Panel de Datos en el Sidebar: Ficha de Registro */}
        <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20 shadow-md transition-all duration-300 hover:border-emerald-500/40">
          <h4 className="text-[10px] font-black text-emerald-500 uppercase mb-3 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ficha de Registro
          </h4>
          <div className="space-y-2.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-content-secondary/70">Teléfono:</span>
              <span className="text-content-primary font-mono font-semibold">{jsonbMetadata.phone || jsonbMetadata.userId || 'Extrayendo...'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nombre:</span>
              <span className={jsonbMetadata.fullName ? 'text-emerald-400 font-bold' : 'text-rose-400/90'}>
                {jsonbMetadata.fullName || 'Pendiente'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Cédula:</span>
              <span className={jsonbMetadata.identification ? 'text-emerald-400 font-bold' : 'text-rose-400/90'}>
                {jsonbMetadata.identification || 'Pendiente'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Género:</span>
              <span className={jsonbMetadata.gender ? 'text-emerald-400 font-bold' : 'text-rose-400/90'}>
                {jsonbMetadata.gender || 'Pendiente'}
              </span>
            </div>
          </div>
        </div>

        {/* Sección de Inteligencia Semántica (Análisis de Intención) */}
        {semanticIntention && (
          <div className="space-y-2.5">
            <label className="text-[10px] font-bold text-content-secondary uppercase tracking-widest flex items-center gap-2">
              <Brain size={13} className="text-purple-400 animate-pulse" /> Análisis de Intención
            </label>
            <div className="bg-purple-500/10 border border-purple-500/20 p-3.5 rounded-2xl space-y-3 shadow-md hover:border-purple-500/40 transition-all duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Entrada:</span>
                  <span className="font-mono text-slate-200 truncate max-w-[120px]" title={semanticIntention.lastInput}>
                    &quot;{semanticIntention.lastInput}&quot;
                  </span>
                </div>
                
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-purple-300">Mejor Coincidencia:</span>
                  <span className="font-bold text-purple-400 font-mono">
                    {semanticIntention.bestMatch}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[9px] text-purple-300/80">
                    <span>Confianza / Probabilidad</span>
                    <span className="font-mono font-bold">
                      {Math.max(0, Math.round((1 - semanticIntention.distance / 10) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-500 h-full transition-all duration-500 rounded-full" 
                      style={{ width: `${Math.max(0, Math.min(100, (1 - semanticIntention.distance / 10) * 100))}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Stress Test (Caos Concurrente) */}
        <StressControlPanel onTrigger={triggerStressTest} />

        {/* Sección 2: Metadatos JSONB */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-content-secondary uppercase tracking-widest flex items-center gap-2">
            <Database size={13} className="text-sky-500" /> Persistencia JSONB (Mock/DB)
          </label>
          <div className="relative group">
            <div className="absolute top-3 right-3 p-1.5 bg-surface-panel group-hover:bg-surface-header rounded-lg border border-border-subtle text-[9px] font-mono text-content-secondary transition-colors uppercase">
              JSON
            </div>
            <pre className="bg-surface-main p-4 rounded-2xl text-[10px] text-sky-400 font-mono overflow-x-auto border border-border-subtle shadow-inner leading-relaxed custom-scrollbar max-h-64">
              {JSON.stringify(jsonbMetadata, null, 2)}
            </pre>
          </div>
          <p className="text-[10px] text-content-secondary/70 leading-relaxed italic">
            Visualización en tiempo real del registro JSONB inyectado en la sesión de pruebas.
          </p>
        </div>

        {/* Nueva Sección: Memoria de Corto Plazo (RAM) */}
        <div className="space-y-3 border-t border-border-subtle pt-5">
          <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Memoria Corto Plazo (RAM)
          </label>
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1.5 custom-scrollbar">
            {(currentChat.metadata?.messageHistory || []).map((msg: any, index: number) => (
              <div key={index} className={`p-2.5 rounded-xl text-[10px] border leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                msg.sender === 'bot' 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/15' 
                  : 'bg-sky-500/10 text-sky-300 border-sky-500/15'
              }`}>
                <span className="font-extrabold uppercase text-[8px] block opacity-50 mb-0.5 tracking-wider">
                  {msg.sender === 'bot' ? '🤖 bot' : '👤 user'}
                </span>
                {msg.text}
              </div>
            ))}
            {(!currentChat.metadata?.messageHistory || currentChat.metadata.messageHistory.length === 0) && (
              <p className="text-[10px] text-content-secondary/70 italic text-center py-4 bg-surface-main/40 rounded-xl border border-bubble-border">
                No hay mensajes en memoria...
              </p>
            )}
          </div>
        </div>

        {/* Sección 3: Alertas de Inyección */}
        {isErrorInjected ? (
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex gap-3 shadow-md animate-bounce">
            <AlertTriangle className="text-rose-500 shrink-0" size={18} />
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider">Fallo Inyectado Activo</p>
              <p className="text-[9px] text-rose-300/80 leading-relaxed mt-1">
                Simulando error <span className="font-bold text-rose-400">{activeScenario.apiStatus}</span> en Meta API. Las reintentos operan de forma resiliente.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex gap-3 shadow-sm">
            <ShieldCheck className="text-emerald-500 shrink-0" size={18} />
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Meta API Conectada</p>
              <p className="text-[9px] text-slate-400 leading-relaxed mt-1">
                Conexión simulada estable. Respuestas exitosas instantáneas (200 OK).
              </p>
            </div>
          </div>
        )}

        {/* Sección 4: Consola de Auditoría y Eventos en Vivo */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-content-secondary uppercase tracking-widest flex items-center gap-2">
            <Terminal size={13} className="text-amber-500" /> Log de Eventos en Vivo
          </label>
          <div className="bg-surface-main p-3.5 rounded-2xl border border-bubble-border text-[9px] font-mono text-content-secondary space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {(currentChat.metadata?.events || []).map((ev: any, i: number) => (
              <div key={i} className={`flex items-start gap-1.5 leading-normal animate-in fade-in slide-in-from-bottom-1 duration-150 ${
                ev.type === 'INTERRUPTION' ? 'text-rose-400 font-bold' : 'text-slate-400'
              }`}>
                <span className="text-slate-500 shrink-0">[{ev.time}]</span>
                <span className={`font-black uppercase shrink-0 ${ev.type === 'INTERRUPTION' ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`}>
                  {ev.type === 'INTERRUPTION' ? '⚠️ INTERRUPCIÓN:' : 'ℹ️ INFO:'}
                </span>
                <span className="break-words">{ev.message}</span>
              </div>
            ))}
            {(!currentChat.metadata?.events || currentChat.metadata.events.length === 0) && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <span>[{new Date().toLocaleTimeString()}]</span>
                <span>Auditoría lista. Esperando eventos de interacción...</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Pie del Panel */}
      <div className="p-4 border-t border-border-subtle bg-surface-header/30 flex items-center justify-center gap-1.5">
        <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse" />
        <p className="text-[9px] text-content-secondary/70 text-center uppercase font-black tracking-widest font-mono">
          Workbench Pro v2.0
        </p>
      </div>
    </div>
  );
};
