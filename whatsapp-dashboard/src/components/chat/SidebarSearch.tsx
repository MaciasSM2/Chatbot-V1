import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, MessageSquare, Calendar, SlidersHorizontal } from 'lucide-react';
import { useChatStore } from '../../application/store/useChatStore';
import { SearchFilters } from './SearchFilters';
import { SearchResultsActions } from './SearchResultsActions';

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const highlightText = (text: string, keyword: string) => {
  if (!keyword || !keyword.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'));
  return (
    <span>
      {parts.map((part: string, i: number) => 
        part.toLowerCase() === keyword.toLowerCase()
          ? <mark key={i} className="bg-amber-500/30 text-amber-300 px-0.5 py-0.2 rounded font-bold select-all">{part}</mark>
          : part
      )}
    </span>
  );
};

export const SidebarSearch = ({ onLocalSearch, action }: { onLocalSearch?: (q: string) => void; action?: React.ReactNode }) => {
  const [query, setQuery] = useState('');
  const [globalResults, setGlobalResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Estados para Filtros de Fecha
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const { searchMessages, setActiveChat, setHighlightedMessageId } = useChatStore();

  // Cerrar el menú si hacemos clic fuera del buscador
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Efecto con Debounce de 300ms para búsqueda global con filtros de fecha
  useEffect(() => {
    // Si la query cambia, también informamos al padre para el filtrado local de chats
    if (onLocalSearch) {
      onLocalSearch(query);
    }

    if (!query.trim()) {
      setTimeout(() => {
        setGlobalResults([]);
        setIsSearching(false);
        setShowDropdown(false);
      }, 0);
      return;
    }

    setTimeout(() => {
      setIsSearching(true);
      setShowDropdown(true);
    }, 0);

    const delayDebounceFn = setTimeout(async () => {
      try {
        searchMessages(query);
        setGlobalResults([]);
        } catch (err) {
        console.error('Error al realizar búsqueda global:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, startDate, endDate, onLocalSearch, searchMessages]);

  const handleClear = () => {
    setQuery('');
    setGlobalResults([]);
    setShowDropdown(false);
    setStartDate('');
    setEndDate('');
    setShowFilters(false);
    if (onLocalSearch) onLocalSearch('');
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleDateChange = (type: string, value: string) => {
    if (type === 'start') {
      setStartDate(value);
    } else if (type === 'end') {
      setEndDate(value);
    }
  };

  const handleSelectResult = (result: any) => {
    // 1. Abrir el chat correspondiente
    setActiveChat(result.userId);
    
    // 2. Marcar el ID del mensaje para resaltar
    setHighlightedMessageId(result.id);
    
    // 3. Ocultar dropdown y limpiar caja
    setShowDropdown(false);
    setQuery('');
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    const datePart = date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
    const timePart = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart} ${timePart}`;
  };

  return (
    <div ref={containerRef} className="p-0 border-b border-border-subtle relative z-30 flex flex-col">
      <div className="p-4 flex gap-2 items-center">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-slate-500">
            {isSearching ? (
              <Loader2 size={16} className="animate-spin text-emerald-400" />
            ) : (
              <Search size={16} className="group-focus-within:text-emerald-500 transition-colors" />
            )}
          </div>
          
          <input
            type="text"
            placeholder="Buscar un mensaje o contacto..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-surface-main border border-surface-header text-sm pl-10 pr-9 py-2.5 rounded-xl placeholder-content-secondary focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all text-content-primary"
          />

          {query && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer active:scale-90"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Botón de Filtros Temporales */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer active:scale-95 shrink-0 flex items-center justify-center ${
            showFilters || startDate || endDate
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
              : 'bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
          title="Filtros por Fecha"
        >
          <SlidersHorizontal size={18} className={startDate || endDate ? "animate-pulse" : ""} />
        </button>

        {action}
      </div>

      {/* Panel de Filtros Temporales Colapsable */}
      {showFilters && (
        <SearchFilters
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
          onClear={handleClearFilters}
        />
      )}

      {/* Dropdown de Resultados Globales */}
      {showDropdown && query.trim() && (
        <div className="absolute top-full left-4 right-4 mt-1.5 bg-surface-raised/95 backdrop-blur-md border border-border-subtle rounded-2xl shadow-2xl max-h-[350px] overflow-y-auto z-40 custom-scrollbar select-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="p-3 text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 border-b border-border-subtle bg-emerald-500/5">
            🔍 Resultados Globales en Historial
          </div>

          {isSearching ? (
            <div className="p-8 text-center text-xs text-content-secondary flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="animate-spin text-emerald-400" />
              <span>Buscando en mensajes...</span>
            </div>
          ) : globalResults.length === 0 ? (
            <div className="p-8 text-center text-xs text-content-secondary italic">
              No se encontraron mensajes que coincidan con tu búsqueda
            </div>
          ) : (
            <div className="divide-y divide-border-subtle pb-16">
              {globalResults.map((result: any) => (
                <div
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className="p-3 hover:bg-white/5 transition-colors cursor-pointer flex flex-col gap-1.5 active:bg-white/10"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-content-primary uppercase tracking-wide truncate max-w-[120px]">
                      👤 {result.clientName || result.userId}
                    </span>
                    <span className="text-[9px] text-content-secondary/70 flex items-center gap-1 shrink-0">
                      <Calendar size={10} />
                      {formatTime(result.timestamp)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-content-secondary flex gap-2 items-start leading-snug">
                    <MessageSquare size={12} className="text-emerald-500/80 shrink-0 mt-0.5" />
                    <p className="break-all line-clamp-2 select-none">
                      {highlightText(result.text, query)}
                    </p>
                  </div>
                </div>
              ))}
              <div className="sticky bottom-0 bg-surface-raised border-t border-border-subtle p-3 flex justify-between items-center">
                <span className="text-[10px] text-content-secondary/70 font-medium">
                  Resultados: {globalResults.length}
                </span>
                <SearchResultsActions 
                  results={globalResults} 
                  queryParams={{ query: query, startDate, endDate }} 
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
