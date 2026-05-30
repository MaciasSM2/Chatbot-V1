import React from 'react';
import { CustomField } from '../../../application/store/useFieldStore';
import { Wrench, Plus, Edit2, Trash2, Hash, Calendar, ChevronDown, Type } from 'lucide-react';

interface CustomFieldsConfigProps {
  customFields: CustomField[];
  onAddField: () => void;
  onEditField: (field: CustomField) => void;
  onRemoveField: (id: string) => void;
}

export function CustomFieldsConfig({
  customFields,
  onAddField,
  onEditField,
  onRemoveField,
}: CustomFieldsConfigProps) {
  
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

  return (
    <div className="bg-white/95 border border-slate-200 shadow-xl rounded-3xl p-6 space-y-6 animate-slideIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <Wrench size={18} className="text-indigo-600" />
            ⚙️ Configuración de Campos Personalizados
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Define qué columnas quieres que tenga tu base de datos de clientes. El sistema generará los inputs y visualizadores en tiempo real.
          </p>
        </div>
        <button
          onClick={onAddField}
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
        >
          <Plus size={14} />
          Agregar Campo Nuevo
        </button>
      </div>

      {/* Listado de Campos en Configuración */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customFields.length === 0 ? (
          <div className="col-span-full py-8 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-sm text-gray-400 italic">No hay campos dinámicos definidos. ¡Crea el primero!</p>
          </div>
        ) : (
          customFields.map((field) => (
            <div
              key={field.id}
              className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200/80 rounded-2xl hover:shadow-sm hover:border-slate-300 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
                  {renderTypeIcon(field.type)}
                </div>
                <div>
                  <span className="font-bold text-sm text-gray-800">{field.label}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400 font-medium uppercase bg-white border px-1.5 py-0.5 rounded">
                      ID: {field.id}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {field.type === 'text'
                        ? 'Texto'
                        : field.type === 'number'
                        ? 'Número'
                        : field.type === 'date'
                        ? 'Fecha'
                        : 'Lista Desplegable'}
                    </span>
                  </div>
                </div>
              </div>
              {field.fixed ? (
                <div className="text-gray-400 p-1.5 flex items-center gap-1" title="Campo obligatorio y fijo del sistema">
                  <span className="text-[10px] font-bold text-gray-400 font-sans">Sistema</span>
                  <span>🔒</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditField(field)}
                    type="button"
                    className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Editar nombre visual"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => onRemoveField(field.id)}
                    type="button"
                    className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Ocultar de la vista"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
