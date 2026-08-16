'use client';

import React from 'react';
import { Cpu, Zap, DollarSign } from 'lucide-react';

interface TokenMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  provider?: string;
  model?: string;
}

interface Props {
  metrics: TokenMetrics | null;
  botType: 'JS' | 'HYBRID' | 'FULL_AI';
}

export const TokenCounterBadge: React.FC<Props> = ({ metrics, botType }) => {
  if (botType === 'JS') {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold shadow-sm">
        <Zap className="w-3.5 h-3.5 text-emerald-600" />
        <span>Motor FSM JS (0 Tokens / $0.00)</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
        <Cpu className="w-3.5 h-3.5 text-gray-400" />
        <span>Contador IA listo (Esperando mensaje...)</span>
      </div>
    );
  }

  // Estimación genérica de costos GPT-4o-mini / Gemini Flash (~$0.15 por 1M tokens)
  const estimatedCost = (metrics.totalTokens * 0.0000002).toFixed(6);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs shadow-md border border-slate-700 animate-fade-in">
      <div className="flex items-center gap-1 text-emerald-400 font-bold">
        <Cpu className="w-4 h-4 animate-pulse" />
        <span>{metrics.totalTokens.toLocaleString()} tokens</span>
      </div>
      <span className="text-slate-500">|</span>
      <div className="text-slate-300">
        In: <span className="text-blue-300 font-medium">{metrics.promptTokens}</span> / Out: <span className="text-purple-300 font-medium">{metrics.completionTokens}</span>
      </div>
      <span className="text-slate-500">|</span>
      <div className="flex items-center text-amber-300 font-semibold">
        <DollarSign className="w-3 h-3" />
        <span>{estimatedCost}</span>
      </div>
      {metrics.provider && (
        <span className="ml-1 px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] uppercase font-mono">
          {metrics.provider}
        </span>
      )}
    </div>
  );
};
