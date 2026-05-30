import React from 'react';
import { Check, CheckCheck, Shield } from 'lucide-react';
import { useChatStore } from '../../../application/store/useChatStore';

export const MessageBubble = ({ message }) => {
  const highlightedMessageId = useChatStore(state => state.highlightedMessageId);
  const isSystem = message.sender === 'system';
  
  if (isSystem) {
    return (
      <div 
        id={`msg-${message.id}`}
        className="flex w-full justify-center mb-3 px-4 animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="bg-surface-raised/90 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 select-none backdrop-blur-sm max-w-[90%] text-center leading-normal">
          <Shield size={12} className="shrink-0" />
          <span>{message.text}</span>
        </div>
      </div>
    );
  }

  const isBot = message.isFromBot;
  const isHighlighted = highlightedMessageId === message.id;

  return (
    <div 
      id={`msg-${message.id}`}
      className={`flex w-full ${isBot ? 'justify-start' : 'justify-end'} mb-2.5 px-2 animate-in fade-in slide-in-from-bottom-1 duration-200`}
    >
      <div 
        className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-md border transition-all duration-300 hover:shadow-lg ${
          isHighlighted
            ? 'bg-amber-500/20 text-content-primary rounded-2xl border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.45)] ring-2 ring-amber-500/30'
            : isBot 
              ? 'bg-bubble-bot text-content-primary rounded-tl-none border-border-subtle' 
              : 'bg-bubble-user text-content-primary rounded-tr-none border-border-subtle'
        }`}
      >
        {/* Cuerpo del Mensaje */}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed select-text pr-1">
          {message.text}
        </p>

        {/* Metadatos (Hora y Checkmarks) */}
        <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] select-none text-content-secondary/80 leading-none">
          <span>{message.formattedTime}</span>
          {isBot && message.text && message.text.includes("[TEST-COLOMBIA]") && (
            <span className="bg-emerald-500/10 border border-emerald-500/20 text-brand-green text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider shrink-0 ml-1 shadow-[0_0_8px_rgba(52,211,153,0.05)] select-none">
              AUTO-DATA
            </span>
          )}
          {!isBot && (
            <span className="flex items-center">
              {message.status === 'sending' ? (
                <span className="opacity-50 text-[10px] animate-pulse" title="Enviando...">🕒</span>
              ) : message.status === 'read' ? (
                <CheckCheck size={14} className="text-sky-400 font-bold" title="Leído (Doble Check Azul)" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={14} className="text-content-secondary" title="Entregado (Doble Check Gris)" />
              ) : (
                <Check size={14} className="text-content-secondary" title="Enviado (Un Check Gris)" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

