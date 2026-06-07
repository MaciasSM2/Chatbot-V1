'use client';

import React from 'react';
import { Search, Users, User, Circle } from 'lucide-react';

interface ClientFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedGender: string;
  onGenderChange: (value: string) => void;
}

export function ClientFilters({
  searchTerm,
  onSearchChange,
  selectedGender,
  onGenderChange,
}: ClientFiltersProps) {
  
  const filterOptions = [
    { id: 'ALL', label: 'Todos los Géneros', icon: Users, color: 'text-text-muted' },
    { id: 'M', label: 'Masculino (M)', icon: User, color: 'text-blue-500' },
    { id: 'F', label: 'Femenino (F)', icon: User, color: 'text-pink-500' },
    { id: 'N', label: 'Neutro / Corp (N)', icon: Circle, color: 'text-emerald-500' },
  ] as const;

  return (
    <div className="bg-[#0b0c0d] border border-[var(--border-subtle)] rounded-[2rem] p-6 flex flex-col lg:flex-row gap-4 items-center justify-between shadow-xl">
      {/* Barra de Búsqueda Predictiva */}
      <div className="relative w-full lg:max-w-xl">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Buscar por coincidencia en nombre o teléfono..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#141617] border border-[var(--border-subtle)] rounded-xl text-[11px] placeholder-text-muted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-text-main font-semibold"
        />
      </div>

      {/* Segmented Controls para Segmentación de Género */}
      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
        {filterOptions.map((option) => {
          const isActive = selectedGender === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => onGenderChange(option.id)}
              type="button"
              className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-bold rounded-xl transition-all border active:scale-95 cursor-pointer uppercase tracking-wider ${
                isActive
                  ? 'bg-brand-primary border-brand-primary text-background-panel shadow-sm shadow-brand-primary/10'
                  : 'bg-[#141617] border-[var(--border-subtle)] text-text-main hover:bg-[#141617]/50'
              }`}
            >
              <Icon size={12} className={isActive ? 'text-background-panel' : option.color} />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
