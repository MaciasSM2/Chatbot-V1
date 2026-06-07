'use client';

/**
 * @file NotificationContext.tsx
 * @description Proveedor global de alertas tácticas en tiempo de ejecución para el Dashboard.
 * Encapsula la visualización de fallos de red e inmuniza la UI contra cuelgues.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'SUCCESS' | 'ERROR' | 'INFO';

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description: string;
}

interface NotificationContextProps {
  notify: (type: ToastType, title: string, description: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * Inyecta de forma atómica una alerta temporizada en la UI de forma Thread-Safe.
   */
  const notify = useCallback((type: ToastType, title: string, description: string) => {
    const id = `TOAST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    setToasts((prev) => [...prev, { id, type, title, description }]);

    // Desvanecer la alerta automáticamente al cabo de 5 segundos para limpiar el DOM
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      
      {/* CONTENEDOR FLOTANTE DE CAPA DE PRESENTACIÓN PERIMETRAL */}
      <div className="fixed bottom-6 right-6 z-[9999] space-y-3 w-full max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3 animate-in slide-in-from-bottom-4 duration-200 bg-[#0b0c0d]/90 text-xs text-text-main ${
              toast.type === 'ERROR' ? 'border-red-500/30 text-red-400' :
              toast.type === 'SUCCESS' ? 'border-brand-primary/30 text-brand-primary' :
              'border-zinc-700/40 text-text-muted'
            }`}
          >
            {/* Selector polimórfico de iconos Lucide */}
            <div className="mt-0.5 shrink-0">
              {toast.type === 'ERROR' && <ShieldAlert size={14} />}
              {toast.type === 'SUCCESS' && <CheckCircle2 size={14} />}
              {toast.type === 'INFO' && <Info size={14} />}
            </div>

            <div className="flex-1 space-y-0.5">
              <span className="font-black uppercase tracking-wider block text-[10px] text-text-main">{toast.title}</span>
              <span className="text-text-muted leading-relaxed block font-medium">{toast.description}</span>
            </div>

            <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-main cursor-pointer mt-0.5">
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

/**
 * Hook de abstracción para consumir el sistema de notificaciones desde cualquier vista.
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications debe utilizarse dentro de un NotificationProvider.');
  return context;
}
