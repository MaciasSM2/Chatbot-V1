'use client';

/**
 * @file ClientFormModal.tsx
 * @description Dumb Component que renderiza un formulario dinámico basado en el store de campos.
 * Soporta creación y edición (Upsert) de metadatos JSONB para el ecosistema de WhatsApp.
 */

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, Phone, User } from 'lucide-react';
import { IClient } from '../../../../core/services/ClientApiService';
import { CustomField } from '../../../../application/store/useFieldStore';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<IClient>) => Promise<void>;
  editingClient?: IClient | null;
  customFields: CustomField[];
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen, onClose, onSave, editingClient, customFields
}) => {
  const [formData, setFormData] = useState<Partial<IClient>>(() => editingClient || {
    phoneNumber: '',
    name: '',
    isRegistered: false,
    metadata: {}
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
    onClose();
  };

  const handleMetadataChange = (id: string, value: string) => {
    setFormData({
      ...formData,
      metadata: { ...formData.metadata, [id]: value }
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
        {/* Header con estilo Dark para contraste */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <UserPlus size={20} />
            </div>
            <h3 className="font-bold text-lg">
              {editingClient ? 'Editar Perfil Cliente' : 'Nuevo Registro WhatsApp'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Campos Core */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block tracking-widest">Identificador (Teléfono) *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  required
                  disabled={!!editingClient}
                  placeholder="Ej: +573001234567"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-semibold"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5 block tracking-widest">Nombre Completo</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  placeholder="Nombre de contacto..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Renderizado Dinámico de Metadatos JSONB */}
          {customFields.length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Información de CRM Adicional</h4>
              {customFields.map((field) => (
                <div key={field.id}>
                  <label className="text-[10px] font-bold text-slate-500 mb-1 block">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.metadata?.[field.id] || ''}
                      onChange={(e) => handleMetadataChange(field.id, e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={formData.metadata?.[field.id] || ''}
                      onChange={(e) => handleMetadataChange(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </form>

        <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
            Cancelar
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Save size={18} />
            {editingClient ? 'Actualizar Cliente' : 'Guardar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
};
