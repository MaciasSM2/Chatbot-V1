/**
 * @file QuickActionManager.jsx
 * @description CRUD Modal para gestionar las acciones y respuestas de prueba en el simulador.
 */

import React, { useState } from 'react';
import { Plus, Trash2, Edit3, X, MousePointer2, AlertCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

export const ICON_LIBRARY = {
  Zap: Icons.Zap,
  Shield: Icons.Shield,
  Ghost: Icons.Ghost,
  AlertTriangle: Icons.AlertTriangle,
  CreditCard: Icons.CreditCard,
  HelpCircle: Icons.HelpCircle,
  Activity: Icons.Activity,
  Flame: Icons.Flame,
  Bug: Icons.Bug,
  Terminal: Icons.Terminal
};

export const QuickActionManager = ({ actions, setActions, onClose }) => {
  const [newAction, setNewAction] = useState({ label: '', payload: '', response: '' });
  const [selectedIcon, setSelectedIcon] = useState('Zap');
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (!newAction.label.trim() || !newAction.payload.trim()) {
      setError('La etiqueta y el trigger son obligatorios.');
      return;
    }
    setError('');
    setActions([...actions, { ...newAction, icon: selectedIcon, id: `action_${Date.now()}` }]);
    setNewAction({ label: '', payload: '', response: '' });
    setSelectedIcon('Zap');
  };

  const handleDelete = (id) => {
    setActions(actions.filter(a => a.id !== id));
  };

  return (
    <div className="absolute inset-0 bg-surface-main/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-surface-header rounded-[32px] shadow-2xl border border-border-subtle overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="p-6 bg-surface-header border-b border-border-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
              <Edit3 size={18} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-content-primary uppercase tracking-wider">Gestión de Acciones de Prueba</h3>
              <p className="text-[10px] text-content-secondary">Personaliza botones rápidos y sus respuestas automáticas simuladas.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-content-secondary hover:text-content-primary hover:bg-white/5 rounded-full transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido principal con scroll */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface-panel">
          
          {/* Listado de botones actuales */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-content-secondary uppercase tracking-widest">Botones de Test Activos ({actions.length})</h4>
            
            <div className="grid grid-cols-1 gap-2.5">
              {actions.map((action) => (
                <div 
                  key={action.id} 
                  className="flex items-center justify-between bg-surface-header/70 hover:bg-surface-header p-4 rounded-2xl border border-border-subtle transition-all group shadow-sm"
                >
                  <div className="flex-1 grid grid-cols-3 gap-4 mr-4">
                    <div>
                      <span className="text-[8px] font-bold text-content-secondary/70 uppercase block tracking-wider mb-0.5">Etiqueta</span>
                      <span className="text-xs font-bold text-content-primary flex items-center gap-2">
                        {(() => {
                          const IconComp = ICON_LIBRARY[action.icon] || Icons.HelpCircle;
                          return <IconComp size={14} className="text-emerald-400 shrink-0" />;
                        })()}
                        {action.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-content-secondary/70 uppercase block tracking-wider mb-0.5">Trigger (Usuario)</span>
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 inline-block max-w-full truncate">{action.payload}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-content-secondary/70 uppercase block tracking-wider mb-0.5">Respuesta (Bot)</span>
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
                <p className="text-xs text-content-secondary/70 italic text-center py-8 border border-dashed border-border-subtle rounded-2xl bg-white/[0.01]">
                  No hay botones configurados. ¡Agrega uno abajo!
                </p>
              )}
            </div>
          </div>

          {/* Formulario para agregar */}
          <div className="bg-surface-header/50 p-5 rounded-2xl border border-dashed border-border-subtle space-y-4">
            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Plus size={12} /> Agregar Nueva Acción de Test
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-content-secondary uppercase tracking-wider block">Nombre del Botón *</label>
                <input 
                  placeholder="Ej: Saludo Informal"
                  className="w-full bg-surface-panel border border-border-subtle text-content-primary placeholder-content-secondary px-4 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500/50 transition-colors"
                  value={newAction.label}
                  onChange={e => setNewAction({...newAction, label: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-content-secondary uppercase tracking-wider block">Trigger / Entrada de Usuario *</label>
                <input 
                  placeholder="Ej: qué onda bot"
                  className="w-full bg-surface-panel border border-border-subtle text-content-primary placeholder-content-secondary px-4 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500/50 transition-colors font-mono"
                  value={newAction.payload}
                  onChange={e => setNewAction({...newAction, payload: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-bold text-content-secondary uppercase tracking-wider block">Respuesta Automática del Bot (Opcional)</label>
              <textarea 
                placeholder="Deja vacío para procesar con la lógica normal de la FSM / Levenshtein. Escribe una respuesta para forzarla."
                className="w-full bg-surface-panel border border-border-subtle text-content-primary placeholder-content-secondary px-4 py-2.5 rounded-xl text-xs outline-none focus:border-emerald-500/50 transition-colors h-20 resize-none custom-scrollbar"
                value={newAction.response}
                onChange={e => setNewAction({...newAction, response: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-content-secondary uppercase tracking-wider block">Seleccionar Icono del Botón</label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 bg-surface-panel p-3 rounded-2xl border border-border-subtle">
                {Object.keys(ICON_LIBRARY).map((iconName) => {
                  const IconComp = ICON_LIBRARY[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={`p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer active:scale-90 ${
                        selectedIcon === iconName 
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_2px_8px_rgba(16,185,129,0.1)] border-emerald-500/30' 
                          : 'border-border-subtle bg-surface-raised/40 text-content-secondary hover:text-content-primary hover:border-content-secondary/30'
                      }`}
                      title={iconName}
                    >
                      <IconComp size={16} />
                    </button>
                  );
                })}
              </div>
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
