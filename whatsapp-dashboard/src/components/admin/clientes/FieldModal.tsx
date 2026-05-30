import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomField } from '../../../application/store/useFieldStore';

interface FieldModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  field?: CustomField;
  onClose: () => void;
  onSave: (label: string, type: 'text' | 'number' | 'date' | 'select', required: boolean) => void;
}

export function FieldModal({
  isOpen,
  mode,
  field,
  onClose,
  onSave,
}: FieldModalProps) {
  const [label, setLabel] = useState<string>(() => (mode === 'edit' && field) ? field.label : '');
  const [type, setType] = useState<'text' | 'number' | 'date' | 'select'>(() => (mode === 'edit' && field) ? field.type : 'text');
  const [required, setRequired] = useState<boolean>(() => (mode === 'edit' && field) ? field.required : false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(label, type, required);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden animate-fadeIn">
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">
              {mode === 'add' ? 'Crear Nuevo Campo' : 'Editar Campo'}
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {mode === 'add'
                ? 'Agrega un nuevo atributo dinámico a tu base de datos.'
                : 'Modifica la etiqueta visual de esta columna.'}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Nombre Visual del Campo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Empresa, Correo, Edad"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800 font-medium"
            />
          </div>

          {mode === 'add' && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Tipo de Información
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800 font-medium bg-white"
              >
                <option value="text">Texto</option>
                <option value="number">Número</option>
                <option value="date">Fecha</option>
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 bg-gray-50 p-3.5 rounded-xl border border-gray-150">
            <input
              type="checkbox"
              id="field-required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="field-required"
              className="text-xs font-bold text-gray-700 cursor-pointer select-none"
            >
              ¿Es campo obligatorio en el formulario?
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl active:scale-95 shadow transition-all"
            >
              Guardar Campo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
