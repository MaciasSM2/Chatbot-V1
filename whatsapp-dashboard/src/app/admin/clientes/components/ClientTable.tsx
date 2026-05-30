/**
 * @file ClientTable.tsx
 * @description Dumb Component encargado exclusivamente de pintar los datos de los clientes.
 * Lee un arreglo dinámico de campos personalizados y genera las columnas bajo demanda.
 */

import React from 'react';
import { IClient } from '../../../../core/services/ClientApiService';
import { CustomField } from '../../../../application/store/useFieldStore';
import { Phone, MessageSquare, RefreshCw, AlertCircle, Type, Hash, Calendar, ChevronDown } from 'lucide-react';

interface ClientTableProps {
  clients: IClient[];
  customFields: CustomField[];
  loading: boolean;
  error: string | null;
  onToggleRegistration: (client: IClient) => Promise<void>;
  onRetry: () => Promise<void>;
  onStartChat: (phoneNumber: string) => void;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients,
  customFields,
  loading,
  error,
  onToggleRegistration,
  onRetry,
  onStartChat,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
}) => {
  
  // --- Helper para íconos de tipos de datos ---
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'number': return <Hash size={14} className="text-blue-500" />;
      case 'date': return <Calendar size={14} className="text-emerald-500" />;
      case 'select': return <ChevronDown size={14} className="text-indigo-500" />;
      default: return <Type size={14} className="text-purple-500" />;
    }
  };

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl p-8 text-center shadow-sm">
        <h3 className="font-bold text-lg flex items-center justify-center gap-2">
          <AlertCircle className="text-rose-500" /> Error de Red / Base de Datos
        </h3>
        <p className="text-sm mt-1">{error}</p>
        <button onClick={onRetry} className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors">
          Reintentar Conexión
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm gap-4">
        <RefreshCw size={32} className="text-indigo-600 animate-spin" />
        <p className="text-sm text-gray-500 font-semibold">Consultando esquema relacional en Postgres...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
              <th className="px-6 py-4">Usuario / Teléfono</th>
              <th className="px-6 py-4">Nombre Registrado</th>
              
              {/* Iteración de Columnas Dinámicas inyectadas desde el Meta-Modelo */}
              {customFields.map((field) => (
                <th key={field.id} className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {renderTypeIcon(field.type)}
                    {field.label}
                  </div>
                </th>
              ))}
              
              <th className="px-6 py-4 text-center">Estado del Saludo</th>
              <th className="px-6 py-4 text-right">Acciones (WhatsApp)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                
                {/* Teléfono */}
                <td className="px-6 py-4 font-mono font-bold text-gray-900">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    {client.phoneNumber}
                  </div>
                </td>

                {/* Nombre */}
                <td className="px-6 py-4">
                  {client.name ? (
                    <span className="font-medium text-gray-800">{client.name}</span>
                  ) : (
                    <span className="text-gray-400 italic font-normal">Anonimizado por FSM</span>
                  )}
                </td>

                {/* Inyección dinámica de valores JSONB */}
                {customFields.map((field) => {
                  const value = client.metadata?.[field.id];
                  return (
                    <td key={field.id} className="px-6 py-4">
                      <span className={value ? 'font-semibold text-gray-800' : 'text-gray-300 italic text-xs'}>
                        {value ? String(value) : '-'}
                      </span>
                    </td>
                  );
                })}

                {/* Estado FSM */}
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                    client.isRegistered
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                      : 'bg-amber-50 border-amber-100 text-amber-700'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${client.isRegistered ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    {client.isRegistered ? 'Recurrente' : 'Primer Contacto'}
                  </span>
                </td>

                {/* Botones de Operación */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onToggleRegistration(client)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all cursor-pointer"
                    >
                      Alternar Estado
                    </button>
                    <button
                      onClick={() => onStartChat(client.phoneNumber)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all shadow-sm border border-emerald-100 flex items-center justify-center cursor-pointer"
                      title="Entablar conversación directa en el Simulador de WhatsApp"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Controles de Paginación */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200/80 bg-gray-50/50">
        <span className="text-sm text-gray-500 font-medium">
          Página {currentPage} de {totalPages || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};
