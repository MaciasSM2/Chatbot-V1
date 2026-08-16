'use client';

import React, { useState } from 'react';
import { Code, Copy, Check, Layout, Palette } from 'lucide-react';

interface Props {
  defaultBotType?: 'JS' | 'HYBRID' | 'FULL_AI';
}

export const EmbedWidgetGenerator: React.FC<Props> = ({ defaultBotType = 'HYBRID' }) => {
  const [botType, setBotType] = useState<'JS' | 'HYBRID' | 'FULL_AI'>(defaultBotType);
  const [primaryColor, setPrimaryColor] = useState('#075e54');
  const [title, setTitle] = useState('Asistente WhatsApp Pro');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [copied, setCopied] = useState(false);

  const apiHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3015';
  
  const embedCode = `<script 
  src="${apiHost}/api/widget/script.js" 
  data-bot-type="${botType}" 
  data-primary-color="${primaryColor}" 
  data-title="${title}" 
  data-position="${position}" 
  async>
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#141517] rounded-2xl border border-white/10 p-5 shadow-xl space-y-4 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
          <Code className="w-5 h-5 text-emerald-400" />
          <span>Generador de Código Embebible para Clientes</span>
        </div>
        <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-full uppercase">
          Modo: {botType}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="space-y-1">
          <label className="text-zinc-400 flex items-center gap-1 font-medium">
            <Layout size={14} /> Modo de Chatbot:
          </label>
          <select
            value={botType}
            onChange={(e) => setBotType(e.target.value as any)}
            className="w-full bg-[#1c1e21] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
          >
            <option value="JS">Chat 1 — Full JS (Determinista)</option>
            <option value="HYBRID">Chat 2 — Híbrido (Heurístico)</option>
            <option value="FULL_AI">Chat 3 — Full IA (Caveman)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 flex items-center gap-1 font-medium">
            <Palette size={14} /> Color de Marca:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-8 w-10 bg-transparent cursor-pointer rounded"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 bg-[#1c1e21] border border-white/10 rounded-xl px-3 py-2 font-mono text-white"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 font-medium">Título del Bot en Widget:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#1c1e21] border border-white/10 rounded-xl px-3 py-2 text-white"
          />
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-400 font-medium">Snippet HTML para Pegar en el Sitio Web del Cliente:</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            {copied ? <><Check size={14} /> ¡Copiado!</> : <><Copy size={14} /> Copiar Código</>}
          </button>
        </div>
        <pre className="bg-[#0b0c0d] p-3 rounded-xl border border-white/10 text-[11px] font-mono text-emerald-400 overflow-x-auto">
          {embedCode}
        </pre>
      </div>
    </div>
  );
};
