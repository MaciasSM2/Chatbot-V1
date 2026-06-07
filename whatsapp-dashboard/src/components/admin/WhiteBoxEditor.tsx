'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { IGreeting, DayType, TimePeriod, GreetingCategory } from '../../core/models/Greeting';

interface Props {
  greeting: IGreeting;
  onSave: (updatedGreeting: IGreeting) => void;
  onDeleteRequest: (id: string) => void;
}

export const WhiteBoxEditor: React.FC<Props> = ({ greeting, onSave, onDeleteRequest }) => {
  // Estado local encapsulado
  const [text, setText] = useState(greeting.text);
  const [dayType, setDayType] = useState<DayType>(greeting.dayType);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>(greeting.timePeriod);
  const [category, setCategory] = useState<GreetingCategory>(greeting.category || 'RESPONSE');
  const [isEdited, setIsEdited] = useState(false);
  const searchParams = useSearchParams();
  const highlightParam = searchParams?.get('highlight');
  const isHighlighted = highlightParam === greeting.timePeriod;
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && elementRef.current) {
      setTimeout(() => {
        elementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isHighlighted]);

  // Manejadores de cambios
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setIsEdited(true);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDayType(e.target.value as DayType);
    setIsEdited(true);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimePeriod(e.target.value as TimePeriod);
    setIsEdited(true);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(e.target.value as GreetingCategory);
    setIsEdited(true);
  };

  const handleSave = () => {
    onSave({ ...greeting, text, dayType, timePeriod, category });
    setIsEdited(false);
  };

  return (
    <div 
      ref={elementRef}
      className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 bg-bg-panel p-1 shadow-2xl ${
        isHighlighted 
          ? 'ring-2 ring-primary border-primary z-10 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.01]' 
          : 'border-border-subtle hover:border-brand-primary/30'
      }`}
    >
      {/* Header del Editor: Ahora en gris profundo */}
      <div className="flex items-center justify-between bg-bg-header px-6 py-3 rounded-t-[22px] border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Regla: {category} / {timePeriod} / {dayType}
          </span>
        </div>
        {isHighlighted && (
          <span className="text-[9px] font-bold bg-brand-primary text-background-panel px-2 py-0.5 rounded uppercase">
            Previsualización
          </span>
        )}
      </div>

      {/* Selectores como barra de herramientas sutil */}
      <div className="flex flex-wrap gap-3 p-4 bg-bg-header/20 border-b border-border-subtle">
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[9px] font-bold text-text-muted mb-1 uppercase tracking-wider">Días</label>
          <select 
            value={dayType} 
            onChange={handleDayChange}
            className="w-full bg-bg-input border border-border-subtle text-text-main rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary outline-none text-xs"
          >
            <option value="WEEKDAY">Semana hábil (Lun-Vie)</option>
            <option value="WEEKEND">Fin de semana (Sab-Dom)</option>
            <option value="SATURDAY_WORKABLE">Sábado Laborable</option>
            <option value="SUNDAY_WORKABLE">Domingo Laborable</option>
            <option value="HOLIDAY_WORKABLE">Festivo Laborable</option>
            <option value="HOLIDAY_NON_WORKABLE">Festivo No Laborable</option>
          </select>
        </div>
        
        <div className="flex-1 min-w-[120px]">
          <label className="block text-[9px] font-bold text-text-muted mb-1 uppercase tracking-wider">Horario</label>
          <select 
            value={timePeriod} 
            onChange={handleTimeChange}
            className="w-full bg-bg-input border border-border-subtle text-text-main rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary outline-none text-xs"
          >
            <option value="MORNING">Mañana</option>
            <option value="AFTERNOON">Tarde</option>
            <option value="NIGHT">Noche</option>
          </select>
        </div>

        <div className="flex-1 min-w-[120px]">
          <label className="block text-[9px] font-bold text-text-muted mb-1 uppercase tracking-wider">Categoría</label>
          <select 
            value={category} 
            onChange={handleCategoryChange}
            className="w-full bg-bg-input border border-border-subtle text-text-main rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary outline-none text-xs"
          >
            <option value="INITIATION">Inicio (Bot inicia)</option>
            <option value="RESPONSE">Respuesta (Responde a usuario)</option>
            <option value="CONTINUITY">Continuidad (Inactividad)</option>
          </select>
        </div>
      </div>

      {/* Área de Texto: Fondo negro, texto blanco, sin bordes internos */}
      <textarea
        className="w-full min-h-[120px] bg-bg-panel p-6 text-sm leading-relaxed text-text-main outline-none placeholder:text-text-muted/30 resize-y border-b border-border-subtle"
        value={text}
        onChange={handleTextChange}
        placeholder="Escribe el mensaje que el bot enviará..."
      />

      {/* Footer con controles y estadísticas */}
      <div className="bg-bg-header/40 px-6 py-3 flex items-center justify-between text-[11px] rounded-b-[22px]">
        <button
          onClick={() => onDeleteRequest(greeting.id)}
          className="text-red-500 hover:text-red-400 font-bold transition-colors cursor-pointer"
        >
          ELIMINAR
        </button>

        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-[9px] font-mono text-text-muted">
            <span>CHARS: {text.length}</span>
            <span>VARS: {text.includes('{{name}}') ? 'OK' : 'NO NAME'}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={!isEdited}
            className={`px-4 py-1.5 rounded-lg font-bold transition-all text-xs ${
              isEdited 
                ? 'bg-brand-primary hover:bg-brand-hover text-background-panel cursor-pointer shadow-md active:scale-95' 
                : 'bg-bg-input text-text-dim border border-border-subtle cursor-not-allowed'
            }`}
          >
            GUARDAR
          </button>
        </div>
      </div>
    </div>
  );
};
