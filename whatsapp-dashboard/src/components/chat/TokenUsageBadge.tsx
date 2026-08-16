'use client';

import React from 'react';
import { DollarSign, Cpu } from 'lucide-react';

interface Props {
  metrics?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
}

export const TokenUsageBadge: React.FC<Props> = ({ metrics }) => {
  if (!metrics || metrics.totalTokens === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md">
        <Cpu className="w-3 h-3" /> 0 Tokens (0ms)
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-[10px] font-mono bg-purple-950/40 text-purple-300 border border-purple-800/30 px-2 py-1 rounded-md">
      <span>In: {metrics.promptTokens} | Out: {metrics.completionTokens} | Total: {metrics.totalTokens}</span>
      <span className="flex items-center text-emerald-400 font-bold border-l border-purple-700/40 pl-2">
        <DollarSign className="w-3 h-3" />
        {metrics.estimatedCostUsd.toFixed(5)}
      </span>
    </div>
  );
};
