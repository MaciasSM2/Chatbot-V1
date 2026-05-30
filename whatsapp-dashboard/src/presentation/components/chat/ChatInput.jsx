/**
 * @file ChatInput.jsx
 * @description Input de texto clásico de WhatsApp Web con barra de pruebas QuickTest integrada.
 */

import React, { useState } from 'react';
import { Send, Smile, Paperclip, Mic } from 'lucide-react';
import { QuickTestBar } from './QuickTestBar';
import { QuickActionManager } from './QuickActionManager';
import { useChatStore } from '../../../application/store/useChatStore';

export const ChatInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const [showActionManager, setShowActionManager] = useState(false);
  const triggerContinuity = useChatStore((state) => state.triggerContinuity);
  const activeChatId = useChatStore((state) => state.activeChatId);
  const quickActions = useChatStore((state) => state.quickActions);
  const setQuickActions = useChatStore((state) => state.setQuickActions);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleQuickAction = (action) => {
    const { payload, response } = action;
    if (payload === '[TIMEOUT_TRIGGER]') {
      console.log("⚡ Simulando abandono de usuario (Ghosting)...");
      if (activeChatId) {
        triggerContinuity(activeChatId, 5);
      }
    } else {
      onSendMessage(payload, response || null);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="flex flex-col bg-surface-panel w-full select-none relative">
      {/* Barra de Acciones de Prueba Rápidas */}
      <QuickTestBar 
        actions={quickActions} 
        onAction={handleQuickAction} 
        onManageActions={() => setShowActionManager(true)}
      />

      {showActionManager && (
        <QuickActionManager 
          actions={quickActions} 
          setActions={setQuickActions} 
          onClose={() => setShowActionManager(false)}
        />
      )}

      {/* Input de Mensaje Real */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full bg-surface-panel p-3">
        {/* Botones de Emoji y Adjuntos */}
        <div className="flex items-center gap-1.5 shrink-0 text-content-secondary">
          <button 
            type="button"
            className="p-2 hover:bg-white/5 rounded-full hover:text-content-primary transition-colors cursor-pointer active:scale-95" 
            title="Emojis"
          >
            <Smile size={22} />
          </button>
          <button 
            type="button" 
            className="p-2 hover:bg-white/5 rounded-full hover:text-content-primary transition-colors cursor-pointer active:scale-95" 
            title="Adjuntar archivo"
          >
            <Paperclip size={20} className="rotate-45" />
          </button>
        </div>

        {/* Input de Texto */}
        <div className="flex-1 min-w-0">
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="w-full bg-surface-input border border-surface-input text-content-primary placeholder-content-secondary text-[14px] px-4.5 py-2.5 rounded-xl focus:outline-none focus:border-content-secondary/30 focus:ring-1 focus:ring-content-secondary/20 transition-all"
          />
        </div>

        {/* Botón Dinámico: Enviar o Micrófono */}
        <div className="shrink-0">
          {hasText ? (
            <button 
              type="submit" 
              className="p-2.5 rounded-full bg-brand-green text-white hover:brightness-110 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/10"
              title="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          ) : (
            <button 
              type="button" 
              className="p-2.5 rounded-full bg-transparent text-content-secondary hover:bg-white/5 hover:text-content-primary transition-all flex items-center justify-center cursor-pointer active:scale-95"
              title="Grabar mensaje de voz (Simulación)"
            >
              <Mic size={20} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
