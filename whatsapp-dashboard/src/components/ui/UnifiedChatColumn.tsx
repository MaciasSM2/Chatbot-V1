'use client';

import React from 'react';
import { Clock, Cpu } from 'lucide-react';
import { DESIGN_TOKENS } from '../../theme/designTokens';

export interface IChatMessageNode {
  readonly id: string;
  readonly sender: 'USER' | 'BOT' | 'user' | 'bot';
  readonly text: string;
  readonly timestamp?: string;
  readonly executionTimeMs?: number;
  readonly tokenMetrics?: {
    readonly totalTokens: number;
    readonly estimatedCostUsd: number;
  };
}

interface IUnifiedChatColumnProps {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: React.ReactNode;
  readonly themeType: 'chat1Js' | 'chat2Hybrid' | 'chat3FullAi';
  readonly messages: readonly IChatMessageNode[];
}

/**
 * Componente unificado para tarjetas de chat.
 * Garantiza un aspecto visual idéntico para los 3 motores en cualquier vista.
 */
export function UnifiedChatColumn({
  title,
  subtitle,
  icon,
  themeType,
  messages,
}: IUnifiedChatColumnProps) {
  const theme = DESIGN_TOKENS.colors[themeType];

  return (
    <div className="flex flex-col bg-[#141517] border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all h-full">
      {/* CABECERA UNIFICADA DE TARJETA */}
      <div className="bg-[#1c1e21] p-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg"
            style={{ backgroundColor: theme.badgeBg, color: theme.primary }}
          >
            {icon}
          </div>
          <div>
            <h2 className="font-extrabold text-xs text-white uppercase tracking-wider">{title}</h2>
            <p className="text-[10px] text-zinc-400 font-medium">{subtitle}</p>
          </div>
        </div>

        <span
          className="text-[9px] font-mono px-2 py-0.5 rounded-full border"
          style={{
            backgroundColor: theme.badgeBg,
            borderColor: theme.badgeBorder,
            color: theme.primary,
          }}
        >
          {messages.length} msgs
        </span>
      </div>

      {/* ÁREA DE MENSAJES UNIFICADA */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-zinc-600 text-center text-xs p-4 font-medium">
            Sin interacciones en este canal.
          </div>
        ) : (
          messages.map((m) => {
            const isUser = m.sender === 'USER' || m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                    isUser
                      ? 'bg-emerald-900/50 text-emerald-100 border border-emerald-700/30 rounded-tr-none'
                      : 'bg-[#222428] text-zinc-200 border border-white/5 rounded-tl-none'
                  }`}
                >
                  {m.text}
                </div>

                {/* TELEMETRÍA Y COSTOS DE RESPUESTA */}
                {!isUser && (
                  <div className="flex items-center gap-2 mt-1 px-1 text-[9px] font-mono text-zinc-400">
                    {m.executionTimeMs !== undefined && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock size={10} /> {m.executionTimeMs}ms
                      </span>
                    )}
                    {m.tokenMetrics && m.tokenMetrics.totalTokens > 0 && (
                      <span className="text-purple-300 bg-purple-950/40 border border-purple-800/30 px-1.5 py-0.5 rounded">
                        Tokens: {m.tokenMetrics.totalTokens} (${m.tokenMetrics.estimatedCostUsd.toFixed(5)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
