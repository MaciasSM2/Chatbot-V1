'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Calendar, User, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import { executeSecureRequest } from '../../../core/apiClient';

interface IAuditLogNode {
  id: string;
  operator_id: string;
  action_type: 'UPDATE_THEME' | 'TOGGLE_MODULE' | 'MUTATE_HOURS' | 'FORCE_TIME_WARP';
  affected_module: string;
  ip_address: string;
  delta_diff: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  created_at: string;
}

const fetcher = (url: string) => executeSecureRequest(url);

export function AuditTimeline() {
  const { data, error, mutate } = useSWR('/api/analytics/audit-logs', fetcher);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  if (error) return <div className="p-4 font-mono text-red-400 border border-red-500/10 rounded-xl bg-red-500/5">❌ Error recuperando la bitácora inmutable.</div>;
  if (!data) return <div className="p-4 font-mono text-text-muted animate-pulse">&gt; LEYENDO LOGS FORENSES DESDE MARIADB...</div>;

  const logsCollection: IAuditLogNode[] = data.success ? (data.data?.logs || data.data || []) : [];

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* HEADER INTERNO */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-[var(--theme-accent)]" />
          <h5 className="font-black uppercase tracking-wider text-[10px] text-text-main">
            Bitácora de Trazabilidad y Auditoría de Seguridad
          </h5>
        </div>
        <button 
          type="button" 
          onClick={() => mutate()} 
          className="text-text-muted hover:text-[var(--theme-accent)] cursor-pointer p-1 transition-colors"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {logsCollection.length === 0 ? (
        <p className="text-text-muted italic py-2 font-mono">No se registran mutaciones de configuración en el ciclo actual.</p>
      ) : (
        /* VISTA DE LÍNEA DE TIEMPO VERTICAL INDESTRUCTIBLE */
        <div className="relative border-l border-[var(--border-subtle)] ml-3 pl-6 space-y-6">
          {logsCollection.map((log) => {
            const isExpanded = expandedLogId === log.id;
            
            return (
              <div key={log.id} className="relative group animate-in fade-in duration-200">
                
                {/* NODO CIRCULAR FLOTANTE DE LA LÍNEA DE TIEMPO */}
                <div className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-[#0b0c0d] border-2 border-[var(--theme-accent)] group-hover:scale-125 transition-transform" />

                <div className="bg-[#141617]/30 border border-[var(--border-subtle)] p-4 rounded-2xl space-y-3 hover:border-[var(--border-strong)] transition-all">
                  
                  {/* METADATA PRINCIPAL DEL LOG */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black uppercase tracking-widest text-[var(--theme-accent)] px-1.5 py-0.5 bg-[var(--theme-accent)]/10 rounded">
                        {log.action_type}
                      </span>
                      <span className="text-text-main font-bold truncate max-w-[140px] flex items-center gap-1">
                        <User size={11} className="text-text-muted" /> {log.operator_id}
                      </span>
                      <span className="text-text-muted font-mono bg-[#0b0c0d] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                        IP: {log.ip_address}
                      </span>
                    </div>

                    <div className="text-text-muted flex items-center gap-1 font-mono">
                      <Calendar size={11} />
                      {new Date(log.created_at).toLocaleString('es-CO')}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <p className="text-text-main font-medium">
                      Módulo Afectado: <span className="font-mono text-[10px] bg-black/20 px-1 py-0.5 rounded text-text-muted">{log.affected_module}</span>
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => toggleExpand(log.id)}
                      className="text-[var(--theme-accent)] hover:text-brand-hover font-bold uppercase tracking-wider flex items-center gap-1 text-[9px] cursor-pointer"
                    >
                      {isExpanded ? (
                        <> <EyeOff size={11} /> Ocultar Diferencial </>
                      ) : (
                        <> <Eye size={11} /> Inspeccionar Cambios </>
                      )}
                    </button>
                  </div>

                  {/* 🔄 COMPONENTE INTERACTIVO DIFF VISUALIZER DEL DELTA JSON */}
                  {isExpanded && (
                    <div className="mt-3 bg-[#0b0c0d] border border-[var(--border-subtle)] rounded-xl p-4 font-mono text-[10px] space-y-2 overflow-x-auto animate-in slide-in-from-top-2 duration-150">
                      <div>
                        <span className="text-red-400 font-bold uppercase block mb-1 tracking-widest text-[8px]">&lt; ESTADO ANTERIOR ELIMINADO &gt;</span>
                        <pre className="text-red-300 bg-red-950/20 p-2.5 rounded-lg border border-red-950/40 leading-relaxed">
                          {JSON.stringify(log.delta_diff.before, null, 2)}
                        </pre>
                      </div>
                      <div className="pt-2 border-t border-zinc-800/40">
                        <span className="text-emerald-400 font-bold uppercase block mb-1 tracking-widest text-[8px]">&lt; CONFIGURACIÓN NUEVA APLICADA &gt;</span>
                        <pre className="text-emerald-300 bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-950/40 leading-relaxed">
                          {JSON.stringify(log.delta_diff.after, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
