import React, { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { CustomField } from '../../../application/store/useFieldStore';

interface CreateClientModalProps {
  isOpen: boolean;
  customFields: CustomField[];
  onClose: () => void;
  onCreate: (
    phoneNumber: string,
    name: string,
    isRegistered: boolean,
    metadata: Record<string, any>
  ) => Promise<void>;
}

export function CreateClientModal({
  isOpen,
  customFields,
  onClose,
  onCreate,
}: CreateClientModalProps) {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleMetadataChange = (fieldId: string, value: string) => {
    setMetadata((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setSubmitting(true);
    try {
      await onCreate(phoneNumber.trim(), name.trim(), isRegistered, metadata);
      onClose();
    } catch (err) {
      // El error se manejará en el componente padre mostrando el toast
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="bg-indigo-950 text-white p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Registrar Nuevo Cliente</h3>
            <p className="text-xs text-indigo-200 mt-0.5">
              El formulario se adaptará a los metadatos que hayas configurado.
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-indigo-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Número de Teléfono *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Phone size={16} />
              </span>
              <input
                type="text"
                required
                placeholder="Ej. +5215512345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Nombre Completo
            </label>
            <input
              type="text"
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-semibold"
            />
          </div>

          {/* RENDERIZADO DINÁMICO DE CAMPOS ADICIONALES */}
          {customFields.length > 0 && (
            <div className="border-t border-gray-150 pt-4 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-1.5">
                <span>📋</span> Campos Personalizados
              </h4>

              {customFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {field.label} {field.required ? '*' : ''}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      value={metadata[field.id] || ''}
                      onChange={(e) => handleMetadataChange(field.id, e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium bg-white"
                    >
                      <option value="">Seleccione una opción...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      value={metadata[field.id] || ''}
                      onChange={(e) => handleMetadataChange(field.id, e.target.value)}
                      placeholder={`Ingrese ${field.label.toLowerCase()}`}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 font-medium"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200/50">
            <input
              type="checkbox"
              id="new-is-registered"
              checked={isRegistered}
              onChange={(e) => setIsRegistered(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="new-is-registered"
              className="text-sm font-semibold text-gray-700 cursor-pointer select-none"
            >
              Marcar como ya registrado (Recibe Saludo Recurrente)
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-500/10 active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
