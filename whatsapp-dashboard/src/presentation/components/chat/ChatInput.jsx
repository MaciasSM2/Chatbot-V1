/**
 * @file ChatInput.jsx
 * @description Input de texto clásico de WhatsApp Web con barra de pruebas QuickTest integrada.
 */

import React, { useState } from 'react';
import { Send, Smile, Paperclip, Mic } from 'lucide-react';
import { QuickTestBar } from './QuickTestBar';
import { useChatStore } from '../../../application/store/useChatStore';

export const ChatInput = ({ onSendMessage }) => {
  const [text, setText] = useState('');
  const triggerContinuity = useChatStore((state) => state.triggerContinuity);
  const activeChatId = useChatStore((state) => state.activeChatId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleQuickAction = (payload) => {
    if (payload === '[TIMEOUT_TRIGGER]') {
      console.log("⚡ Simulando abandono de usuario (Ghosting)...");
      if (activeChatId) {
        triggerContinuity(activeChatId, 5);
      }
    } else {
      onSendMessage(payload);
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="flex flex-col bg-[#111b21] w-full select-none">
      {/* Barra de Acciones de Prueba Rápidas */}
      <QuickTestBar onAction={handleQuickAction} />

      {/* Input de Mensaje Real */}
      <form onSubmit={handleSubmit} className="flex items-center gap-3 w-full bg-[#111b21] p-3">
        {/* Botones de Emoji y Adjuntos */}
        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          <button 
            type="button"
            className="p-2 hover:bg-white/5 rounded-full hover:text-slate-200 transition-colors cursor-pointer active:scale-95" 
            title="Emojis"
          >
            <Smile size={22} />
          </button>
          <button 
            type="button" 
            className="p-2 hover:bg-white/5 rounded-full hover:text-slate-200 transition-colors cursor-pointer active:scale-95" 
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
            className="w-full bg-[#2a3942] border border-[#2a3942] text-[#e9edef] placeholder-[#8696a0] text-[14px] px-4.5 py-2.5 rounded-xl focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-slate-700/50 transition-all"
          />
        </div>

        {/* Botón Dinámico: Enviar o Micrófono */}
        <div className="shrink-0">
          {hasText ? (
            <button 
              type="submit" 
              className="p-2.5 rounded-full bg-[#00a884] text-white hover:bg-[#00c298] transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer shadow-md shadow-emerald-500/10"
              title="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          ) : (
            <button 
              type="button" 
              className="p-2.5 rounded-full bg-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all flex items-center justify-center cursor-pointer active:scale-95"
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
