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
import { getApiUrl, executeSecureRequest } from '../../../core/apiClient';

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
  const calendarGridClass = "grid grid-cols-7 gap-px bg-border-subtle border border-border-subtle rounded-2xl overflow-hidden shadow-2xl";

  const dayCellClass = `
    relative h-32 bg-bg-panel p-3 
    transition-all duration-300
    hover:bg-[var(--theme-accent)]/[0.03] 
    group cursor-pointer flex flex-col justify-between select-none
  `;

  const activeDayEffect = `
    before:absolute before:inset-0 
    before:border before:border-[var(--theme-accent)] 
    before:shadow-[inset_0_0_15px_var(--theme-accent)] 
    after:absolute after:top-0 after:left-0 after:h-1 after:w-full after:bg-[var(--theme-accent)]
  `;

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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  async function fetchExceptions() {
    setIsLoading(true);
    try {
      const result = await executeSecureRequest(`${getApiUrl()}/calendar`);
      const raw = result.data || result;
      setExceptions(Array.isArray(raw) ? raw : []);
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
      await executeSecureRequest(`${getApiUrl()}/calendar`, {
        method: 'POST',
        body: JSON.stringify({ date: formDate, day_type: formDayType })
      });
      showToast('Excepción guardada exitosamente.', 'success');
      setFormDate('');
      setSelectedDay(null);
      await fetchExceptions();
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
      await executeSecureRequest(`${getApiUrl()}/calendar/${dateStr}`, {
        method: 'DELETE'
      });
      showToast(`Excepción de la fecha ${dateStr} eliminada.`, 'success');
      setSelectedDay(null);
      await fetchExceptions();
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
      await executeSecureRequest(`${getApiUrl()}/calendar/sync-colombia`, {
        method: 'POST'
      });
      showToast('¡Festivos de Colombia 2026 precargados con éxito!', 'success');
      await fetchExceptions();
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
    <div className="p-8 bg-background-main min-h-screen text-text-main">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl transition-all duration-300 border backdrop-blur-md transform translate-y-0 scale-100 ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300' 
            : 'bg-red-950/90 border-red-500 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-text-main tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-[var(--theme-accent)]" />
            Gestión del Calendario y Cierres
          </h1>
          <p className="text-text-muted mt-1.5 text-sm max-w-2xl">
            Controla dinámicamente cierres administrativos, festivos Ley Emiliani o fines de semana laborables especiales que anulan el comportamiento estándar del bot.
          </p>
        </div>

        <button
          onClick={handleSyncColombia}
          disabled={isSyncing}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-500/80 via-blue-600/80 to-red-600/80 hover:from-yellow-600 hover:via-blue-700 hover:to-red-700 text-white font-bold px-5 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50"
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
        <div className="lg:col-span-8 bg-background-panel rounded-2xl border border-border-subtle p-6 shadow-sm flex flex-col">
          
          {/* Calendar Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-text-main">
                {monthNames[currentMonth]}
              </span>
              <span className="text-xl font-medium text-text-muted bg-background-header border border-border-subtle px-3 py-1 rounded-full">
                {currentYear}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-background-header border border-border-subtle p-1 rounded-xl">
              <button 
                onClick={prevMonth}
                className="p-2 hover:bg-background-panel rounded-lg text-text-main transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => { setCurrentMonth(4); setCurrentYear(2026); }}
                className="text-xs px-2.5 py-1.5 bg-background-panel text-[var(--theme-accent)] border border-border-subtle font-bold rounded-lg shadow-sm hover:bg-background-header active:scale-95 transition-all"
              >
                Hoy
              </button>
              <button 
                onClick={nextMonth}
                className="p-2 hover:bg-background-panel rounded-lg text-text-main transition-all active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-text-muted tracking-wider mb-2">
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
              <Loader2 className="w-10 h-10 animate-spin text-[var(--theme-accent)]" />
              <p className="text-text-muted text-sm">Cargando grilla del mes...</p>
            </div>
          ) : (
            <div className={calendarGridClass}>
              
              {/* Blank leading days */}
              {blankDays.map(day => (
                <div key={`blank-${day}`} className="h-32 bg-bg-panel/30 border border-border-subtle/30 opacity-20" />
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
                    className={`${dayCellClass} ${isToday ? activeDayEffect : ''} ${exc ? `${metadata?.border} border` : ''}`}
                  >
                    <div className="flex items-center justify-between z-10">
                      <span className={`text-xs font-bold ${isToday ? 'text-[var(--theme-accent)]' : (exc ? metadata?.text : 'text-text-muted')}`}>
                        {day}
                      </span>
                      {exc && (
                        <span className="text-sm select-none" title={metadata?.label}>
                          {metadata?.emoji}
                        </span>
                      )}
                    </div>

                    {/* Indicador sutil de evento/excepción u opción de añadir */}
                    <div className="mt-2 flex flex-col items-start gap-1 z-10 w-full overflow-hidden">
                      {exc ? (
                        <>
                          <span className={`text-[9px] font-black tracking-wide leading-none truncate max-w-full block py-0.5 rounded ${metadata?.text}`}>
                            {metadata?.label.split(' ')[0]}...
                          </span>
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--theme-accent)] shadow-[0_0_8px_var(--theme-accent)]" />
                        </>
                      ) : (
                        <span className="text-[9px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                          + Añadir
                        </span>
                      )}
                    </div>

                    {/* Tooltip on hover */}
                    {exc && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 hidden group-hover:block bg-background-panel text-text-main text-[11px] p-2.5 rounded-lg shadow-xl border border-border-subtle z-50 pointer-events-none">
                        <p className="font-bold text-[var(--theme-accent)] mb-0.5">{metadata?.label}</p>
                        <p className="text-text-muted">{metadata?.description}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Color Code Legend */}
          <div className="mt-6 pt-6 border-t border-border-subtle flex flex-wrap gap-x-6 gap-y-3 justify-center text-xs">
            {Object.entries(DAY_TYPES_METADATA).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-base">{value.emoji}</span>
                <span className="font-bold text-text-main">{value.label}</span>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT COLUMN: SIDEBAR FORM & MODAL CONTROLS */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Context Modal or Quick Action */}
          {selectedDay && (
            <div className="bg-background-panel rounded-2xl border-2 border-[var(--theme-accent)] p-6 shadow-md transition-all text-text-main">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-extrabold text-lg text-text-main flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--theme-accent)] animate-pulse" />
                  Día Seleccionado
                </h3>
                <button 
                  onClick={() => { setSelectedDay(null); setFormDate(''); }}
                  className="text-text-muted hover:text-text-main text-sm font-bold bg-background-header border border-border-subtle px-2 py-1 rounded"
                >
                  Cerrar
                </button>
              </div>

              <div className="bg-background-header p-4 rounded-xl border border-border-subtle mb-4">
                <p className="text-xs text-text-muted font-bold">FECHA REGISTRADA</p>
                <p className="text-lg font-black text-text-main">{selectedDay.dateStr}</p>
                {selectedDay.exception ? (
                  <div className="mt-2.5 flex items-center gap-2 text-sm">
                    <span>{DAY_TYPES_METADATA[selectedDay.exception.day_type]?.emoji}</span>
                    <span className={`font-bold ${DAY_TYPES_METADATA[selectedDay.exception.day_type]?.text}`}>
                      {DAY_TYPES_METADATA[selectedDay.exception.day_type]?.label}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--theme-accent)] font-medium mt-1">Día laborable regular (sin excepciones).</p>
                )}
              </div>

              {selectedDay.exception ? (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleDeleteException(selectedDay.dateStr)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Excepción
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">TIPO DE EXCEPCIÓN</label>
                    <select
                      value={formDayType}
                      onChange={(e) => setFormDayType(e.target.value)}
                      className="w-full bg-background-input border border-border-subtle text-text-main rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                    >
                      {Object.entries(DAY_TYPES_METADATA).map(([key, val]) => (
                        <option key={key} value={key} className="bg-background-panel">{val.emoji} {val.label}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleSaveException()}
                    className="w-full bg-[var(--theme-accent)] hover:brightness-110 text-background-panel font-bold py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Asignar Regla
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quick Manual Form */}
          <div className="bg-background-panel rounded-2xl border border-border-subtle p-6 shadow-sm">
            <h3 className="font-extrabold text-lg text-text-main mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--theme-accent)]" />
              Nueva Excepción
            </h3>
            
            <form onSubmit={handleSaveException} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">FECHA</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-background-input border border-border-subtle text-text-main rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">TIPO DE REGLA</label>
                <select
                  value={formDayType}
                  onChange={(e) => setFormDayType(e.target.value)}
                  className="w-full bg-background-input border border-border-subtle text-text-main rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)]"
                >
                  {Object.entries(DAY_TYPES_METADATA).map(([key, val]) => (
                    <option key={key} value={key} className="bg-background-panel">{val.emoji} {val.label}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-[var(--theme-accent)] hover:brightness-110 text-background-panel font-bold py-3 rounded-xl transition-all shadow hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Registrar Regla de Día
              </button>
            </form>
          </div>

          {/* Registered Exceptions Listing */}
          <div className="bg-background-panel rounded-2xl border border-border-subtle p-6 shadow-sm flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg text-text-main">
                Lista de Excepciones ({exceptions.length})
              </h3>
              <button 
                onClick={fetchExceptions}
                className="p-1.5 hover:bg-background-header rounded-lg text-text-muted transition-colors cursor-pointer border border-border-subtle"
                title="Recargar excepciones"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {exceptions.length === 0 ? (
              <div className="py-12 text-center">
                <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-text-muted text-sm font-medium">No hay excepciones activas.</p>
                <p className="text-text-muted text-xs mt-1">Usa la grilla del calendario para agregar una.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {currentExceptions.map((exc) => {
                  const meta = DAY_TYPES_METADATA[exc.day_type];
                  return (
                    <div 
                      key={exc.date} 
                      className="flex items-center justify-between p-3 bg-background-header rounded-xl border border-border-subtle hover:bg-background-panel transition-colors group"
                    >
                      <div>
                        <p className="font-black text-sm text-text-main">{exc.date}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                          <span>{meta?.emoji}</span>
                          <span className={`font-bold ${meta?.text}`}>{meta?.label}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteException(exc.date)}
                        className="p-2 bg-transparent text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer border border-transparent hover:border-red-500/20"
                        title="Eliminar de forma quirúrgica"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-border-subtle text-xs">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1.5 border border-border-subtle rounded-lg font-bold text-text-main disabled:opacity-30 hover:bg-background-header transition-colors cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="text-text-muted font-medium">
                      Pág {currentPage} de {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-2.5 py-1.5 border border-border-subtle rounded-lg font-bold text-text-main disabled:opacity-30 hover:bg-background-header transition-colors cursor-pointer"
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
