'use client';

import React from 'react';
import { Play, Pause, Download } from 'lucide-react';
import { executeSecureRequest, getApiUrl } from '../../../../core/apiClient';

interface ClientTableProps {
  clients: any[];
  isLoading: boolean;
  onMutationRequired: () => void;
}

export function ClientTable({ clients, isLoading, onMutationRequired }: ClientTableProps) {
  
  const toggleBotPause = async (phone: string, currentState: number) => {
    try {
      const endpointAction = currentState === 1 ? 'resume' : 'pause';
      const { success } = await executeSecureRequest(`${getApiUrl()}/chats/${phone}/${endpointAction}`, { method: 'POST' });
      if (success) onMutationRequired();
    } catch (err) {
      console.error('Error alterando estado de pausa humana:', err);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center font-mono text-text-muted animate-pulse">&gt; Descargando registros indexados desde MariaDB...</div>;
  }

  return (
    <div className="bg-bg-card border border-border-subtle rounded-[2rem] overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-header/50 text-[10px] font-black uppercase tracking-widest text-text-muted">
              <th className="px-6 py-4">Identificador Telefónico</th>
              <th className="px-6 py-4">Nombre Completo</th>
              <th className="px-6 py-4 text-center">Género</th>
              <th className="px-6 py-4">Documento</th>
              <th className="px-6 py-4 text-center">Estado Bot</th>
              <th className="px-6 py-4 text-right">Documentación Fiscal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-muted font-mono">No se encontraron prospectos mapeados bajo los criterios indicados.</td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.phone_number} className="hover:bg-bg-card-hover/50 transition-colors group">
                  <td className="px-6 py-4 font-mono font-bold text-brand-primary">{client.phone_number}</td>
                  <td className="px-6 py-4 font-medium text-text-main">{client.full_name || <span className="text-text-muted italic">Captura Silenciosa</span>}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[9px] ${
                      client.gender === 'M' ? 'bg-blue-500/10 text-blue-400' : client.gender === 'F' ? 'bg-pink-500/10 text-pink-400' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {client.gender}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-text-muted">
                    {client.document_type ? `${client.document_type}: ${client.document_number}` : 'No Suministrado'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleBotPause(client.phone_number, client.is_paused)}
                      type="button"
                      className={`px-3 py-1 rounded-xl font-bold uppercase tracking-wider text-[9px] cursor-pointer inline-flex items-center gap-1.5 transition-all ${
                        client.is_paused 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {client.is_paused ? <Pause size={10} /> : <Play size={10} />}
                      {client.is_paused ? 'Pausado (Asesor)' : 'Automatizado'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {client.rut_file_path ? (
                      <a
                        href={`/api/crm/download-rut/${client.phone_number}`}
                        download
                        className="text-brand-primary hover:text-brand-hover font-bold inline-flex items-center gap-1 hover:underline"
                      >
                        <Download size={12} />
                        Descargar RUT
                      </a>
                    ) : (
                      <span className="text-text-muted font-mono italic text-[10px]">Sin Cargar</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
