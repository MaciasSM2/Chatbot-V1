/**
 * @file ClientFilters.tsx
 * @description Componente de presentación encargado de capturar los criterios de búsqueda 
 * y filtrado por ciclo de vida del cliente en WhatsApp.
 */

import React from 'react';
import { Search, Users, UserCheck, UserX } from 'lucide-react';

interface ClientFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'registered' | 'unregistered';
  onStatusFilterChange: (value: 'all' | 'registered' | 'unregistered') => void;
}

export const ClientFilters: React.FC<ClientFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  
  // --- Catálogo de Filtros para evitar duplicación de JSX (DRY Principle) ---
  const filterOptions = [
    { id: 'all', label: 'Todos los Contactos', icon: Users, color: 'text-indigo-500' },
    { id: 'registered', label: 'Registrados (Recurrente)', icon: UserCheck, color: 'text-emerald-500' },
    { id: 'unregistered', label: 'No Registrados (Inicial)', icon: UserX, color: 'text-amber-500' },
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 flex flex-col lg:flex-row gap-4 items-center justify-between">
      
      {/* Barra de Búsqueda Predictiva */}
      <div className="relative w-full lg:max-w-xl">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Buscar por coincidencia en nombre, teléfono o metadatos dinámicos..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium"
        />
      </div>

      {/* Segmented Controls para Segmentación de Flujo WhatsApp */}
      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
        {filterOptions.map((option) => {
          const isActive = statusFilter === option.id;
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              onClick={() => onStatusFilterChange(option.id)}
              className={`flex-1 lg:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all border active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-white' : option.color} />
              {option.label}
            </button>
          );
        })}
      </div>

    </div>
  );
};
