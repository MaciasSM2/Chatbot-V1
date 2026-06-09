'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Users, 
  Zap, 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  Database, 
  Cpu, 
  Play, 
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  Wifi,
  WifiOff,
  Lock
} from 'lucide-react';
import { useModuleStore } from '../../application/store/useModuleStore';
import { getApiUrl, executeSecureRequest } from '../../core/apiClient';

interface MetricTimelineItem {
  date: string;
  bot: number;
  user: number;
}

interface MetricPeakHourItem {
  hour: number;
  count: number;
}

interface AnalyticsData {
  messages: {
    total: number;
    bot: number;
    user: number;
    timeline: MetricTimelineItem[];
  };
  sessions: {
    total: number;
    states: Record<string, number>;
  };
  latency: {
    avg: number;
    min: number;
    max: number;
  };
  peakHours: MetricPeakHourItem[];
  system: {
    mariadb: string;
    redis: string;
    prometheus: string;
  };
  demo: boolean;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  
  // Para interactividad local inmediata en la simulación
  const [simulatedInbound, setSimulatedInbound] = useState(0);
  const [simulatedOutbound, setSimulatedOutbound] = useState(0);

  const { modules, loadModules } = useModuleStore();

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const isDashboardHomeEnabled = modules.find((m: any) => m.id === 'dashboard_home')?.is_enabled ?? true;

  useEffect(() => {
    if (!isDashboardHomeEnabled) {
      setTimeout(() => {
        setIsLoading(false);
      }, 0);
      return;
    }
    setTimeout(() => {
      fetchAnalytics(isDemoMode);
    }, 0);
    
    // Auto-recarga cada 10 segundos
    const timer = setInterval(() => {
      fetchAnalytics(isDemoMode, true);
    }, 10000);

    return () => clearInterval(timer);
  }, [isDemoMode, isDashboardHomeEnabled]);

  async function fetchAnalytics(demo: boolean, silent = false) {
    if (!silent) setIsLoading(true);
    try {
      const result: any = await executeSecureRequest(`${getApiUrl()}/analytics?demo=${demo ? 'true' : 'false'}`);

      if (result) {
        if (result.demo || demo) {
          result.messages.total += simulatedInbound + simulatedOutbound;
          result.messages.bot += simulatedOutbound;
          result.messages.user += simulatedInbound;

          if (result.messages.timeline && result.messages.timeline.length > 0) {
            const lastTimelineIndex = result.messages.timeline.length - 1;
            result.messages.timeline[lastTimelineIndex].bot += simulatedOutbound;
            result.messages.timeline[lastTimelineIndex].user += simulatedInbound;
          }
        }
        setData(result);
      } else {
        showToast('Error al obtener métricas reales, activando Modo Demo.', 'error');
        if (!demo) {
          setIsDemoMode(true);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Servidor offline. Ejecutando en Modo Demo Resiliente.', 'info');
      if (!demo) {
        setIsDemoMode(true);
      }
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }

  const showToast = (message: string, type: 'success' | 'info' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSync = () => {
    setIsSyncing(true);
    fetchAnalytics(isDemoMode);
    showToast('Métricas sincronizadas con éxito.', 'success');
  };

  // Simula el envío de un mensaje en tiempo real
  const handleSimulateMessage = (sender: 'user' | 'bot') => {
    if (sender === 'user') {
      setSimulatedInbound(prev => prev + 1);
      showToast('📥 Mensaje de usuario entrante simulado.', 'success');
    } else {
      setSimulatedOutbound(prev => prev + 1);
      showToast('🤖 Mensaje saliente del bot simulado.', 'info');
    }
    
    // Forzar actualización inmediata en UI local
    if (data) {
      const updated = { ...data };
      updated.messages.total += 1;
      if (sender === 'user') {
        updated.messages.user += 1;
        // Agregar a la sesión temporalmente
        if (!updated.sessions.states) updated.sessions.states = {};
        updated.sessions.states.WELCOME = (updated.sessions.states.WELCOME || 0) + 1;
      } else {
        updated.messages.bot += 1;
      }
      
      // Sumar al último elemento del timeline
      if (updated.messages.timeline && updated.messages.timeline.length > 0) {
        const idx = updated.messages.timeline.length - 1;
        if (sender === 'user') {
          updated.messages.timeline[idx].user += 1;
        } else {
          updated.messages.timeline[idx].bot += 1;
        }
      }
      
      setData(updated);
    }
  };

  const handleResetSimulation = () => {
    setSimulatedInbound(0);
    setSimulatedOutbound(0);
    showToast('🔄 Simulación local restablecida.', 'info');
    fetchAnalytics(isDemoMode);
  };

  if (!isDashboardHomeEnabled) {
    return (
      <div className="p-8 max-w-7xl mx-auto min-h-[80vh] flex items-center justify-center">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-200/80 bg-white/70 p-8 text-center backdrop-blur-xl shadow-2xl">
          {/* Animated decorative glow elements */}
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -right-16 -bottom-16 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center py-10">
            {/* Glowing lock sphere */}
            <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-lg">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500/20 to-purple-500/20 animate-pulse"></div>
              <Lock className="h-10 w-10 text-blue-400 animate-bounce" />
            </div>

            <span className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-black tracking-widest uppercase mb-4">
              Módulo Inactivo
            </span>

            <h2 className="text-3xl font-black tracking-tight text-slate-800 mb-3">
              Área de Inicio & Analíticas
            </h2>
            
            <p className="text-slate-500 text-sm max-w-md mb-8 leading-relaxed font-medium">
              El panel de control y el análisis de tráfico en tiempo real están actualmente inactivos. Habilita el módulo <code className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-blue-600">dashboard_home</code> en la configuración del sistema para reanudar el monitoreo.
            </p>

            <button
              onClick={() => window.location.href = '/admin/configuracion'}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-xl shadow-blue-900/30 transition-all duration-300 hover:from-blue-500 hover:to-indigo-500 active:scale-95"
            >
              <span className="relative z-10 flex items-center gap-2">
                Ajustes de Módulos
                <ArrowUpRight className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="text-blue-600 animate-pulse" size={24} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-700 mt-6 animate-pulse">Analizando ecosistema de tráfico...</h2>
        <p className="text-gray-400 text-sm mt-2">Cargando métricas de Prometheus y MariaDB</p>
      </div>
    );
  }

  // Fallback seguro de datos vacíos
  const metrics = data || {
    messages: { total: 0, bot: 0, user: 0, timeline: [] },
    sessions: { total: 0, states: { WELCOME: 0, AWAITING_NAME: 0, AWAITING_MENU_OPTION: 0 } },
    latency: { avg: 0, min: 0, max: 0 },
    peakHours: [],
    system: { mariadb: 'disconnected', redis: 'disconnected', prometheus: 'offline' },
    demo: true
  };

  // Calcular Tasa de Automatización
  const botSuccessRate = metrics.messages.total > 0
    ? ((metrics.messages.bot / metrics.messages.total) * 100).toFixed(1)
    : '0.0';

  // --- RENDERS DE GRÁFICOS SVG ---

  // 1. Gráfico de Área de Línea de Tiempo (Últimos 7 Días)
  const renderTimelineChart = () => {
    const timeline = metrics.messages.timeline || [];
    if (timeline.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = 30;
    
    // Encontrar el valor máximo para escalar el gráfico
    const maxVal = Math.max(...timeline.map(t => Math.max(t.bot, t.user)), 10);
    
    const getX = (index: number) => padding + (index * (width - 2 * padding)) / (timeline.length - 1);
    const getY = (val: number) => height - padding - (val * (height - 2 * padding)) / maxVal;

    // Generar caminos (path definitions)
    let userPath = '';
    let userAreaPath = '';
    let botPath = '';
    let botAreaPath = '';

    timeline.forEach((item, idx) => {
      const x = getX(idx);
      const yUser = getY(item.user);
      const yBot = getY(item.bot);

      if (idx === 0) {
        userPath = `M ${x} ${yUser}`;
        userAreaPath = `M ${x} ${height - padding} L ${x} ${yUser}`;
        botPath = `M ${x} ${yBot}`;
        botAreaPath = `M ${x} ${height - padding} L ${x} ${yBot}`;
      } else {
        userPath += ` L ${x} ${yUser}`;
        userAreaPath += ` L ${x} ${yUser}`;
        botPath += ` L ${x} ${yBot}`;
        botAreaPath += ` L ${x} ${yBot}`;
      }

      if (idx === timeline.length - 1) {
        userAreaPath += ` L ${x} ${height - padding} Z`;
        botAreaPath += ` L ${x} ${height - padding} Z`;
      }
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[220px]">
        <defs>
          <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="botGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Líneas de cuadrícula horizontal */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = padding + ratio * (height - 2 * padding);
          return (
            <line 
              key={i} 
              x1={padding} 
              y1={y} 
              x2={width - padding} 
              y2={y} 
              stroke="#e2e8f0" 
              strokeWidth="1" 
              strokeDasharray="4 4" 
            />
          );
        })}

        {/* Áreas rellenas con gradiente */}
        {timeline.length > 1 && (
          <>
            <path d={userAreaPath} fill="url(#userGrad)" />
            <path d={botAreaPath} fill="url(#botGrad)" />
          </>
        )}

        {/* Caminos de líneas principales */}
        {timeline.length > 1 && (
          <>
            <path d={userPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
            <path d={botPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {/* Puntos y Tooltips interactivos de hover */}
        {timeline.map((item, idx) => {
          const x = getX(idx);
          const yUser = getY(item.user);
          const yBot = getY(item.bot);
          
          // Formatear fecha corta
          const dayName = new Date(item.date).toLocaleDateString('es-CO', { weekday: 'short', timeZone: 'UTC' });
          const dateLabel = item.date.substring(8, 10);

          return (
            <g key={idx} className="group/dot cursor-pointer">
              {/* Círculo Guía */}
              <circle cx={x} cy={yUser} r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="transition-all duration-200 group-hover/dot:stroke-blue-600 group-hover/dot:scale-125" style={{ transformOrigin: `${x}px ${yUser}px` }} />
              <circle cx={x} cy={yBot} r="4" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" className="transition-all duration-200 group-hover/dot:stroke-emerald-600 group-hover/dot:scale-125" style={{ transformOrigin: `${x}px ${yBot}px` }} />
              
              {/* Textos de ejes */}
              <text x={x} y={height - 8} fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-semibold">
                {`${dayName} ${dateLabel}`}
              </text>

              {/* Tooltip flotante al pasar el mouse */}
              <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect x={x - 45} y={Math.min(yUser, yBot) - 48} width="90" height="38" rx="6" fill="#1e293b" opacity="0.95" />
                <text x={x} y={Math.min(yUser, yBot) - 34} fill="#93c5fd" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {`U: ${item.user} msg`}
                </text>
                <text x={x} y={Math.min(yUser, yBot) - 22} fill="#6ee7b7" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {`B: ${item.bot} msg`}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    );
  };

  // 2. Gráfico de Barras de Tráfico por Hora
  const renderPeakHoursChart = () => {
    const hours = metrics.peakHours || [];
    if (hours.length === 0) return null;

    const width = 600;
    const height = 140;
    const padding = 20;
    const maxCount = Math.max(...hours.map(h => h.count), 5);

    const barWidth = (width - 2 * padding) / hours.length - 2;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full max-h-[160px]">
        {hours.map((item, idx) => {
          const barHeight = (item.count * (height - 2 * padding)) / maxCount;
          const x = padding + idx * (barWidth + 2);
          const y = height - padding - barHeight;

          // Destacar horas de oficina comunes
          const isOfficeHour = item.hour >= 8 && item.hour <= 18;
          const barColor = item.count === maxCount 
            ? '#f59e0b' // Busiest hour (Amber Glow)
            : isOfficeHour ? '#3b82f6' : '#94a3b8';

          return (
            <g key={idx} className="group/bar cursor-pointer">
              {/* Barra */}
              <rect 
                x={x} 
                y={y} 
                width={barWidth} 
                height={Math.max(barHeight, 2)} 
                rx="2" 
                fill={barColor}
                opacity={item.count === maxCount ? 1 : 0.85}
                className="transition-all duration-300 group-hover/bar:opacity-100 group-hover/bar:fill-blue-500"
              />
              
              {/* Ejes y Etiquetas cada 4 horas */}
              {item.hour % 4 === 0 && (
                <text x={x + barWidth / 2} y={height - 4} fill="#94a3b8" fontSize="9" textAnchor="middle" className="font-medium">
                  {`${item.hour}h`}
                </text>
              )}

              {/* Tooltip de barra */}
              <g className="opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect x={x - 25} y={y - 28} width="60" height="22" rx="4" fill="#0f172a" />
                <text x={x + barWidth / 2} y={y - 14} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {`${item.count} msg`}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    );
  };

  // 3. Gráfico de Donut de Estados FSM
  const renderDonutChart = () => {
    const states = metrics.sessions.states || {};
    const welcome = states.WELCOME || 0;
    const name = states.AWAITING_NAME || 0;
    const option = states.AWAITING_MENU_OPTION || 0;
    const total = welcome + name + option || 1;

    // Radios y perímetros del donut
    const radius = 35;
    const circ = 2 * Math.PI * radius; // ~219.9
    
    const pctWelcome = (welcome / total) * 100;
    const pctName = (name / total) * 100;
    const pctOption = (option / total) * 100;

    const strokeWelcome = (pctWelcome / 100) * circ;
    const strokeName = (pctName / 100) * circ;
    const strokeOption = (pctOption / 100) * circ;

    const offsetWelcome = 0;
    const offsetName = strokeWelcome;
    const offsetOption = strokeWelcome + strokeName;

    return (
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {/* Círculo Base */}
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
            
            {/* Anillo de Opción (Verde) */}
            {strokeOption > 0 && (
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="12" 
                strokeDasharray={`${strokeOption} ${circ - strokeOption}`}
                strokeDashoffset={-offsetOption}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            )}

            {/* Anillo de Nombre (Naranja) */}
            {strokeName > 0 && (
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="12" 
                strokeDasharray={`${strokeName} ${circ - strokeName}`}
                strokeDashoffset={-offsetName}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            )}

            {/* Anillo de Saludo (Azul) */}
            {strokeWelcome > 0 && (
              <circle 
                cx="50" 
                cy="50" 
                r={radius} 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="12" 
                strokeDasharray={`${strokeWelcome} ${circ - strokeWelcome}`}
                strokeDashoffset={-offsetWelcome}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-800">{metrics.sessions.total}</span>
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase">Chats</span>
          </div>
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-xs font-semibold text-gray-600">Saludo Inicial</span>
            </div>
            <span className="text-xs font-black text-gray-800">{welcome} ({pctWelcome.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
              <span className="text-xs font-semibold text-gray-600">Captura Nombre</span>
            </div>
            <span className="text-xs font-black text-gray-800">{name} ({pctName.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
              <span className="text-xs font-semibold text-gray-600">Menú Interactivo</span>
            </div>
            <span className="text-xs font-black text-gray-800">{option} ({pctOption.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-transparent min-h-screen">
      
      {/* Toast Animado */}
      {toast && (
        <div className={`fixed bottom-5 right-5 px-5 py-3.5 rounded-xl shadow-xl z-50 flex items-center gap-3 border animate-bounce ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <Sparkles size={18} className={toast.type === 'success' ? 'text-emerald-600' : toast.type === 'error' ? 'text-rose-600' : 'text-blue-600'} />
          <span className="text-xs font-bold font-mono tracking-tight">{toast.message}</span>
        </div>
      )}

      {/* Cabecera / Banner Superior con efecto de degradado premium */}
      <div className="relative rounded-2xl bg-gradient-to-r from-gray-900 via-slate-900 to-blue-950 p-8 shadow-xl overflow-hidden border border-gray-800">
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 -mb-16 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-black tracking-wider uppercase">
                Panel de Analíticas
              </span>
              {metrics.demo && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 animate-pulse">
                  Modo Demostración Activo
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-2">
              Métricas Operativas de Tráfico
            </h1>
            <p className="text-sm text-gray-400 max-w-xl font-medium">
              Supervisión de rendimiento del bot, distribución temporal de mensajes de WhatsApp y estados de la máquina de FSM en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10 backdrop-blur-md">
            {/* Toggle de Modo Demo */}
            <button
              onClick={() => {
                setIsDemoMode(prev => !prev);
                showToast(isDemoMode ? 'Cambiando a base de datos real.' : 'Activando simulación interactiva.', 'info');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold tracking-tight transition-all duration-300 ${
                isDemoMode 
                  ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20' 
                  : 'bg-white/15 text-white hover:bg-white/20'
              }`}
            >
              {isDemoMode ? '🔌 Desactivar Demo' : '💡 Activar Modo Demo'}
            </button>

            {/* Botón de Sincronización */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              <RefreshCw size={16} className={`transition-transform duration-500 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Estado del Sistema */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* MariaDB status */}
        <div className="bg-bg-panel p-4 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${metrics.system.mariadb === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Database size={18} />
            </div>
            <div>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Base de Datos</p>
              <h4 className="text-sm font-bold text-text-main">MariaDB</h4>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-black tracking-tight ${metrics.system.mariadb === 'connected' ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${metrics.system.mariadb === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
            {metrics.system.mariadb === 'connected' ? 'Online' : 'Offline'}
          </span>
        </div>
 
        {/* Redis status */}
        <div className="bg-bg-panel p-4 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${metrics.system.redis === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Cpu size={18} />
            </div>
            <div>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Gestor Colas</p>
              <h4 className="text-sm font-bold text-text-main">Redis (BullMQ)</h4>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-black tracking-tight ${metrics.system.redis === 'connected' ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${metrics.system.redis === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
            {metrics.system.redis === 'connected' ? 'Online' : 'Offline'}
          </span>
        </div>
 
        {/* Prometheus status */}
        <div className="bg-bg-panel p-4 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${metrics.system.prometheus === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <Activity size={18} />
            </div>
            <div>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Endpoint Métricas</p>
              <h4 className="text-sm font-bold text-text-main">Prometheus</h4>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-black tracking-tight ${metrics.system.prometheus === 'online' ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${metrics.system.prometheus === 'online' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`}></span>
            {metrics.system.prometheus === 'online' ? 'Online' : 'Offline'}
          </span>
        </div>
 
        {/* Webhook status */}
        <div className="bg-bg-panel p-4 rounded-xl border border-border-subtle shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              {metrics.system.mariadb === 'connected' && metrics.system.redis === 'connected' ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div>
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Integración Nube</p>
              <h4 className="text-sm font-bold text-text-main">WhatsApp Webhook</h4>
            </div>
          </div>
          <span className={`flex items-center gap-1.5 text-xs font-black tracking-tight ${metrics.system.mariadb === 'connected' && metrics.system.redis === 'connected' ? 'text-blue-600' : 'text-slate-500'}`}>
            {metrics.system.mariadb === 'connected' && metrics.system.redis === 'connected' ? 'Escuchando' : 'Modo Demo'}
          </span>
        </div>

      </div>

      {/* Grid de KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* KPI 1: Total Mensajes */}
        <div className="bg-bg-panel p-6 rounded-xl border border-border-subtle shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-text-dim font-black uppercase tracking-wider mb-1">Total Mensajes</p>
              <h3 className="text-3xl font-black text-text-main tracking-tight">{metrics.messages.total}</h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-blue-600 flex items-center gap-0.5">
              {metrics.messages.user} <ArrowUpRight size={12} />
            </span>
            <span className="text-text-dim font-medium">mensajes del usuario</span>
          </div>
        </div>

        {/* KPI 2: Chats Activos */}
        <div className="bg-bg-panel p-6 rounded-xl border border-border-subtle shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-text-dim font-black uppercase tracking-wider mb-1">Sesiones Activas</p>
              <h3 className="text-3xl font-black text-text-main tracking-tight">{metrics.sessions.total}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-emerald-600 flex items-center gap-0.5">
              100%
            </span>
            <span className="text-text-dim font-medium">flujo activo FSM</span>
          </div>
        </div>

        {/* KPI 3: Latencia Promedio */}
        <div className="bg-bg-panel p-6 rounded-xl border border-border-subtle shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-text-dim font-black uppercase tracking-wider mb-1">Latencia Promedio</p>
              <h3 className="text-3xl font-black text-text-main tracking-tight">{(metrics.latency.avg * 1000).toFixed(0)}<span className="text-lg font-bold text-text-dim">ms</span></h3>
            </div>
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
              <Zap size={20} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-text-dim font-semibold font-mono">
            <span>Min: {(metrics.latency.min * 1000).toFixed(0)}ms</span>
            <span>Max: {(metrics.latency.max * 1000).toFixed(0)}ms</span>
          </div>
        </div>

        {/* KPI 4: Automatización Bot */}
        <div className="bg-bg-panel p-6 rounded-xl border border-border-subtle shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-text-dim font-black uppercase tracking-wider mb-1">Automatización</p>
              <h3 className="text-3xl font-black text-text-main tracking-tight">{botSuccessRate}%</h3>
            </div>
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-bold text-purple-600 flex items-center gap-0.5">
              {metrics.messages.bot} <ArrowUpRight size={12} />
            </span>
            <span className="text-text-dim font-medium">mensajes enviados por el bot</span>
          </div>
        </div>

      </div>

      {/* Grid de gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Tráfico últimos 7 días */}
        <div className="bg-bg-panel p-6 rounded-xl border border-border-subtle shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-text-main tracking-tight">Volumen de Mensajes (7 Días)</h3>
              <p className="text-xs text-text-dim font-medium mt-0.5">Relación diaria entre interacciones de clientes y respuestas del bot</p>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span className="text-text-dim">Usuario</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-text-dim">Bot</span>
              </div>
            </div>
          </div>
 
          <div className="flex-1 flex items-center justify-center p-2">
            {renderTimelineChart()}
          </div>
        </div>
 
        {/* Gráfico 2: Estados FSM */}
        <div className="bg-bg-panel p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-text-main tracking-tight">Embudo FSM de Clientes</h3>
            <p className="text-xs text-text-dim font-medium mt-0.5">Distribución del estado activo de los números de chat</p>
          </div>
 
          <div className="flex-1 flex items-center justify-center my-6">
            {renderDonutChart()}
          </div>
 
          <div className="p-3 bg-bg-main border border-border-subtle rounded-lg flex items-start gap-2.5 text-xs text-text-dim font-medium">
            <HelpCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="leading-snug">
              Este embudo monitorea cuántos clientes están interactuando activamente con las estrategias secuenciales de saludo y captura.
            </p>
          </div>
        </div>
 
      </div>
 
      {/* Fila inferior: Picos de hora & simulador de tráfico */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 3: Picos de tráfico por hora */}
        <div className="bg-bg-panel p-6 rounded-xl border border-border-subtle shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-text-main tracking-tight">Distribución Horaria de Tráfico</h3>
            <p className="text-xs text-text-dim font-medium mt-0.5">Historial acumulado de mensajes por franja de 24 horas</p>
          </div>
 
          <div className="flex-1 flex items-center justify-center py-4">
            {renderPeakHoursChart()}
          </div>
        </div>

        {/* Simulador Interactivo Local */}
        <div className="bg-gradient-to-br from-bg-panel to-bg-main/50 p-6 rounded-xl border border-border-subtle shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 bottom-0 -mb-6 -mr-6 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
 
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-blue-600" size={16} />
              <h3 className="text-lg font-black text-text-main tracking-tight">Simulador de Tráfico</h3>
            </div>
            <p className="text-xs text-text-dim font-medium leading-relaxed mb-6">
              Haz clic en los botones para disparar mensajes interactivos y ver cómo se actualizan y escalan las gráficas en tiempo real de forma dinámica.
            </p>
          </div>
 
          <div className="space-y-4 relative z-10">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSimulateMessage('user')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/10 transition-all active:scale-95"
              >
                <Play size={12} className="transform rotate-90" />
                Inbound User
              </button>
              <button
                onClick={() => handleSimulateMessage('bot')}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/10 transition-all active:scale-95"
              >
                <Play size={12} />
                Outbound Bot
              </button>
            </div>
 
            <button
              onClick={handleResetSimulation}
              disabled={simulatedInbound === 0 && simulatedOutbound === 0}
              className="w-full py-2 border border-border-subtle hover:border-text-dim rounded-lg text-text-dim font-bold text-xs bg-bg-panel hover:bg-bg-main transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
            >
              Restablecer Simulación Local
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
