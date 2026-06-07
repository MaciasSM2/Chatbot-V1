'use client';

import React, { useEffect } from 'react';
import { useDiagnosticStore } from '../../../application/store/useDiagnosticStore';
import { Activity, Database, Cpu, Globe } from 'lucide-react';

/**
 * @file DiagnosticBar.tsx
 * @description Renderiza de forma elegante la salud de los hilos del backend.
 * Ajusta dinámicamente sus colores utilizando las variables semánticas inyectadas por el Theme Engine.
 */
export function DiagnosticBar() {
  const { systemStatus, infra, startRealtimeMonitoring, stopRealtimeMonitoring } = useDiagnosticStore();

  useEffect(() => {
    startRealtimeMonitoring();
    return () => stopRealtimeMonitoring(); // Cleanup automático al desmontar la vista
  }, [startRealtimeMonitoring, stopRealtimeMonitoring]);

  const isDegraded = systemStatus === 'DEGRADED';

  return (
    <div className={`w-full px-6 py-2 border-b transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[10px] font-mono font-bold select-none ${
      isDegraded 
        ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' 
        : 'bg-brand-primary/5 border-brand-primary/10 text-[var(--theme-accent)]'
    }`}>
      
      {/* SECCIÓN IDENTIFICADOR DE ESTADO GENERAL */}
      <div className="flex items-center gap-2">
        <Activity size={12} className={isDegraded ? 'animate-pulse' : 'animate-none'} />
        <span className="uppercase tracking-wider">DIAGNÓSTICO DEL SISTEMA:</span>
        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black tracking-widest ${
          isDegraded ? 'bg-amber-500/10 text-amber-400' : 'bg-brand-primary/10 text-brand-primary'
        }`}>
          {isDegraded ? 'Sistema Degradado' : 'Ecosistema Saludable'}
        </span>
      </div>

      {/* SECCIÓN CONSTANTES INFRAESTRUCTURA (MARIADB - REDIS - META API) */}
      <div className="flex items-center gap-4 flex-wrap">
        
        {/* INDICADOR MARIADB */}
        <div className="flex items-center gap-1.5 flex-row">
          <Database size={11} className="opacity-60" />
          <span className="opacity-60 font-sans font-medium">MariaDB:</span>
          <span className={infra.mariaDb === 'OK' ? 'text-brand-primary' : 'text-red-400'}>
            {infra.mariaDb === 'OK' ? '✓ OK' : '🗙 DOWN'}
          </span>
        </div>

        {/* INDICADOR REDIS (BULLMQ QUEUE BROKER) */}
        <div className="flex items-center gap-1.5 flex-row">
          <Cpu size={11} className="opacity-60" />
          <span className="opacity-60 font-sans font-medium">Redis (BullMQ):</span>
          <span className={infra.redis === 'OK' ? 'text-brand-primary' : 'text-red-400'}>
            {infra.redis === 'OK' ? '✓ OK' : '🗙 DOWN'}
          </span>
        </div>

        {/* INDICADOR META CLOUD API (OUTBOUND GATEWAY) */}
        <div className="flex items-center gap-1.5 flex-row">
          <Globe size={11} className="opacity-60" />
          <span className="opacity-60 font-sans font-medium">Meta API:</span>
          <span className={infra.metaApi === 'OK' ? 'text-brand-primary' : 'text-red-400'}>
            {infra.metaApi === 'OK' ? '✓ OK' : '🗙 DOWN'}
          </span>
        </div>

      </div>

      {/* SECCIÓN TELEMETRÍA DE UPTIME */}
      <div className="opacity-60 uppercase tracking-tight hidden md:block">
        Uptime Sync: <span className="font-bold">Activo</span>
      </div>
    </div>
  );
}
