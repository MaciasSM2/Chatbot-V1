'use client';

import React, { useState } from 'react';
import { useBotEngineStore, BotType } from '../../application/store/useBotEngineStore';
import { TokenCounterBadge } from '../TokenCounterBadge';
import { Send, Cpu, Sparkles, Zap, Trash2 } from 'lucide-react';

interface Props {
  botType: 'JS' | 'HYBRID' | 'FULL_AI';
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeColorClass: string;
}

export function SingleBotChatWindow({
  botType,
  title,
  subtitle,
  badgeLabel,
  badgeColorClass
}: Props) {
  const { messages, sendMessage, tokenMetrics, resetChat, isLoading, setActiveBotType } = useBotEngineStore();
  const [inputMsg, setInputMsg] = useState('');

  const currentMessages = messages[botType] || [];
  const currentTokenMetrics = tokenMetrics[botType];
  const isWhatsAppTheme = botType === 'JS';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isLoading) return;
    const text = inputMsg;
    setInputMsg('');
    setActiveBotType(botType);
    await sendMessage(text);
  };

  if (isWhatsAppTheme) {
    return (
      <div className="flex flex-col h-[78vh] w-full max-w-5xl mx-auto bg-[#0b141a] border border-[#222d34] rounded-[2rem] overflow-hidden shadow-2xl transition-all">
        {/* CABECERA ESTILO WHATSAPP */}
        <header className="h-16 bg-[#202c33] border-b border-[#222d34] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00a884]/20 border border-[#00a884]/30 flex items-center justify-center text-[#00a884]">
              <Cpu size={20} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                {title}
                <span className="px-2 py-0.5 text-[10px] rounded font-mono font-bold bg-[#00a884]/15 text-[#00a884] border border-[#00a884]/30">
                  {badgeLabel}
                </span>
              </h2>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => resetChat('JS')}
              className="p-2 text-zinc-400 hover:text-red-400 bg-[#111b21] border border-white/5 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
              title="Reiniciar chat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </header>

        {/* ÁREA DE CHAT CON PATRÓN WHATSAPP */}
        <div className="flex-1 p-6 overflow-y-auto space-y-3 bg-[#0b141a] bg-[radial-gradient(#111b21_1px,transparent_1px)] [background-size:16px_16px]">
          {currentMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs font-mono">
              Escribe un mensaje para iniciar sesión en el Chat 1 (Full JS)...
            </div>
          ) : (
            currentMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow ${
                    msg.sender === 'user'
                      ? 'bg-[#005c4b] text-emerald-50 rounded-tr-none'
                      : 'bg-[#202c33] text-zinc-100 border border-white/5 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  
                  <div className="mt-1 flex items-center justify-end text-[9px] text-zinc-400 gap-2 font-mono">
                    <span>{msg.timestamp}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER BARRA DE ENTRADA WHATSAPP */}
        <form onSubmit={handleSend} className="p-4 bg-[#202c33] border-t border-[#222d34] flex items-center gap-3 shrink-0">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Escribe un mensaje aquí..."
            disabled={isLoading}
            className="flex-1 bg-[#2a3942] border border-transparent rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-400 focus:outline-none focus:border-[#00a884]"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMsg.trim()}
            className="p-3 bg-[#00a884] hover:bg-[#008f70] text-white rounded-xl transition-all shadow-md disabled:opacity-40 cursor-pointer"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[78vh] w-full bg-bg-panel border border-border-subtle rounded-[2rem] overflow-hidden shadow-2xl transition-colors duration-300">
      
      {/* HEADER ESTÁNDAR DE CHAT */}
      <header className="h-16 bg-bg-header border-b border-border-subtle px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--theme-accent)]/10 border border-[var(--theme-accent)]/20 flex items-center justify-center text-[var(--theme-accent)]">
            {botType === 'HYBRID' && <Zap size={20} />}
            {botType === 'FULL_AI' && <Sparkles size={20} />}
          </div>
          <div>
            <h2 className="font-bold text-sm text-text-main flex items-center gap-2">
              {title}
              <span className={`px-2 py-0.5 text-[10px] rounded font-mono font-bold ${badgeColorClass}`}>
                {badgeLabel}
              </span>
            </h2>
            <p className="text-[11px] text-text-dim">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TokenCounterBadge metrics={currentTokenMetrics} botType={botType} />
          <button
            onClick={() => resetChat(botType)}
            className="p-2 text-text-dim hover:text-red-400 bg-bg-input border border-border-subtle hover:border-red-500/20 rounded-xl transition-all cursor-pointer"
            title="Reiniciar chat"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      {/* ÁREA DE MENSAJES */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-bg-main/50">
        {currentMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs shadow-md ${
                msg.sender === 'user'
                  ? 'bg-[var(--theme-accent)] text-white rounded-br-none'
                  : 'bg-bg-card border border-border-subtle text-text-main rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              
              {msg.heuristicReason && (
                <div className="mt-2 pt-1.5 border-t border-border-subtle/40 text-[9px] font-mono text-amber-400">
                  ⚡ {msg.heuristicReason}
                </div>
              )}

              <div className="mt-1 flex items-center justify-between text-[9px] opacity-70 gap-2 font-mono">
                <span>{msg.timestamp}</span>
                {msg.sourceUsed && (
                  <span className="font-bold uppercase">
                    [{msg.sourceUsed}]
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FOOTER BARRA DE MENSAJE */}
      <form onSubmit={handleSend} className="p-4 bg-bg-header border-t border-border-subtle flex items-center gap-3 shrink-0">
        <input
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder={`Escribe una consulta para ${title}...`}
          disabled={isLoading}
          className="flex-1 bg-bg-input border border-border-subtle rounded-xl px-4 py-3 text-xs text-text-main focus:outline-none focus:border-[var(--theme-accent)]"
        />
        <button
          type="submit"
          disabled={isLoading || !inputMsg.trim()}
          className="p-3 bg-[var(--theme-accent)] hover:brightness-110 text-white rounded-xl transition-all shadow-md disabled:opacity-40 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
