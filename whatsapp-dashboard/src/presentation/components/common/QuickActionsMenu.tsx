'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, RefreshCw, Trash2, Sliders, Link as LinkIcon } from 'lucide-react';
import { useChatStore } from '../../../application/store/useChatStore';
import { executeSecureRequest, getApiUrl } from '../../../core/apiClient';

interface QuickActionCommand {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  action: () => Promise<void>;
}

/**
 * @component QuickActionsMenu
 * @description Panel flotante que unifica tareas críticas de depuración y testing de la FSM y MariaDB.
 */
export const QuickActionsMenu: React.FC = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);

  // Registro de Comandos bajo abstracción de comportamiento
  const actions: QuickActionCommand[] = [
    {
      id: 'reset_sim',
      label: 'Reiniciar Simulador',
      description: 'Limpia el estado de Zustand del chat local.',
      icon: <RefreshCw size={16} />,
      action: async () => {
        const { activeChatId, resetChat } = useChatStore.getState();
        if (activeChatId) {
          await resetChat(activeChatId);
        } else {
          alert('Por favor selecciona una conversación activa primero.');
        }
      }
    },
    {
      id: 'clear_mariadb_logs',
      label: 'Vaciar Historial de Pruebas',
      description: 'Borra mensajes de sesiones de prueba en MariaDB sin alterar plantillas.',
      icon: <Trash2 size={16} />,
      action: async () => {
        const API_URL = getApiUrl();
        await executeSecureRequest(`${API_URL}/test/clear-logs`, { method: 'POST' });
        const { loadActiveChats, messages, activeChatId, loadChatHistory } = useChatStore.getState();
        await loadActiveChats();
        if (activeChatId) {
          await loadChatHistory(activeChatId);
        }
      }
    },
    {
      id: 'force_early_morning',
      label: 'Forzar Modo Madrugada',
      description: 'Simula instantáneamente las 03:00 AM para validar la respuesta del bot.',
      icon: <Sliders size={16} />,
      action: async () => {
        const API_URL = getApiUrl();
        await executeSecureRequest(`${API_URL}/test/force-hour`, {
          method: 'POST',
          body: JSON.stringify({ hour: 3 })
        });
      }
    },
    {
      id: 'restore_normal_time',
      label: 'Restaurar Hora Normal',
      description: 'Permite al bot utilizar el reloj del sistema de nuevo.',
      icon: <Sliders size={16} />,
      action: async () => {
        const API_URL = getApiUrl();
        await executeSecureRequest(`${API_URL}/test/force-hour`, {
          method: 'POST',
          body: JSON.stringify({ hour: null })
        });
      }
    }
  ];

  const handleExecuteCommand = async (command: QuickActionCommand) => {
    setExecutingId(command.id);
    try {
      await command.action();
    } catch (err) {
      console.error(`Fallo de comando ${command.id}:`, err);
    } finally {
      setExecutingId(null);
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-background-panel font-bold px-4 py-2.5 rounded-xl text-xs tracking-wider transition-all shadow-lg shadow-brand-primary/10 active:scale-95 cursor-pointer"
      >
        <Zap size={14} className={isOpen ? 'animate-bounce' : ''} />
        ACCIONES RÁPIDAS
      </button>

      {isOpen && (
        <>
          {/* Backdrop para control de cierre fuera de foco */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          
          <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-brand-primary/20 bg-bg-panel/95 backdrop-blur-xl p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-border-subtle mb-2">
              <span className="text-[9px] font-black text-brand-primary tracking-widest uppercase block">Operaciones Críticas</span>
            </div>

            <div className="space-y-1">
              {actions.map((cmd) => (
                <button
                  key={cmd.id}
                  disabled={executingId !== null}
                  onClick={() => handleExecuteCommand(cmd)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-primary/10 text-text-main hover:text-brand-primary transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-bg-header group-hover:bg-transparent text-text-main group-hover:text-brand-primary transition-colors shrink-0">
                    {cmd.icon}
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">{cmd.label}</span>
                    <span className="text-[9px] text-text-muted block mt-0.5 leading-tight group-hover:text-brand-primary/80 transition-colors">{cmd.description}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Jumps Section */}
            <div className="px-3 py-2 border-t border-border-subtle mt-3 pt-3 mb-1">
              <span className="text-[9px] font-black text-brand-primary tracking-widest uppercase block">Quick Jump</span>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => { router.push('/admin/configuracion'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-primary/10 text-text-main hover:text-brand-primary transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-bg-header group-hover:bg-transparent text-text-main group-hover:text-brand-primary transition-colors shrink-0">
                  <LinkIcon size={14} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">Forzar Madrugada</span>
                  <span className="text-[9px] text-text-muted block mt-0.5 leading-tight group-hover:text-brand-primary/80 transition-colors">Link a Configuración</span>
                </div>
              </button>

              <button
                onClick={() => { router.push('/admin/calendario'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-primary/10 text-text-main hover:text-brand-primary transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-bg-header group-hover:bg-transparent text-text-main group-hover:text-brand-primary transition-colors shrink-0">
                  <LinkIcon size={14} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">Nueva Excepción</span>
                  <span className="text-[9px] text-text-muted block mt-0.5 leading-tight group-hover:text-brand-primary/80 transition-colors">Link a Calendario</span>
                </div>
              </button>

              <button
                onClick={() => { router.push('/'); setIsOpen(false); }}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-brand-primary/10 text-text-main hover:text-brand-primary transition-all group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-bg-header group-hover:bg-transparent text-text-main group-hover:text-brand-primary transition-colors shrink-0">
                  <LinkIcon size={14} />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">Debug FSM</span>
                  <span className="text-[9px] text-text-muted block mt-0.5 leading-tight group-hover:text-brand-primary/80 transition-colors">Link a Simulador</span>
                </div>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};
