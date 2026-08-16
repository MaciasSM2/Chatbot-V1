/**
 * @file ClientHistorySidebar.jsx
 * @description Sidebar de historial de clientes registrados localmente.
 */

import React, { useState } from 'react';
import { Users, X } from 'lucide-react';
import { ClientPersistenceService } from '../../application/services/ClientPersistenceService';

export const ClientHistorySidebar = ({ onClose }: { onClose: () => void }) => {
  const [clients, setClients] = useState(ClientPersistenceService.getAll());

  const handleClearAll = () => {
    if (typeof window !== 'undefined') {
      if (confirm('¿Estás seguro de que deseas limpiar el historial de clientes registrados en LocalStorage?')) {
        localStorage.removeItem('simulator_clients_db');
        setClients([]);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-panel border-r border-border-subtle w-[350px] shrink-0 text-content-primary animate-in slide-in-from-left duration-300">
      <div className="p-4 bg-surface-header flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-emerald-500" />
          <h3 className="text-xs font-black text-content-primary uppercase tracking-wider">Clientes Registrados</h3>
        </div>
        
        <div className="flex items-center gap-1.5">
          {clients.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="text-[9px] font-black uppercase text-rose-400 hover:text-rose-300 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded-md transition-colors cursor-pointer mr-1"
              title="Limpiar base de datos local"
            >
              Limpiar
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-content-secondary hover:text-content-primary cursor-pointer"
              title="Volver a chats"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-surface-panel">
        {clients.map((client: any) => (
          <div key={client.id} className="bg-surface-header/50 hover:bg-surface-header p-4 rounded-2xl border border-border-subtle hover:border-emerald-500/30 transition-all duration-300 select-none">
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                client.source === 'chat' 
                  ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' 
                  : 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
              }`}>
                {client.source}
              </span>
              <span className="text-[9px] text-content-secondary/70 font-bold">{new Date(client.registrationDate).toLocaleDateString()}</span>
            </div>
            
            <p className="text-sm font-extrabold text-content-primary leading-tight">{client.fullName}</p>
            <p className="text-[11px] text-content-secondary font-mono mt-1.5">{client.phone}</p>
            
            <div className="mt-3 pt-2.5 border-t border-border-subtle flex justify-between items-center text-[10px]">
              <span className="text-content-secondary/70 font-medium">Cédula: <span className="text-content-primary/80 font-semibold">{client.identification}</span></span>
              <span className="text-emerald-400 font-black text-xs" title={`Género: ${client.gender}`}>
                {client.gender === 'Caballero' ? '♂' : client.gender === 'Dama' ? '♀' : '⚙'}
              </span>
            </div>
          </div>
        ))}
        {clients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-content-secondary/70 select-none">
            <Users size={32} className="opacity-15 mb-2" />
            <p className="text-xs">No hay clientes registrados aún.</p>
          </div>
        )}
      </div>
    </div>
  );
};
