'use client';

import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  Check, 
  Save, 
  Info, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Moon, 
  Sun,
  ShieldCheck,
  History,
  User
} from 'lucide-react';
import { useModuleStore } from '../../../application/store/useModuleStore';
import { AuditTimeline } from './AuditTimeline';

interface GlobalSettings {
  work_hours_start: string;
  work_hours_end: string;
  working_days: number[];
  timezone: string;
}

export default function ConfiguarcionAdminPage() {
  // Configuración
  const [settings, setSettings] = useState<GlobalSettings>({
    work_hours_start: '08:00',
    work_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    timezone: 'America/Bogota'
  });

  // UI States
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Time & Simulator States
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState<string>('12:00');
  const [simulatedDay, setSimulatedDay] = useState<number>(1); // Lunes por defecto

  const { modules, loadModules, toggleModule, auditLogs, loadAuditLogs } = useModuleStore();

  async function fetchSettings() {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const normalizedBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const response = await fetch(`${normalizedBaseUrl}/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings({
          work_hours_start: data.work_hours_start || '08:00',
          work_hours_end: data.work_hours_end || '18:00',
          working_days: Array.isArray(data.working_days) ? data.working_days : [1, 2, 3, 4, 5],
          timezone: data.timezone || 'America/Bogota'
        });
      } else {
        showToast('No se pudo obtener la configuración. Usando valores predeterminados.', 'error');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast('Error al conectar con el servidor.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  // Load configuration from API
  useEffect(() => {
    setTimeout(() => {
      fetchSettings();
    }, 0);
    loadModules();
    loadAuditLogs();
    
    // Timer para hora en tiempo real
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [loadModules, loadAuditLogs]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const normalizedBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const response = await fetch(`${normalizedBaseUrl}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        showToast('¡Configuración guardada exitosamente!', 'success');
      } else {
        const err = await response.json().catch(() => ({}));
        showToast(err.message || 'Error al guardar la configuración.', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Error al guardar la configuración.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }

  // Toggle single day
  const handleDayToggle = (dayIndex: number) => {
    setSettings(prev => {
      const workingDays = [...prev.working_days];
      if (workingDays.includes(dayIndex)) {
        return {
          ...prev,
          working_days: workingDays.filter(d => d !== dayIndex)
        };
      } else {
        return {
          ...prev,
          working_days: [...workingDays, dayIndex].sort()
        };
      }
    });
  };

  // Days mapping
  const daysOfWeek = [
    { label: 'D', name: 'Domingo', index: 0 },
    { label: 'L', name: 'Lunes', index: 1 },
    { label: 'M', name: 'Martes', index: 2 },
    { label: 'M', name: 'Miércoles', index: 3 },
    { label: 'J', name: 'Jueves', index: 4 },
    { label: 'V', name: 'Viernes', index: 5 },
    { label: 'S', name: 'Sábado', index: 6 }
  ];

  // Helper to check working hour bounds
  const checkStatus = (day: number, hourStr: string) => {
    const isWorkingDay = settings.working_days.includes(day);
    if (!isWorkingDay) {
      return { active: false, reason: 'Día no laborable configurado' };
    }

    const [sh, sm] = settings.work_hours_start.split(':').map(Number);
    const [eh, em] = settings.work_hours_end.split(':').map(Number);
    const [ch, cm] = hourStr.split(':').map(Number);

    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const currentMin = ch * 60 + cm;

    if (currentMin >= startMin && currentMin < endMin) {
      return { active: true, reason: 'Dentro de horario de atención' };
    } else {
      return { active: false, reason: 'Fuera de horario de atención' };
    }
  };

  // Get active status based on live or simulator
  const activeDay = isSimulatorActive ? simulatedDay : currentTime.getDay();
  const activeHourFormatted = isSimulatorActive 
    ? simulatedTime 
    : `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
  
  const statusInfo = checkStatus(activeDay, activeHourFormatted);

  // Time formatter
  const formattedRealTime = currentTime.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-gray-800 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-0 border backdrop-blur-md ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' 
            : 'bg-rose-950/90 text-rose-300 border-rose-500/40'
        }`}>
          <div className="rounded-full p-1 bg-white/10">
            {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
          </div>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold tracking-wider text-xs uppercase">
          <Sparkles size={16} className="animate-pulse" />
          <span>Fase 1: Configuración de Atención</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Configuración Dinámica del Bot</h1>
        <p className="text-gray-500 mt-1">Parametriza los rangos horarios, días de servicio activo y simula comportamientos en tiempo real.</p>
      </div>

      {isLoading ? (
        <div className="max-w-6xl mx-auto flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 text-sm font-medium">Cargando configuraciones globales...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel Principal - Formulario */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card de Configuración */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-150 relative overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Clock size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Horario de Oficina Diario</h2>
                  <p className="text-xs text-gray-400">Rango de horas en el que el bot responderá de forma activa.</p>
                </div>
              </div>

              {/* Rango de Horas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de Apertura</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={settings.work_hours_start}
                      onChange={(e) => setSettings(prev => ({ ...prev, work_hours_start: e.target.value }))}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-gray-700 bg-gray-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hora de Cierre</label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={settings.work_hours_end}
                      onChange={(e) => setSettings(prev => ({ ...prev, work_hours_end: e.target.value }))}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-semibold text-gray-700 bg-gray-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Días Laborables */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Días Habilitados de Atención</label>
                    <p className="text-xs text-gray-400">Los días seleccionados tendrán respuestas de bienvenida normales.</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full">
                    {settings.working_days.length} Habilitados
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {daysOfWeek.map((day) => {
                    const isSelected = settings.working_days.includes(day.index);
                    const isWeekend = day.index === 0 || day.index === 6;
                    return (
                      <button
                        key={day.index}
                        type="button"
                        onClick={() => handleDayToggle(day.index)}
                        className={`w-11 h-11 rounded-xl font-bold text-sm transition-all duration-200 flex flex-col items-center justify-center relative border group ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10 hover:bg-blue-700 scale-105'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                        title={day.name}
                      >
                        <span>{day.label}</span>
                        {isWeekend && (
                          <span className={`absolute bottom-0.5 text-[7px] tracking-tighter ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                            Finde
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white animate-fade-in shadow-sm">
                            <Check size={8} strokeWidth={4} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advertencia Informativa de Zonas Horarias */}
              <div className="flex gap-3 bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-6">
                <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-bold">Nota de Zona Horaria:</span> El bot procesa mensajes utilizando la zona horaria de <span className="underline font-bold">America/Bogota</span> (Colombia). Los cambios aplicados se sincronizan de inmediato en el motor del backend.
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-md ${
                    isSaving 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/15 hover:shadow-lg hover:scale-[1.01]'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Guardar Configuración</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Card de Feature Toggles */}
            <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-150 relative overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Módulos del Sistema (Feature Toggles)</h2>
                    <p className="text-xs text-gray-400">Activa o desactiva las capacidades del ecosistema en tiempo real.</p>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full tracking-wider uppercase">
                  Gestión de Módulos
                </span>
              </div>

              <div className="space-y-4">
                {modules.map((m) => {
                  // Custom description based on module ID
                  let description = "";
                  let IconComponent = ShieldCheck;
                  let colorClass = "text-indigo-600 bg-indigo-50";

                  if (m.id === 'dashboard_home') {
                    description = "Controla la visualización del panel de analíticas generales y gráficos SVG.";
                    IconComponent = Sparkles;
                    colorClass = "text-blue-600 bg-blue-50";
                  } else if (m.id === 'module_clients') {
                    description = "Gestión de clientes y bloqueo preventivo con HTTP 503 Service Unavailable en APIs.";
                    IconComponent = AlertTriangle;
                    colorClass = "text-amber-600 bg-amber-50";
                  } else if (m.id === 'module_greetings') {
                    description = "Motor de saludos secuenciales de la FSM y desvío resiliente a saludos estáticos.";
                    IconComponent = Play;
                    colorClass = "text-emerald-600 bg-emerald-50";
                  }

                  return (
                    <div 
                      key={m.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-gray-200 transition-all duration-300 gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${colorClass}`}>
                          <IconComponent size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-800 font-sans">{m.name}</h4>
                            <span className="font-mono text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200/60 font-semibold">
                              {m.id}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-md">{description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                          m.is_enabled ? 'text-emerald-600' : 'text-slate-400'
                        }`}>
                          {m.is_enabled ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await toggleModule(m.id, !m.is_enabled, 'Admin de Turno');
                              showToast(`Módulo "${m.name}" ${!m.is_enabled ? 'activado' : 'desactivado'} con éxito.`, 'success');
                            } catch (err) {
                              showToast('Error al actualizar el estado del módulo.', 'error');
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            m.is_enabled ? 'bg-emerald-500' : 'bg-slate-250'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              m.is_enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {modules.length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-xs">
                    Cargando módulos o no hay módulos disponibles.
                  </div>
                )}
              </div>
            </div>

            {/* Ficha Explicativa de Autogestión */}
            <div className="bg-slate-900 rounded-2xl p-6 shadow-md border border-slate-800 text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800 rounded-xl text-slate-200 border border-slate-700">
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Resiliencia y Fallback Activo</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Si la base de datos pierde conexión, el bot entra en modo de contingencia: Lunes a Viernes 08:00 - 18:00.</p>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold">
                  Protegido
                </span>
              </div>
            </div>

            <AuditTimeline logs={auditLogs as any} />

          </div>

          {/* Simulador y Estado en Tiempo Real (Glassmorphic Premium Card) */}
          <div className="space-y-6">
            
            {/* Contenedor del Simulador con Estética Cyberpunk/Glassmorphic */}
            <div className="bg-slate-950 text-white rounded-2xl p-6 shadow-2xl border border-slate-800 relative overflow-hidden flex flex-col justify-between h-full min-h-[480px]">
              {/* Background Glows */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusInfo.active ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${statusInfo.active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                    </span>
                    <h3 className="font-extrabold tracking-wider text-xs uppercase text-slate-400">Estado de Atención</h3>
                  </div>

                  {/* Switch de Modo Simulador */}
                  <button
                    onClick={() => {
                      setIsSimulatorActive(!isSimulatorActive);
                      if (!isSimulatorActive) {
                        setSimulatedTime(`${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`);
                        setSimulatedDay(currentTime.getDay());
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${
                      isSimulatorActive 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' 
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Play size={10} className={isSimulatorActive ? 'animate-pulse text-blue-400' : ''} />
                    <span>{isSimulatorActive ? 'SIMULANDO' : 'TIEMPO REAL'}</span>
                  </button>
                </div>

                {/* Reloj Grande */}
                <div className="text-center py-6 border-b border-slate-900 mb-6 bg-slate-900/40 rounded-xl border border-slate-800/40 backdrop-blur-md relative">
                  <p className="text-[10px] tracking-widest text-slate-500 font-extrabold uppercase mb-1">
                    {isSimulatorActive ? 'HORA SIMULADA' : 'RELOJ DEL SISTEMA (BOGOTÁ)'}
                  </p>
                  <p className="text-3xl font-black text-white tracking-tight">
                    {isSimulatorActive 
                      ? `${activeHourFormatted} ${activeDay === 0 ? 'Dom' : activeDay === 6 ? 'Sáb' : 'Día de Semana'}` 
                      : formattedRealTime
                    }
                  </p>
                  <p className="text-[10px] text-blue-400/80 font-bold mt-1.5 tracking-wide">
                    {daysOfWeek.find(d => d.index === activeDay)?.name}
                  </p>
                </div>

                {/* Indicator Card */}
                <div className={`p-5 rounded-xl border mb-6 transition-all duration-300 ${
                  statusInfo.active
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100 shadow-lg shadow-emerald-950/20'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-100 shadow-lg shadow-rose-950/20'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${statusInfo.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {statusInfo.active ? <Sun size={18} /> : <Moon size={18} />}
                    </div>
                    <span className="font-extrabold text-sm uppercase tracking-wide">
                      {statusInfo.active ? 'Atención Abierta' : 'Atención Cerrada'}
                    </span>
                  </div>
                  <p className="text-xs opacity-80 mb-3">{statusInfo.reason}.</p>
                  
                  <div className={`text-[10px] py-1 px-2.5 rounded-full inline-block font-extrabold ${
                    statusInfo.active 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {statusInfo.active ? '✅ BOT CONTESTARÁ SALUDO NORMAL' : '🏠 ENVIARÁ DISCULPA DE AUSENCIA'}
                  </div>
                </div>

                {/* Simulator Controls */}
                {isSimulatorActive && (
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 mb-4 animate-fade-in">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-300">Simulador de Horarios</span>
                      <button 
                        onClick={() => {
                          setSimulatedTime(`${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`);
                          setSimulatedDay(currentTime.getDay());
                        }}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                        title="Restablecer a tiempo real"
                      >
                        <RotateCcw size={10} />
                        <span>Reset</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Día a simular */}
                      <div>
                        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1.5">Día de la Semana</label>
                        <div className="grid grid-cols-7 gap-1">
                          {daysOfWeek.map((day) => {
                            const isSimSelected = simulatedDay === day.index;
                            return (
                              <button
                                key={day.index}
                                type="button"
                                onClick={() => setSimulatedDay(day.index)}
                                className={`py-1.5 rounded text-[11px] font-bold transition-all ${
                                  isSimSelected 
                                    ? 'bg-blue-600 text-white scale-105 shadow-md shadow-blue-500/10' 
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Hora a simular */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] text-slate-400 font-bold uppercase">Hora Simulada</label>
                          <span className="text-xs font-bold text-blue-400">{simulatedTime}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1439"
                          step="15"
                          value={(() => {
                            const [h, m] = simulatedTime.split(':').map(Number);
                            return h * 60 + m;
                          })()}
                          onChange={(e) => {
                            const totalMin = Number(e.target.value);
                            const h = Math.floor(totalMin / 60);
                            const m = totalMin % 60;
                            setSimulatedTime(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                          }}
                          className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Bot Preview Panel */}
              <div className="border-t border-slate-900 pt-4 mt-4">
                <p className="text-[10px] tracking-widest text-slate-500 font-extrabold uppercase mb-2">Previsualización de Respuesta</p>
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs leading-relaxed text-slate-300 italic relative min-h-[90px] flex items-center justify-center">
                  {statusInfo.active ? (
                    <span>
                      {"\"¡Hola! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera...\""}
                    </span>
                  ) : (
                    <span>
                      {"\"¡Hola! 👋 Te pedimos una sincera disculpa, pero hoy es un día no laborable en nuestro equipo. 🏠 Hemos recibido tu mensaje...\""}
                    </span>
                  )}
                  <div className="absolute right-2 bottom-2 text-[9px] text-slate-500 font-semibold not-italic">
                    WhatsApp Mock
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}
    </div>
  );
}
