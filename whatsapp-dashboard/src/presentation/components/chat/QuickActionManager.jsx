/**
 * @file QuickActionManager.jsx
 * @description CRUD Modal para gestionar las acciones y respuestas de prueba en el simulador.
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X, MousePointer2, AlertCircle } from 'lucide-react';

export const QuickActionManager = ({ actions, setActions, onClose }) => {
  const [newAction, setNewAction] = useState({ label: '', payload: '', response: '' });
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!newAction.label.trim() || !newAction.payload.trim()) {
      setError('La etiqueta y el trigger son obligatorios.');
      return;
    }
    setError('');
    setActions([...actions, { ...newAction, id: `action_${Date.now()}` }]);
    setNewAction({ label: '', payload: '', response: '' });
  };

  const handleDelete = (id) => {
    setActions(actions.filter(a => a.id !== id));
  };

  return (
    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-[#1f2c34] rounded-[32px] shadow-2xl border border-white/10 overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="p-6 bg-[#202c33] border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Edit3 size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Gestión de Acciones de Prueba</h3>
              <p className="text-[10px] text-slate-400">Personaliza botones rápidos y sus respuestas automáticas simuladas.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido principal con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#111b21]">
          
          {/* Listado de botones actuales */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Botones de Test Activos ({actions.length})</h4>
            
            <div className="grid grid-cols-1 gap-2.5">
              {actions.map((action) => (
                <div 
                  key={action.id} 
                  className="flex items-center justify-between bg-[#202c33]/70 hover:bg-[#202c33] p-4 rounded-2xl border border-white/5 transition-all group shadow-sm"
                >
                  <div className="flex-1 grid grid-cols-3 gap-4 mr-4">
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider mb-0.5">Etiqueta</span>
                      <span className="text-xs font-bold text-slate-200">{action.label}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider mb-0.5">Trigger (Usuario)</span>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 inline-block max-w-full truncate">{action.payload}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase block tracking-wider mb-0.5">Respuesta (Bot)</span>
                      <span className="text-xs text-emerald-400 italic block truncate max-w-full" title={action.response}>
                        {action.response ? `"${action.response.substring(0, 30)}..."` : 'Lógica Normal (FSM)'}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(action.id)} 
                    className="p-2 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-xl transition-all cursor-pointer opacity-80 hover:opacity-100 shrink-0"
                    title="Eliminar botón"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              
              {actions.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-8 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
                  No hay botones configurados. ¡Agrega uno abajo!
                </p>
              )}
            </div>
          </div>

          {/* Formulario para agregar */}
          <div className="bg-[#202c33]/50 p-5 rounded-2xl border border-dashed border-white/10 space-y-4">
            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Plus size={12} /> Agregar Nueva Acción de Test
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nombre del Botón *</label>
                <input 
                  placeholder="Ej: Saludo Informal"
                  className="w-full bg-[#111b21] border border-white/5 text-slate-200 placeholder-slate-500 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500/50 transition-colors"
                  value={newAction.label}
                  onChange={e => setNewAction({...newAction, label: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Trigger / Entrada de Usuario *</label>
                <input 
                  placeholder="Ej: qué onda bot"
                  className="w-full bg-[#111b21] border border-white/5 text-slate-200 placeholder-slate-500 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500/50 transition-colors font-mono"
                  value={newAction.payload}
                  onChange={e => setNewAction({...newAction, payload: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Respuesta Automática del Bot (Opcional)</label>
              <textarea 
                placeholder="Deja vacío para procesar con la lógica normal de la FSM / Levenshtein. Escribe una respuesta para forzarla."
                className="w-full bg-[#111b21] border border-white/5 text-slate-200 placeholder-slate-500 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500/50 transition-colors h-20 resize-none custom-scrollbar"
                value={newAction.response}
                onChange={e => setNewAction({...newAction, response: e.target.value})}
              />
            </div>

            {error && (
              <div className="text-[10px] text-rose-400 font-bold flex items-center gap-1.5 animate-pulse">
                <AlertCircle size={12} />
                {error}
              </div>
            )}

            <button 
              onClick={handleAdd}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/20"
            >
              <Plus size={15} /> GUARDAR ACCIÓN DE TEST
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
