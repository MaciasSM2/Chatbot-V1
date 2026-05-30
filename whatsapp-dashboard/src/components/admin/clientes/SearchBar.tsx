import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: 'all' | 'registered' | 'unregistered';
  onStatusFilterChange: (value: 'all' | 'registered' | 'unregistered') => void;
}

export function SearchBar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: SearchBarProps) {
  const filterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'registered', label: 'Registrados' },
    { value: 'unregistered', label: 'No Registrados' },
  ] as const;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative w-full md:max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o campo personalizado..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
        />
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        {filterOptions.map((option) => {
          const isActive = statusFilter === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
              type="button"
              className={`flex-1 md:flex-initial px-4 py-2.5 text-xs font-bold rounded-xl transition-all border ${
                isActive
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-100'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
