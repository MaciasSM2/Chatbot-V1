'use client';

import React from 'react';
import { Cpu, Zap, Bot, UserCheck } from 'lucide-react';
import { DESIGN_TOKENS } from '../../theme/designTokens';

export interface IChatEngineFeature {
  readonly id: 'chat1Js' | 'chat2Hybrid' | 'chat3FullAi';
  readonly badge: string;
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly keyBenefits: readonly string[];
  readonly humanEscalationText?: string;
  readonly iconType: 'js' | 'hybrid' | 'ai';
}

/**
 * Componente modular para presentar las capacidades de cada tipo de chat en la Landing Page.
 */
export function ChatEngineCard({ feature }: { readonly feature: IChatEngineFeature }) {
  const theme = DESIGN_TOKENS.colors[feature.id];
  const accentColor = ('accent' in theme ? (theme as any).accent : (theme as any).primary) || '#60a5fa';

  const renderIcon = () => {
    switch (feature.iconType) {
      case 'js':
        return <Cpu size={24} className="text-blue-400" />;
      case 'hybrid':
        return <Zap size={24} className="text-amber-400" />;
      case 'ai':
        return <Bot size={24} className="text-purple-400" />;
    }
  };

  return (
    <div className="flex flex-col bg-[#141517] border border-white/10 rounded-2xl p-6 shadow-2xl hover:border-white/20 transition-all duration-300 relative overflow-hidden group">
      {/* GLOW DE FONDO SEMÁNTICO */}
      <div
        className="absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: accentColor }}
      />

      {/* CABECERA Y BADGE */}
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-xl border" style={{ backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder }}>
          {renderIcon()}
        </div>
        <span className="text-[10px] font-mono font-bold uppercase px-3 py-1 rounded-full border" style={{ backgroundColor: theme.badgeBg, borderColor: theme.badgeBorder, color: accentColor }}>
          {feature.badge}
        </span>
      </div>

      {/* TITULO Y DESCRIPCIÓN */}
      <h3 className="text-lg font-black text-white mb-1 uppercase tracking-wider">{feature.title}</h3>
      <p className="text-xs font-semibold mb-3 text-zinc-400">{feature.subtitle}</p>
      <p className="text-xs text-zinc-300 leading-relaxed mb-6 font-normal">{feature.description}</p>

      {/* BENEFICIOS CLAVE */}
      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Ventajas Técnicas:</p>
        {feature.keyBenefits.map((benefit, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs text-zinc-200">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
            <span>{benefit}</span>
          </div>
        ))}
      </div>

      {/* DETALLE DE ESCALACIÓN HUMANA SI APLICA */}
      {feature.humanEscalationText && (
        <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-start gap-2.5">
          <UserCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-200 leading-tight">
            <strong className="text-emerald-400">Atención Humana:</strong> {feature.humanEscalationText}
          </p>
        </div>
      )}
    </div>
  );
}
