'use client';

import React, { useState } from 'react';
import { Send, Cpu, Zap, Bot, Trash2, DollarSign, Clock, Layers } from 'lucide-react';
import { useMultiChatStore, IChatMessageNode } from '../../application/store/useMultiChatStore';
import { useBotEngineStore } from '../../application/store/useBotEngineStore';

export type MuestraViewMode = 'ALL_QUAD' | 'CHAT1_JS' | 'CHAT2_HYBRID' | 'CHAT3_FULL_AI';

export function QuadChatContainer({ tenantId }: { tenantId: string }) {
  const [viewMode, setViewMode] = useState<MuestraViewMode>('ALL_QUAD');

  const {
    inputText,
    isLoading: isMultiLoading,
    chat1Messages,
    chat2Messages,
    chat3Messages,
    accumulatedTokens,
    accumulatedCostUsd,
    setInputText,
    sendSimultaneousMessage,
    clearAllTimelines,
  } = useMultiChatStore();

  const {
    messages: singleBotMessages,
    sendMessage: sendSingleBotMessage,
    resetChat: resetSingleChat,
    isLoading: isSingleLoading,
  } = useBotEngineStore();

  const [singleInput, setSingleInput] = useState('');

  const handleSimultaneousSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isMultiLoading) return;
    sendSimultaneousMessage(tenantId);
  };

  const handleSingleSubmit = async (e: React.FormEvent, botType: 'JS' | 'HYBRID' | 'FULL_AI') => {
    e.preventDefault();
    if (!singleInput.trim() || isSingleLoading) return;
    const text = singleInput;
    setSingleInput('');
    useBotEngineStore.getState().setActiveBotType(botType);
    await sendSingleBotMessage(text);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#0b141a] text-white p-2 sm:p-2.5 gap-2 font-sans select-none overflow-hidden min-h-0">
      
      {/* CABECERA SUPERIOR Y SELECTOR DE MODO OPTIMIZADO */}
      <header className="flex flex-wrap lg:flex-nowrap items-center justify-between bg-[#141517] border border-white/10 rounded-lg px-3 py-1.5 gap-2 shadow-lg shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1.5 bg-[#00a884]/10 border border-[#00a884]/20 rounded-md text-[#00a884] shrink-0">
            <Bot size={16} />
          </div>
          <div>
            <h1 className="text-xs font-extrabold uppercase tracking-wider text-white whitespace-nowrap">
              Entorno Interactivo de Muestras
            </h1>
            <p className="text-[10px] text-[#8696a0] whitespace-nowrap hidden sm:block">
              Evalúa los 4 chats en simultáneo o cada motor individual
            </p>
          </div>
        </div>

        {/* TABS DE SELECCIÓN DE CHAT O MODO CUARTO CHAT */}
        <div className="flex items-center bg-[#1c1e21] border border-white/10 p-0.5 rounded-lg text-[11px] font-bold gap-1 shrink-0">
          <button
            onClick={() => setViewMode('ALL_QUAD')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'ALL_QUAD'
                ? 'bg-[#00a884] text-white shadow-sm'
                : 'text-[#8696a0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={13} />
            <span>Cuarto Chat (Simultáneo 4-Chats)</span>
          </button>

          <button
            onClick={() => setViewMode('CHAT1_JS')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'CHAT1_JS'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-[#8696a0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu size={13} className="text-blue-300" />
            <span>Chat 1: Full JS</span>
          </button>

          <button
            onClick={() => setViewMode('CHAT2_HYBRID')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'CHAT2_HYBRID'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-[#8696a0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap size={13} className="text-amber-300" />
            <span>Chat 2: Híbrido</span>
          </button>

          <button
            onClick={() => setViewMode('CHAT3_FULL_AI')}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              viewMode === 'CHAT3_FULL_AI'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#8696a0] hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot size={13} className="text-purple-300" />
            <span>Chat 3: Full IA</span>
          </button>
        </div>

        {/* ACUMULADORES GLOBALES DE TELEMETRÍA */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="bg-[#1c1e21] border border-white/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-purple-300 font-bold">Tokens:</span>
            <span className="text-white font-black">{accumulatedTokens}</span>
          </div>

          <div className="bg-[#1c1e21] border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 text-[11px] font-mono">
            <DollarSign size={13} className="text-emerald-400" />
            <span className="text-emerald-400 font-black">${accumulatedCostUsd.toFixed(5)}</span>
          </div>

          <button
            onClick={clearAllTimelines}
            className="p-1.5 text-[#8696a0] hover:text-red-400 bg-[#1c1e21] border border-white/10 rounded-lg transition-colors cursor-pointer"
            title="Limpiar todas las conversaciones"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL SEGÚN EL MODO SELECCIONADO */}
      {viewMode === 'ALL_QUAD' && (
        <div className="flex flex-col flex-1 min-h-0 gap-2 overflow-hidden">
          <main className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 min-h-0 overflow-hidden">
            <ChatColumnColumn
              title="Chat 1: Full JS"
              subtitle="Árbol Determinista (0 Tokens)"
              icon={<Cpu size={15} className="text-blue-400" />}
              badgeColor="bg-blue-500/10 text-blue-400 border-blue-500/20"
              messages={chat1Messages}
              isLoading={isMultiLoading}
            />

            <ChatColumnColumn
              title="Chat 2: Híbrido"
              subtitle="JS + IA por Heurística"
              icon={<Zap size={15} className="text-amber-400" />}
              badgeColor="bg-amber-500/10 text-amber-400 border-amber-500/20"
              messages={chat2Messages}
              isLoading={isMultiLoading}
            />

            <ChatColumnColumn
              title="Chat 3: Full IA"
              subtitle="Caveman + Summary + RAG"
              icon={<Bot size={15} className="text-purple-400" />}
              badgeColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
              messages={chat3Messages}
              isLoading={isMultiLoading}
            />
          </main>

          <footer className="bg-[#141517] border border-white/10 rounded-lg p-1.5 shrink-0 shadow-lg">
            <form onSubmit={handleSimultaneousSubmit} className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe un mensaje para enviarlo a los 3 Chatbots en simultáneo..."
                disabled={isMultiLoading}
                className="flex-1 bg-[#202c33] border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#8696a0] focus:outline-none font-medium"
              />
              <button
                type="submit"
                disabled={isMultiLoading || !inputText.trim()}
                className="bg-[#00a884] hover:bg-[#008f70] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
              >
                {isMultiLoading ? 'Procesando...' : <><Send size={13} /> Enviar a los 3 Chats</>}
              </button>
            </form>
          </footer>
        </div>
      )}

      {/* VISTA INDIVIDUAL CHAT 1 FULL JS */}
      {viewMode === 'CHAT1_JS' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-[#0b141a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#202c33] px-5 py-2.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                JS
              </div>
              <div>
                <h2 className="text-xs font-bold text-white flex items-center gap-2">
                  Chat 1 — Motor Full JavaScript (FSM Determinista)
                  <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[9px] px-1.5 py-0.5 rounded font-mono">
                    0 Tokens / ~0ms
                  </span>
                </h2>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> En línea • Menú de Reglas Tradicional
                </p>
              </div>
            </div>
            <button
              onClick={() => resetSingleChat('JS')}
              className="p-1.5 text-zinc-400 hover:text-red-400 bg-[#111b21] rounded-lg border border-white/5"
              title="Reiniciar chat"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-2.5 bg-[#0b141a]">
            {singleBotMessages.JS.length === 0 ? (
              <div className="text-center text-zinc-500 text-xs py-12">
                Ingresa una opción o mensaje para iniciar interacción determinista en el Chat 1.
              </div>
            ) : (
              singleBotMessages.JS.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-lg text-xs leading-relaxed shadow ${
                      m.sender === 'user'
                        ? 'bg-[#005c4b] text-emerald-50 rounded-tr-none'
                        : 'bg-[#202c33] text-zinc-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span className="text-[9px] text-zinc-400 block text-right mt-1 font-mono">{m.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={(e) => handleSingleSubmit(e, 'JS')} className="p-2.5 bg-[#202c33] flex gap-2 border-t border-white/10">
            <input
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              placeholder="Escribe un mensaje para Chat 1 (Full JS)..."
              disabled={isSingleLoading}
              className="flex-1 bg-[#2a3942] text-white px-3.5 py-2 rounded-lg text-xs placeholder-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSingleLoading || !singleInput.trim()}
              className="bg-[#00a884] hover:bg-[#008f70] text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* VISTA INDIVIDUAL CHAT 2 HÍBRIDO */}
      {viewMode === 'CHAT2_HYBRID' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-[#141517] border border-amber-500/20 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#1c1e21] px-5 py-2.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <Zap className="text-amber-400" size={20} />
              <div>
                <h2 className="text-xs font-bold text-white">Chat 2 — Motor Híbrido (JS + IA On-Demand)</h2>
                <p className="text-[10px] text-zinc-400">Heurística local para preguntas simples; conmuta a LLM si la consulta es compleja</p>
              </div>
            </div>
            <button onClick={() => resetSingleChat('HYBRID')} className="p-1.5 text-zinc-400 hover:text-red-400 bg-white/5 rounded-lg">
              <Trash2 size={15} />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-2.5 bg-[#0b0c0d]">
            {singleBotMessages.HYBRID.length === 0 ? (
              <div className="text-center text-zinc-500 text-xs py-12">
                Ingresa una consulta para probar la conmutación heurística en el Chat 2.
              </div>
            ) : (
              singleBotMessages.HYBRID.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-lg text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-amber-950/60 text-amber-100 border border-amber-700/40 rounded-tr-none'
                        : 'bg-[#222428] text-zinc-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={(e) => handleSingleSubmit(e, 'HYBRID')} className="p-2.5 bg-[#1c1e21] flex gap-2 border-t border-white/10">
            <input
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              placeholder="Escribe un mensaje para Chat 2 (Híbrido)..."
              disabled={isSingleLoading}
              className="flex-1 bg-[#141517] text-white px-3.5 py-2 rounded-lg text-xs placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSingleLoading || !singleInput.trim()}
              className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      {/* VISTA INDIVIDUAL CHAT 3 FULL IA */}
      {viewMode === 'CHAT3_FULL_AI' && (
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full bg-[#141517] border border-purple-500/20 rounded-xl overflow-hidden shadow-2xl">
          <div className="bg-[#1c1e21] px-5 py-2.5 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <Bot className="text-purple-400" size={20} />
              <div>
                <h2 className="text-xs font-bold text-white">Chat 3 — Motor Full IA (Generativo RAG + Caveman)</h2>
                <p className="text-[10px] text-zinc-400">RAG contextual, memoria Summary Buffer y compresión sintáctica para optimizar tokens</p>
              </div>
            </div>
            <button onClick={() => resetSingleChat('FULL_AI')} className="p-1.5 text-zinc-400 hover:text-red-400 bg-white/5 rounded-lg">
              <Trash2 size={15} />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-2.5 bg-[#0b0c0d]">
            {singleBotMessages.FULL_AI.length === 0 ? (
              <div className="text-center text-zinc-500 text-xs py-12">
                Ingresa una pregunta libre para interactuar con la IA Generativa en el Chat 3.
              </div>
            ) : (
              singleBotMessages.FULL_AI.map((m) => (
                <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-lg text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-purple-950/60 text-purple-100 border border-purple-700/40 rounded-tr-none'
                        : 'bg-[#222428] text-zinc-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={(e) => handleSingleSubmit(e, 'FULL_AI')} className="p-2.5 bg-[#1c1e21] flex gap-2 border-t border-white/10">
            <input
              type="text"
              value={singleInput}
              onChange={(e) => setSingleInput(e.target.value)}
              placeholder="Escribe un mensaje para Chat 3 (Full IA)..."
              disabled={isSingleLoading}
              className="flex-1 bg-[#141517] text-white px-3.5 py-2 rounded-lg text-xs placeholder-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isSingleLoading || !singleInput.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

    </div>
  );
}

function ChatColumnColumn({
  title,
  subtitle,
  icon,
  badgeColor,
  messages,
  isLoading,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badgeColor: string;
  messages: IChatMessageNode[];
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-col bg-[#141517] border border-white/10 rounded-lg overflow-hidden shadow-lg h-full min-h-0">
      <div className="bg-[#1c1e21] px-3 py-1.5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0">
            <h2 className="font-extrabold text-[11px] text-white uppercase truncate">{title}</h2>
            <p className="text-[9px] text-[#8696a0] truncate">{subtitle}</p>
          </div>
        </div>
        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border shrink-0 ${badgeColor}`}>
          {messages.length} msgs
        </span>
      </div>

      <div className="flex-1 min-h-0 p-2 overflow-y-auto space-y-2 text-xs custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-center text-xs p-4">
            Escribe una consulta abajo para probar los 3 chats en paralelo.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`p-2.5 rounded-xl max-w-[88%] leading-relaxed ${
                  m.sender === 'USER'
                    ? 'bg-[#005c4b] text-emerald-50 rounded-tr-none'
                    : 'bg-[#202c33] text-zinc-100 border border-white/5 rounded-tl-none'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'BOT' && (
                <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] font-mono text-zinc-400">
                  {m.executionTimeMs !== undefined && (
                    <span className="flex items-center gap-0.5 text-zinc-400">
                      <Clock size={9} /> {m.executionTimeMs}ms
                    </span>
                  )}
                  {m.tokenMetrics && m.tokenMetrics.totalTokens > 0 && (
                    <span className="text-purple-300 bg-purple-950/40 border border-purple-800/30 px-1 py-0.2 rounded">
                      {m.tokenMetrics.totalTokens}tkn (${m.tokenMetrics.estimatedCostUsd.toFixed(5)})
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* INDICADOR "ESCRIBIENDO •••" EN CADA COLUMNA DURANTE LA CONSULTA PARALELA */}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-[#202c33] text-[#00a884] px-2.5 py-1 rounded-lg text-[11px] flex items-center gap-1.5 border border-white/5">
              <span className="text-zinc-300 text-[10px]">Escribiendo</span>
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1 h-1 bg-[#00a884] rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1 h-1 bg-[#00a884] rounded-full animate-bounce" />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
