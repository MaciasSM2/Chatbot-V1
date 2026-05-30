'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';

interface CalendarException {
  date: string; // YYYY-MM-DD
  day_type: string;
}

const DAY_TYPES_METADATA: Record<string, { label: string; bg: string; border: string; text: string; description: string; emoji: string }> = {
  HOLIDAY_NON_WORKABLE: { 
    label: 'Festivo No Laborable', 
    bg: 'bg-red-500/10 hover:bg-red-500/20', 
    border: 'border-red-500/30', 
    text: 'text-red-600', 
    description: 'El bot se disculpa y no atiende.', 
    emoji: '❌' 
  },
  HOLIDAY_WORKABLE: { 
    label: 'Festivo Laborable Especial', 
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', 
    border: 'border-emerald-500/30', 
    text: 'text-emerald-600', 
    description: 'El bot atiende en horario festivo.', 
    emoji: '💼' 
  },
  SATURDAY_WORKABLE: { 
    label: 'Sábado Laborable', 
    bg: 'bg-indigo-500/10 hover:bg-indigo-500/20', 
    border: 'border-indigo-500/30', 
    text: 'text-indigo-600', 
    description: 'Atención normal en sábado.', 
    emoji: '📅' 
  },
  SUNDAY_WORKABLE: { 
    label: 'Domingo Laborable', 
    bg: 'bg-purple-500/10 hover:bg-purple-500/20', 
    border: 'border-purple-500/30', 
    text: 'text-purple-600', 
    description: 'Atención normal en domingo.', 
    emoji: '🗓️' 
  },
  WEEKDAY: { 
    label: 'Día Laborable (Anula Festivo)', 
    bg: 'bg-blue-500/10 hover:bg-blue-500/20', 
    border: 'border-blue-500/30', 
    text: 'text-blue-600', 
    description: 'Convierte un festivo en laborable.', 
    emoji: '🏢' 
  },
};

export default function CalendarioAdminPage() {
  const [exceptions, setExceptions] = useState<CalendarException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formDate, setFormDate] = useState('');
  const [formDayType, setFormDayType] = useState('HOLIDAY_NON_WORKABLE');

  // Month navigation State
  const [currentYear, setCurrentYear] = useState(2026); // Por defecto en el año del chatbot
  const [currentMonth, setCurrentMonth] = useState(4); // 4 = Mayo (0-indexed: 4 = Mayo)

  // Modal State
  const [selectedDay, setSelectedDay] = useState<{ dateStr: string; exception?: CalendarException } | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchExceptions();
  }, []);

  const getBaseUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  async function fetchExceptions() {
    setIsLoading(true);
    try {
      const response = await fetch(`${getBaseUrl()}/calendar`);
      if (response.ok) {
        const data = await response.json();
        setExceptions(data);
      } else {
        showToast('No se pudieron obtener las excepciones de calendario.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error de conexión con el servidor.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  const handleSaveException = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formDate) {
      showToast('Por favor selecciona una fecha.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${getBaseUrl()}/calendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formDate, day_type: formDayType })
      });

      if (response.ok) {
        showToast('Excepción guardada exitosamente.', 'success');
        setFormDate('');
        setSelectedDay(null);
        await fetchExceptions();
      } else {
        const data = await response.json().catch(() => ({}));
        showToast(data.message || 'No se pudo guardar la excepción.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con el servidor.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteException = async (dateStr: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${getBaseUrl()}/calendar/${dateStr}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast(`Excepción de la fecha ${dateStr} eliminada.`, 'success');
        setSelectedDay(null);
        await fetchExceptions();
      } else {
        showToast('No se pudo eliminar la excepción.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al conectar con el servidor.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncColombia = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch(`${getBaseUrl()}/calendar/sync-colombia`, {
        method: 'POST'
      });

      if (response.ok) {
        showToast('¡Festivos de Colombia 2026 precargados con éxito!', 'success');
        await fetchExceptions();
      } else {
        showToast('No se pudieron sincronizar los festivos.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error al sincronizar.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Month navigation helpers
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Calendar rendering calculations
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, etc. Let's make Monday index 0 for standard display
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ajustar a Lunes inicio
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayIndex }, (_, i) => i);

  // Helper to find exception for a specific date
  const getExceptionForDay = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return exceptions.find(e => e.date === dateString);
  };

  const handleDayClick = (day: number) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const exc = getExceptionForDay(day);
    setSelectedDay({ dateStr: dateString, exception: exc });
    setFormDate(dateString);
    if (exc) {
      setFormDayType(exc.day_type);
    }
  };

  // Pagination calculation
  const indexOfLastException = currentPage * itemsPerPage;
  const indexOfFirstException = indexOfLastException - itemsPerPage;
  const currentExceptions = exceptions.slice(indexOfFirstException, indexOfLastException);
  const totalPages = Math.ceil(exceptions.length / itemsPerPage);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl transition-all duration-300 border backdrop-blur-md transform translate-y-0 scale-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500 text-emerald-300' 
            : 'bg-red-950 border-red-500 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Gestión del Calendario y Cierres
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm max-w-2xl">
            Controla dinámicamente cierres administrativos, festivos Ley Emiliani o fines de semana laborables especiales que anulan el comportamiento estándar del bot.
          </p>
        </div>

        <button
          onClick={handleSyncColombia}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500 via-blue-600 to-red-600 hover:from-yellow-600 hover:via-blue-700 hover:to-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isSyncing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="text-xl">🇨🇴</span>
          )}
          Sincronizar Festivos Colombia 2026
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: INTERACTIVE MONTHLY CALENDAR GRID */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
          
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-gray-800">
                {monthNames[currentMonth]}
              </span>
              <span className="text-xl font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {currentYear}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={prevMonth}
                className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setCurrentMonth(4); setCurrentYear(2026); }}
                className="text-xs px-2.5 py-1.5 bg-white text-blue-600 font-bold rounded-lg shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
              >
                Hoy
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-white rounded-lg text-gray-600 transition-all active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-gray-400 tracking-wider mb-2">
            <div>LUN</div>
            <div>MAR</div>
            <div>MIÉ</div>
            <div>JUE</div>
            <div>VIE</div>
            <div>SÁB</div>
            <div>DOM</div>
          </div>

          {/* Grid Cells */}
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-gray-400 text-sm">Cargando grilla del mes...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2.5 flex-1 min-h-[380px]">
              
              {/* Blank leading days */}
              {blankDays.map(day => (
                <div key={`blank-${day}`} className="bg-gray-50/50 rounded-xl border border-gray-100/50 opacity-20" />
              ))}

              {/* Real Days of Month */}
              {daysArray.map(day => {
                const exc = getExceptionForDay(day);
                const metadata = exc ? DAY_TYPES_METADATA[exc.day_type] : null;
                const isToday = new Date().getDate() === day && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear;

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => handleDayClick(day)}
                    className={`group relative min-h-[64px] p-2 bg-white rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between hover:scale-[1.03] hover:shadow-md hover:z-10 ${
                      exc 
                        ? `${metadata?.bg} ${metadata?.border} border-2` 
                        : 'border-gray-200/60 hover:border-blue-400/80 hover:bg-blue-50/10'
                    } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-extrabold ${exc ? metadata?.text : 'text-gray-800'} ${isToday ? 'bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs' : ''}`}>
                        {day}
                      </span>
                      {exc && (
                        <span className="text-sm select-none" title={metadata?.label}>
                          {metadata?.emoji}
                        </span>
                      )}
                    </div>

                    {/* Badge/Label or empty spacer */}
                    {exc ? (
                      <span className={`text-[9px] font-black tracking-wide leading-none truncate max-w-full block py-0.5 rounded ${metadata?.text}`}>
                        {metadata?.label.split(' ')[0]}...
                      </span>
                    ) : (
                      <span className="text-[9px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        + Añadir
                      </span>
                    )}

                    {/* Tooltip on hover */}
                    {exc && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-gray-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl border border-gray-700 z-50 pointer-events-none">
                        <p className="font-bold text-blue-400 mb-0.5">{metadata?.label}</p>
                        <p className="text-gray-300">{metadata?.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Color Code Legend */}
          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-3 justify-center text-xs">
            {Object.entries(DAY_TYPES_METADATA).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-base">{value.emoji}</span>
                <span className="font-bold text-gray-700">{value.label}</span>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: SIDEBAR FORM & MODAL CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Context Modal or Quick Action */}
          {selectedDay && (
            <div className="bg-white rounded-2xl border-2 border-blue-500 p-6 shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
                  Día Seleccionado
                </h3>
                <button 
                  onClick={() => { setSelectedDay(null); setFormDate(''); }}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold bg-gray-100 px-2 py-1 rounded"
                >
                  Cerrar
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                <p className="text-xs text-gray-500 font-bold">FECHA REGISTRADA</p>
                <p className="text-lg font-black text-gray-800">{selectedDay.dateStr}</p>
                {selectedDay.exception ? (
                  <div className="mt-2.5 flex items-center gap-2 text-sm">
                    <span>{DAY_TYPES_METADATA[selectedDay.exception.day_type]?.emoji}</span>
                    <span className={`font-bold ${DAY_TYPES_METADATA[selectedDay.exception.day_type]?.text}`}>
                      {DAY_TYPES_METADATA[selectedDay.exception.day_type]?.label}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-600 font-medium mt-1">Día laborable regular (sin excepciones).</p>
                )}
              </div>

              {selectedDay.exception ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDeleteException(selectedDay.dateStr)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Excepción
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">TIPO DE EXCEPCIÓN</label>
                    <select
                      value={formDayType}
                      onChange={(e) => setFormDayType(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.entries(DAY_TYPES_METADATA).map(([key, val]) => (
                        <option key={key} value={key}>{val.emoji} {val.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleSaveException()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Asignar Regla
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Manual Form */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-gray-600" />
              Nueva Excepción
            </h3>
            
            <form onSubmit={handleSaveException} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">FECHA</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">TIPO DE REGLA</label>
                <select
                  value={formDayType}
                  onChange={(e) => setFormDayType(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(DAY_TYPES_METADATA).map(([key, val]) => (
                    <option key={key} value={key}>{val.emoji} {val.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all shadow hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Registrar Regla de Día
              </button>
            </form>
          </div>

          {/* Registered Exceptions Listing */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-gray-800">
                Lista de Excepciones ({exceptions.length})
              </h3>
              <button 
                onClick={fetchExceptions}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
                title="Recargar excepciones"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {exceptions.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm font-medium">No hay excepciones activas.</p>
                <p className="text-gray-400 text-xs mt-1">Usa la grilla del calendario para agregar una.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {currentExceptions.map((exc) => {
                  const meta = DAY_TYPES_METADATA[exc.day_type];
                  return (
                    <div 
                      key={exc.date} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors group"
                    >
                      <div>
                        <p className="font-black text-sm text-gray-800">{exc.date}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                          <span>{meta?.emoji}</span>
                          <span className={`font-bold ${meta?.text}`}>{meta?.label}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteException(exc.date)}
                        className="p-2 bg-transparent text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                        title="Eliminar de forma quirúrgica"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="text-gray-500 font-medium">
                      Pág {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
