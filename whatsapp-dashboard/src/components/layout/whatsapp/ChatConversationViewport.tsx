'use client';

import React, { useState } from 'react';
import { Search, MoreVertical, Smile, Plus, Send, Mic, CheckCheck, Clock, X, Trash2 } from 'lucide-react';
import { useWhatsAppLayoutStore } from '../../../application/store/useWhatsAppLayoutStore';
import { useChatExecutionStore } from '../../../application/store/useChatExecutionStore';
import { QuadChatContainer } from '../../chat/QuadChatContainer';
import { WHATSAPP_TOKENS } from '../../../theme/designTokens';

export function ChatConversationViewport() {
  const {
    activeChatId,
    chatSessions,
    conversationSearchQuery,
    isConversationSearchOpen,
    isCustomizationMenuOpen,
    setConversationSearchQuery,
    toggleConversationSearch,
    toggleCustomizationMenu,
  } = useWhatsAppLayoutStore();

  const { sessions, sendMessage, clearSessionMessages, isLoading } = useChatExecutionStore();

  const [inputText, setInputText] = useState('');

  const activeLayoutSession = chatSessions.find((s) => s.id === activeChatId) ?? chatSessions[0];
  const activeExecutionSession = sessions[activeChatId] ?? sessions['chat-js-demo'];

  // Si se selecciona el "Cuarto Chat", renderizar el visor comparativo simultáneo
  if (activeLayoutSession?.engineType === 'QUAD_SIMULTANEOUS') {
    return (
      <main className="flex-1 h-full overflow-hidden bg-[#0b141a]">
        <QuadChatContainer tenantId="tenant-demo-01" />
      </main>
    );
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    void sendMessage(activeChatId, inputText);
    setInputText('');
  };

  const currentMessages = activeExecutionSession?.messages ?? [];

  // Filtrado de mensajes cuando el buscador interno de palabras está activo
  const displayedMessages = conversationSearchQuery.trim().length > 0
    ? currentMessages.filter((m) => m.text.toLowerCase().includes(conversationSearchQuery.toLowerCase()))
    : currentMessages;

  return (
    <main className="flex-1 h-full flex flex-col relative overflow-hidden bg-[#0b141a]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER DEL CHAT ACTIVO */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header
        className="h-16 px-4 flex items-center justify-between border-b shrink-0 z-20"
        style={{
          backgroundColor: WHATSAPP_TOKENS.colors.panelHeader,
          borderColor: WHATSAPP_TOKENS.colors.borderSubtle,
        }}
      >
        <div className="flex items-center gap-3">
          <img
            src={activeLayoutSession?.avatar}
            alt={activeLayoutSession?.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h2 className="text-xs font-bold text-white">{activeLayoutSession?.name}</h2>
            <p className="text-[10px] text-[#8696a0]">
              {isLoading ? (
                <span className="text-[#00a884] font-medium animate-pulse flex items-center gap-1">
                  Escribiendo...
                </span>
              ) : (
                <>En línea • Motor activo: <span className="text-[#00a884] font-mono font-bold">{activeLayoutSession?.engineType}</span></>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[#8696a0]">
          <button
            onClick={toggleConversationSearch}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Buscar palabras clave en la conversación"
          >
            <Search size={18} />
          </button>

          <button
            onClick={() => clearSessionMessages(activeChatId)}
            className="p-2 hover:bg-white/10 hover:text-red-400 rounded-full transition-colors cursor-pointer"
            title="Limpiar conversación"
          >
            <Trash2 size={18} />
          </button>

          <button
            onClick={toggleCustomizationMenu}
            className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            title="Opciones adicionales"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BARRA SUPERIOR DE BÚSQUEDA DE PALABRAS CLAVE */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isConversationSearchOpen && (
        <div className="bg-[#202c33] p-2 px-4 border-b border-white/10 flex items-center gap-2 z-20">
          <Search size={16} className="text-[#8696a0]" />
          <input
            type="text"
            value={conversationSearchQuery}
            onChange={(e) => setConversationSearchQuery(e.target.value)}
            placeholder="Filtrar mensajes por palabra clave..."
            className="flex-1 bg-transparent border-none focus:outline-none text-xs text-white"
          />
          <button onClick={toggleConversationSearch} className="text-[#8696a0] hover:text-white cursor-pointer">
            <X size={16} />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MENÚ DE PERSONALIZACIÓN O OPCIONES */}
      {/* ───────────────────────────────────────────────────────────── */}
      {isCustomizationMenuOpen && (
        <div className="absolute right-4 top-16 bg-[#233138] border border-white/10 rounded-xl shadow-2xl p-2 z-30 w-56 text-xs text-white space-y-1">
          <button
            onClick={() => {
              clearSessionMessages(activeChatId);
              toggleCustomizationMenu();
            }}
            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer"
          >
            Limpiar historial
          </button>
          <button
            onClick={toggleCustomizationMenu}
            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg cursor-pointer text-emerald-400"
          >
            Ver métricas del motor
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* STREAM DE MENSAJES CONECTADO AL BACKEND */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div
        className="flex-1 min-h-0 p-4 md:p-6 overflow-y-auto custom-scrollbar space-y-3 relative"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
          backgroundSize: '16px 16px',
        }}
      >
        {displayedMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#8696a0] text-center">
            No hay mensajes en esta conversación. Escribe una pregunta abajo para iniciar la prueba.
          </div>
        ) : (
          displayedMessages.map((m) => {
            const isUser = m.sender === 'USER';

            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className="max-w-[70%] px-3.5 py-2 rounded-lg text-xs shadow-md leading-relaxed select-text"
                  style={{
                    backgroundColor: isUser
                      ? WHATSAPP_TOKENS.colors.bubbleOutgoing
                      : WHATSAPP_TOKENS.colors.bubbleIncoming,
                    color: WHATSAPP_TOKENS.colors.textPrimary,
                    borderRadius: isUser ? '8px 0px 8px 8px' : '0px 8px 8px 8px',
                  }}
                >
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>

                  {/* TELEMETRÍA DE CADA RESPUESTA DEL BOT */}
                  <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-[#8696a0]">
                    {m.executionTimeMs !== undefined && (
                      <span className="font-mono text-[9px] flex items-center gap-0.5 opacity-80">
                        <Clock size={10} /> {m.executionTimeMs}ms
                      </span>
                    )}

                    {m.totalTokens !== undefined && m.totalTokens > 0 && (
                      <span className="font-mono text-[9px] text-purple-300 bg-purple-950/60 px-1 rounded">
                        {m.totalTokens}tkn (${m.costUsd?.toFixed(5)})
                      </span>
                    )}

                    <span>{m.timestamp}</span>
                    {isUser && <CheckCheck size={14} className="text-[#53bdeb]" />}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* INDICADOR DE ALARMA / BURBUJA TIPO WHATSAPP "ESCRIBIENDO..." (3 PUNTOS ANIMADOS) */}
        {isLoading && (
          <div className="flex flex-col items-start animate-fadeIn">
            <div
              className="px-4 py-2.5 rounded-lg text-xs shadow-md flex items-center gap-1.5 bg-[#202c33] text-[#00a884]"
              style={{ borderRadius: '0px 8px 8px 8px' }}
            >
              <span className="text-[11px] font-medium text-zinc-300">Escribiendo</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* BARRA DE ENTRADA CONECTADA AL BACKEND */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="h-16 px-4 bg-[#202c33] flex items-center gap-3 border-t border-white/10 shrink-0 z-20">
        <button className="text-[#8696a0] hover:text-white cursor-pointer"><Smile size={22} /></button>
        <button className="text-[#8696a0] hover:text-white cursor-pointer"><Plus size={22} /></button>

        <form onSubmit={handleFormSubmit} className="flex-1 flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isLoading ? 'El bot está procesando la respuesta...' : 'Escribe un mensaje para probar el motor actual...'}
            disabled={isLoading}
            className="flex-1 bg-[#2a3942] border-none focus:outline-none rounded-lg px-4 py-2 text-xs text-white placeholder-[#8696a0]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="p-2.5 bg-[#00a884] hover:bg-[#008f70] disabled:opacity-50 text-white rounded-lg transition-all cursor-pointer shadow-md"
          >
            {isLoading ? <Clock size={16} className="animate-spin" /> : inputText.trim() ? <Send size={16} /> : <Mic size={16} />}
          </button>
        </form>
      </footer>
    </main>
  );
}
