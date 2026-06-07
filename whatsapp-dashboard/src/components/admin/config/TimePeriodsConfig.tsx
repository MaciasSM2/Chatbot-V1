'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Save, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { LiveStatusPreview } from './LiveStatusPreview';
import { getApiUrl, executeSecureRequest } from '../../../core/apiClient';

interface TimePeriod {
  start: number;
  end: number;
  label: string;
}

interface TimePeriodsConfigData {
  EARLY_MORNING: TimePeriod;
  MORNING: TimePeriod;
  AFTERNOON: TimePeriod;
  NIGHT: TimePeriod;
}

interface TimePeriodsConfigProps {
  onSyncRequired?: () => void;
}

export const TimePeriodsConfig = ({ onSyncRequired }: TimePeriodsConfigProps) => {
  const [periods, setPeriods] = useState<TimePeriodsConfigData>({
    EARLY_MORNING: { start: 1, end: 6, label: "Madrugada" },
    MORNING: { start: 6, end: 12, label: "Mañana" },
    AFTERNOON: { start: 12, end: 19, label: "Tarde" },
    NIGHT: { start: 19, end: 1, label: "Noche" }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'tech' | 'visual'>('visual');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Colores fijos para la UI
  const colors = {
    EARLY_MORNING: '#6366f1', // Indigo
    MORNING: '#10b981',       // Emerald
    AFTERNOON: '#f59e0b',     // Amber
    NIGHT: '#1e293b'          // Slate
  };

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchTimePeriods = useCallback(async () => {
    setIsLoading(true);
    try {
      const result: any = await executeSecureRequest(`${getApiUrl()}/settings/time-periods`);
      if (result && result.EARLY_MORNING) {
        setPeriods(result);
      }
    } catch (error) {
      showToast('Error al cargar franjas horarias', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTimePeriods();
  }, [fetchTimePeriods]);

  const saveTimePeriods = async () => {
    setIsSaving(true);
    try {
      await executeSecureRequest(`${getApiUrl()}/settings/time-periods`, {
        method: 'PUT',
        body: JSON.stringify(periods)
      });
      showToast('Horarios actualizados y sincronizados', 'success');
      onSyncRequired?.();
    } catch (error) {
      showToast('Error de red al guardar franjas', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEndChange = (key: keyof TimePeriodsConfigData, newEnd: number) => {
    if (newEnd < 0 || newEnd > 23) return;
    setPeriods(prev => {
      const updated = { ...prev };
      updated[key].end = newEnd;
      // Auto-encadenamiento para mantener las 24h cubiertas
      if (key === 'EARLY_MORNING') updated.MORNING.start = newEnd;
      else if (key === 'MORNING') updated.AFTERNOON.start = newEnd;
      else if (key === 'AFTERNOON') updated.NIGHT.start = newEnd;
      else if (key === 'NIGHT') updated.EARLY_MORNING.start = newEnd;
      return updated;
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Cargando franjas horarias...</div>;
  }

  const periodsArray = [
    { id: 'EARLY_MORNING', ...periods.EARLY_MORNING, color: colors.EARLY_MORNING },
    { id: 'MORNING', ...periods.MORNING, color: colors.MORNING },
    { id: 'AFTERNOON', ...periods.AFTERNOON, color: colors.AFTERNOON },
    { id: 'NIGHT', ...periods.NIGHT, color: colors.NIGHT }
  ];

  return (
    <div className="bg-bg-panel border border-border-subtle rounded-[2rem] p-8 shadow-2xl relative overflow-hidden transition-all mt-8">
      {toast && (
        <div className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-sm font-bold ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/20' : 'bg-rose-950 text-rose-300 border border-rose-500/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Header y Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-2xl text-brand-primary border border-brand-primary/20">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-text-main tracking-tight">Gestor de Franjas Horarias</h3>
            <p className="text-xs text-text-muted">Control de ciclo diario con sincronización en tiempo real.</p>
          </div>
        </div>
        
        <div className="flex bg-bg-header p-1 rounded-lg border border-border-subtle">
          <button 
            onClick={() => setViewMode('visual')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'visual' ? 'bg-brand-primary text-background-panel shadow-md' : 'text-text-muted hover:text-text-main'}`}
          >
            Vista Visual
          </button>
          <button 
            onClick={() => setViewMode('tech')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'tech' ? 'bg-brand-primary text-background-panel shadow-md' : 'text-text-muted hover:text-text-main'}`}
          >
            Vista Técnica
          </button>
        </div>
      </div>

      {/* Vistas */}
      {viewMode === 'visual' ? (
        <div className="flex flex-col gap-6 p-8 bg-bg-header rounded-3xl border border-border-subtle shadow-inner mb-6">
          <h4 className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-6">
            Visualización del Ciclo Diario
          </h4>
          
          <div className="relative h-14 w-full bg-bg-input rounded-full flex overflow-hidden border border-border-subtle shadow-inner">
            {periodsArray.map((p) => {
              const width = p.start > p.end 
                ? ((24 - p.start + p.end) / 24) * 100 
                : ((p.end - p.start) / 24) * 100;
              
              return (
                <div 
                  key={p.id}
                  style={{ width: `${width}%`, backgroundColor: p.color }}
                  className="h-full flex items-center justify-center text-[10px] font-bold text-white shadow-inner group relative border-r border-white/20 last:border-0 hover:opacity-90 transition-opacity"
                >
                  <span className="hidden sm:block opacity-90">{p.label}</span>
                  <div className="absolute -top-10 bg-background-panel text-text-main border border-border-subtle px-2 py-1 rounded text-[10px] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {p.label}: {p.start}:00 - {p.end}:00
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[10px] text-text-muted font-mono px-2 font-bold">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:59</span>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-panel shadow-sm mb-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-header text-text-muted uppercase text-xs font-black tracking-widest border-b border-border-subtle">
              <tr>
                <th className="p-4">Periodo</th>
                <th className="p-4">Inicio (24h)</th>
                <th className="p-4">Fin (24h)</th>
                <th className="p-4 text-center">Color UI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {periodsArray.map((p) => (
                <tr key={p.id} className="hover:bg-bg-header/30 transition-colors">
                  <td className="p-4 font-bold text-text-main">{p.label}</td>
                  <td className="p-4">
                    <span className="bg-bg-input border border-border-subtle rounded px-3 py-1.5 text-text-main font-mono cursor-not-allowed inline-block w-20 text-center">
                      {p.start}:00
                    </span>
                    <span className="text-[10px] text-text-muted ml-2 block sm:inline-block mt-1 sm:mt-0 leading-tight">Calculado auto.</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <select 
                        value={p.end}
                        onChange={(e) => handleEndChange(p.id as keyof TimePeriodsConfigData, Number(e.target.value))}
                        className="bg-bg-input border border-border-subtle rounded px-2 py-1.5 w-20 font-mono text-text-main focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary cursor-pointer"
                      >
                        {Array.from({ length: 24 }).map((_, i) => (
                          i !== p.start && <option key={i} value={i} className="bg-bg-panel">{i}:00</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: p.color }} title={p.color} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-amber-950/10 p-3 text-xs text-amber-400 border-t border-border-subtle flex items-center justify-center">
            <span className="font-bold mr-1">Regla de Cierre:</span> El inicio se calcula automáticamente según el fin de la franja anterior.
          </div>
        </div>
      )}

      {/* Live Preview Box */}
      <LiveStatusPreview periods={periods} />

      {/* Footer / Botón Guardar */}
      <div className="flex justify-end pt-4 border-t border-border-subtle">
        <button
          onClick={saveTimePeriods}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer ${
            isSaving 
              ? 'bg-bg-input text-text-dim cursor-not-allowed border border-border-subtle' 
              : 'bg-brand-primary hover:bg-brand-hover text-background-panel active:scale-95'
          }`}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Save size={16} />
          )}
          <span>Guardar y Sincronizar Cambios</span>
        </button>
      </div>
    </div>
  );
};
