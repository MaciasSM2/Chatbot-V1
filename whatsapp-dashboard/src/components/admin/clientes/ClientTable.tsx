import React, { useState } from 'react';
import { IClient } from '../../../core/services/ClientApiService';
import { CustomField } from '../../../application/store/useFieldStore';
import {
  Phone,
  Edit2,
  Check,
  X,
  MessageSquare,
  Hash,
  Calendar,
  ChevronDown,
  Type,
  RotateCcw
} from 'lucide-react';

interface ClientTableProps {
  clients: IClient[];
  customFields: CustomField[];
  onStartChat: (phoneNumber: string) => void;
  onToggleRegistration: (client: IClient) => Promise<void>;
  onSaveRow: (client: IClient, name: string, metadata: Record<string, any>) => Promise<void>;
  onResetSession: (client: IClient) => Promise<void>;
  totalClients: number;
}

export function ClientTable({
  clients,
  customFields,
  onStartChat,
  onToggleRegistration,
  onSaveRow,
  onResetSession,
  totalClients,
}: ClientTableProps) {
  // Estado de edición en línea local de la tabla
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [editingMetadata, setEditingMetadata] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Inicio de edición inline
  const handleStartEdit = (client: IClient) => {
    setEditingId(client.id);
    setEditingName(client.name || '');
    setEditingMetadata(client.metadata || {});
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingMetadata({});
  };

  const handleSave = async (client: IClient) => {
    setSavingId(client.id);
    try {
      await onSaveRow(client, editingName, editingMetadata);
      setEditingId(null);
    } catch (err) {
      // El error se gestionará en el controlador de la página principal
    } finally {
      setSavingId(null);
    }
  };

  // Iconos visuales para tipos de datos
  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash size={14} className="text-blue-500" />;
      case 'date':
        return <Calendar size={14} className="text-emerald-500" />;
      case 'select':
        return <ChevronDown size={14} className="text-indigo-500" />;
      default:
        return <Type size={14} className="text-purple-500" />;
    }
  };

  // Renderizador de Badges de la FSM
  const renderFsmBadge = (state?: string | null) => {
    switch (state) {
      case 'WELCOME':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border bg-blue-500/10 border-blue-500/30 text-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.15)] select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            WELCOME
          </span>
        );
      case 'AWAITING_NAME':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border bg-amber-500/10 border-amber-500/30 text-amber-600 shadow-[0_0_12px_rgba(245,158,11,0.15)] select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            AWAITING NAME
          </span>
        );
      case 'AWAITING_MENU_OPTION':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold border bg-purple-500/10 border-purple-500/30 text-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.15)] select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse"></span>
            AWAITING OPTION
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-100 border-slate-200 text-slate-400 select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
            Inactivo
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-500">
              <th className="px-6 py-4">Usuario / Teléfono</th>
              <th className="px-6 py-4">Nombre Registrado</th>

              {/* Render de Columnas Dinámicas definidas por el Admin */}
              {customFields.map((field) => (
                <th key={field.id} className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    {renderTypeIcon(field.type)}
                    {field.label}
                  </div>
                </th>
              ))}

              <th className="px-6 py-4 text-center">Estado Conversación (FSM)</th>
              <th className="px-6 py-4 text-center">Estado del Saludo</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {clients.map((client) => {
              const isEditing = editingId === client.id;
              const isSaving = savingId === client.id;

              return (
                <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                  {/* Teléfono */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onStartChat(client.phoneNumber)}
                        type="button"
                        className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-105 transition-transform cursor-pointer hover:bg-emerald-50 hover:text-emerald-600"
                        title="Click para iniciar chat"
                      >
                        <Phone size={16} />
                      </button>
                      <button
                        onClick={() => onStartChat(client.phoneNumber)}
                        type="button"
                        className="cursor-pointer text-blue-600 hover:underline hover:text-blue-800 font-bold bg-transparent border-none p-0 text-left"
                        title="Click para iniciar chat"
                      >
                        {client.phoneNumber}
                      </button>
                    </div>
                  </td>

                  {/* Nombre (Edición inline) */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="px-3 py-1.5 border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-lg text-sm bg-white text-gray-800 font-semibold"
                        placeholder="Ingresa nombre..."
                        disabled={isSaving}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSave(client);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        {client.name ? (
                          <span className="font-medium text-gray-800">{client.name}</span>
                        ) : (
                          <span className="text-gray-400 italic font-normal">Sin nombre registrado</span>
                        )}
                        <button
                          onClick={() => handleStartEdit(client)}
                          type="button"
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 p-1 rounded transition-all hover:bg-indigo-50"
                          title="Editar fila"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Valores de Campos Dinámicos */}
                  {customFields.map((field) => {
                    const value = (client.metadata && client.metadata[field.id]) ?? '';
                    return (
                      <td key={field.id} className="px-6 py-4">
                        {isEditing ? (
                          field.type === 'select' ? (
                            <select
                              value={editingMetadata[field.id] || ''}
                              onChange={(e) =>
                                setEditingMetadata({
                                  ...editingMetadata,
                                  [field.id]: e.target.value,
                                })
                              }
                              disabled={isSaving}
                              className="w-full max-w-xs px-2.5 py-1.5 border border-indigo-400 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white text-gray-700 font-medium"
                            >
                              <option value="">Seleccionar...</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type}
                              value={editingMetadata[field.id] || ''}
                              onChange={(e) =>
                                setEditingMetadata({
                                  ...editingMetadata,
                                  [field.id]: e.target.value,
                                })
                              }
                              disabled={isSaving}
                              className="w-full max-w-xs px-2.5 py-1.5 border border-indigo-400 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:outline-none bg-white text-gray-700 font-medium"
                              placeholder={`Ingresar ${field.label.toLowerCase()}`}
                            />
                          )
                        ) : (
                          <span
                            className={
                              value ? 'font-semibold text-gray-800' : 'text-gray-300 italic text-xs'
                            }
                          >
                            {value ? String(value) : '-'}
                          </span>
                        )}
                      </td>
                    );
                  })}

                  {/* Estado Conversación (FSM) */}
                  <td className="px-6 py-4 text-center">
                    {renderFsmBadge(client.state)}
                  </td>

                  {/* Estado del Saludo */}
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        client.isRegistered
                          ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          client.isRegistered ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      ></span>
                      {client.isRegistered
                        ? 'Registrado (Saludo Recurrente)'
                        : 'No Registrado (Saludo Inicial)'}
                    </span>
                  </td>

                  {/* Botones de acción */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSave(client)}
                            disabled={isSaving}
                            type="button"
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                            title="Guardar todo"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            type="button"
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onToggleRegistration(client)}
                            type="button"
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              client.isRegistered
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/50'
                            }`}
                          >
                            {client.isRegistered ? 'Marcar No Registrado' : 'Marcar Registrado'}
                          </button>

                          <button
                            onClick={() => onStartChat(client.phoneNumber)}
                            type="button"
                            className="p-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-lg transition-all shadow-sm border border-emerald-100 flex items-center justify-center cursor-pointer active:scale-95 duration-200 shrink-0"
                            title="Entablar conversación directa en el Simulador"
                          >
                            <MessageSquare size={16} />
                          </button>

                          <button
                            onClick={() => onResetSession(client)}
                            type="button"
                            className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-lg transition-all shadow-sm border border-rose-100 flex items-center justify-center cursor-pointer active:scale-95 duration-200 shrink-0"
                            title="Resetear Sesión del Cliente (FSM y Mensajes)"
                          >
                            <RotateCcw size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer de la Tabla */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between text-xs text-gray-500 font-semibold">
        <span>
          Mostrando {clients.length} de {totalClients} clientes en total
        </span>
        <span>Conexión PostgreSQL real</span>
      </div>
    </div>
  );
}

