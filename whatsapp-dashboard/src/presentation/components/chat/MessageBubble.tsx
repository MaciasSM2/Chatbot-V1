'use client';

import React from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { IMessagePayload } from '../../../application/store/useMessageStore';

interface MessageBubbleProps {
  message: IMessagePayload; // Uso del contrato estricto de dominio de la Fase 53
}

/**
 * @file MessageBubble.tsx
 * @description Componente atomizado y fuertemente tipado en TypeScript.
 * Consume de forma pura las variables semánticas inyectadas en el :root por el Theme Engine.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  const isUserSender = message.sender === 'USER';

  return (
    <div className={`flex w-full mb-4 animate-in fade-in duration-150 ${
      isUserSender ? 'justify-end' : 'justify-start'
    }`}>
      <div
        className={`max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm border transition-all duration-300 relative group ${
          isUserSender 
            ? 'rounded-tr-none text-zinc-900 dark:text-zinc-50' 
            : 'rounded-tl-none border-[var(--border-subtle)] text-zinc-900 dark:text-zinc-100'
        }`}
        style={{
          backgroundColor: isUserSender ? 'var(--theme-bubble-user)' : 'var(--theme-bubble-bot)'
        }}
      >
        {/* TEXTO DEL MENSAJE LOGÍSTICO / COTIZACIÓN SICE-TAC */}
        <p className="text-xs leading-relaxed whitespace-pre-wrap break-words pr-2 font-medium">
          {message.text}
        </p>

        {/* METADATA HORARIA Y CONTROL DE CHECKS DE ENTREGA DE WHATSAPP */}
        <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-text-muted font-mono select-none">
          <span>
            {new Date(message.timestamp).toLocaleTimeString('es-CO', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            })}
          </span>

          {/* Renderizado polimórfico de tiquets de lectura basados en el estado real */}
          {isUserSender && (
            <div className="text-[var(--theme-accent)] shrink-0 ml-0.5">
              {message.status === 'SENT' && <Check size={10} />}
              {(message.status === 'DELIVERED' || message.status === 'READ') && (
                <CheckCheck size={10} className={message.status === 'READ' ? 'text-blue-400' : ''} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
