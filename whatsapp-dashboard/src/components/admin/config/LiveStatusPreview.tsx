'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Edit3, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getApiUrl, executeSecureRequest } from '../../../core/apiClient';
import { greetingService } from '../../../core/services/GreetingApiService';

export const LiveStatusPreview = ({ periods: initialPeriods }: { periods?: any }) => {
  const [periods, setPeriods] = useState<any>(initialPeriods || null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greetings, setGreetings] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchGreetings = async () => {
      try {
        const data = await greetingService.getGreetings();
        setGreetings(data);
      } catch (err) {
        console.error('Error fetching greetings in LiveStatusPreview:', err);
      }
    };
    fetchGreetings();
  }, []);

  useEffect(() => {
    if (!initialPeriods) {
      const fetchTimePeriods = async () => {
        try {
          const result: any = await executeSecureRequest(`${getApiUrl()}/admin/settings/time-periods`);
          if (result && result.EARLY_MORNING) {
            setPeriods(result);
          }
        } catch (error) {
          console.error('Error fetching periods in LiveStatusPreview:', error);
        }
      };
      fetchTimePeriods();
    } else {
      setPeriods(initialPeriods);
    }
  }, [initialPeriods]);

  if (!periods) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-50 p-6 mt-6 transition-all hover:bg-emerald-100/50 animate-pulse text-[10px] font-bold text-emerald-600">
        Calculando franja...
      </div>
    );
  }

  const hour = currentTime.getHours();
  
  // Array format based on what TimePeriodsConfig passes down
  const periodsArray = [
    { id: 'EARLY_MORNING', ...periods.EARLY_MORNING },
    { id: 'MORNING', ...periods.MORNING },
    { id: 'AFTERNOON', ...periods.AFTERNOON },
    { id: 'NIGHT', ...periods.NIGHT }
  ];

  const activePeriod = periodsArray.find((p: any) => {
    if (p.start > p.end) return hour >= p.start || hour < p.end;
    return hour >= p.start && hour < p.end;
  }) || periodsArray[0];

  const handleNavigateToEditor = (periodId: string) => {
    router.push(`/admin/saludos?highlight=${periodId}`);
  };

  const getPreviewText = (id: string) => {
    const matched = greetings.find(
      g => g.timePeriod === id && g.dayType === 'WEEKDAY' && g.category === 'INITIATION'
    );
    if (matched && matched.text) return matched.text;

    switch (id) {
      case 'EARLY_MORNING': return "Estamos en madrugada, atendemos a las 6:00 a.m. Déjanos tu consulta.";
      case 'MORNING': return "¡Buenos días! Es un gusto saludarte. ¿En qué podemos ayudarte en esta mañana?";
      case 'AFTERNOON': return "¡Buenas tardes! ¿En qué podemos ayudarte?";
      case 'NIGHT': return "¡Buenas noches! Mañana te atenderemos con gusto al iniciar la jornada.";
      default: return "";
    }
  };

  const activeColor = activePeriod.id === 'EARLY_MORNING' ? '#6366f1' :
                      activePeriod.id === 'MORNING' ? '#10b981' :
                      activePeriod.id === 'AFTERNOON' ? '#f59e0b' : '#1e293b';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-50 p-6 mt-6 transition-all hover:bg-emerald-100/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Lado Izquierdo: Reloj y Estado */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <Clock size={16} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Estado del Sistema en Vivo</span>
          </div>
          <h2 className="text-3xl font-black text-gray-800">
            {currentTime.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: activeColor, boxShadow: `0 0 8px ${activeColor}` }} />
            <span className="text-sm font-bold text-gray-700">
              Periodo identificado: <span style={{ color: activeColor }}>{activePeriod?.label}</span>
            </span>
          </div>
        </div>

        {/* Lado Derecho: Burbuja de Previsualización */}
        <div className="flex-1 max-w-md bg-white p-5 rounded-2xl rounded-tl-none border border-gray-100 shadow-lg relative group">
          <div className="absolute -top-3 -left-3 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-sm">
            Bot respondería:
          </div>
          <p className="text-sm text-gray-500 italic leading-relaxed mt-1">
            "{getPreviewText(activePeriod.id)}"
          </p>
          
          {/* Botón de Acceso Directo al Editor */}
          <button 
            onClick={() => handleNavigateToEditor(activePeriod.id)}
            className="mt-4 pt-4 border-t border-gray-50 w-full flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-600 hover:text-emerald-500 transition-colors group cursor-pointer"
          >
            <Edit3 size={14} />
            IR AL EDITOR DE MENSAJES PARA {activePeriod?.label.toUpperCase()}
            <ChevronRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
