import React, { useState } from 'react';
import { CalendarRange, RotateCcw } from 'lucide-react';

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL_BASE || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

export const SearchFilters = ({ onDateChange, startDate, endDate, onClear }) => {
  const [loadingHoliday, setLoadingHoliday] = useState(false);

  const handleLastHoliday = async () => {
    setLoadingHoliday(true);
    try {
      const res = await fetch(`${API_URL}/holidays/last`);
      if (!res.ok) throw new Error("Error obteniendo el festivo");
      const data = await res.json();
      if (data && data.date) {
        // Establecer tanto inicio como fin en la fecha del festivo
        onDateChange('start', data.date);
        onDateChange('end', data.date);
      }
    } catch (err) {
      console.error("Error al obtener último festivo:", err);
      // Fallback local a la fecha simulada por si falla la conexión
      onDateChange('start', '2026-05-22');
      onDateChange('end', '2026-05-22');
    } finally {
      setLoadingHoliday(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-3.5 bg-[#111b21] border-b border-white/5 animate-in slide-in-from-top duration-300 select-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase mb-1.5 block tracking-wider">Desde:</label>
          <input 
            type="date" 
            value={startDate || ''}
            onChange={(e) => onDateChange('start', e.target.value)}
            className="w-full bg-[#202c33] text-slate-200 text-xs px-2.5 py-2 rounded-xl border border-white/5 outline-none focus:border-emerald-500/50 transition-all font-semibold focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-slate-500 font-extrabold uppercase mb-1.5 block tracking-wider">Hasta:</label>
          <input 
            type="date" 
            value={endDate || ''}
            onChange={(e) => onDateChange('end', e.target.value)}
            className="w-full bg-[#202c33] text-slate-200 text-xs px-2.5 py-2 rounded-xl border border-white/5 outline-none focus:border-emerald-500/50 transition-all font-semibold focus:ring-1 focus:ring-emerald-500/20"
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-1">
        {/* Botón rápido Colombia */}
        <button
          onClick={handleLastHoliday}
          disabled={loadingHoliday}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer shadow-md select-none disabled:opacity-50"
        >
          <CalendarRange size={12} className="shrink-0 animate-pulse" />
          {loadingHoliday ? "Cargando..." : "🇨🇴 Último Festivo"}
        </button>

        {/* Limpiar Filtros */}
        <button 
          onClick={onClear}
          className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 font-extrabold uppercase transition-colors cursor-pointer select-none active:scale-95 py-1 px-2 rounded-lg hover:bg-white/5"
        >
          <RotateCcw size={11} />
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
};
