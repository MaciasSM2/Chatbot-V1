'use client';

import React, { useState } from 'react';
import { Copy, Check, Palette, Code, Layout, Sliders } from 'lucide-react';

interface Props {
  botType: 'JS' | 'HYBRID' | 'FULL_AI';
}

export const WidgetConfigurator: React.FC<Props> = ({ botType }) => {
  const [primaryColor, setPrimaryColor] = useState('#075e54');
  const [title, setTitle] = useState('Asistente WhatsApp');
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right');
  const [copied, setCopied] = useState(false);

  const apiHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
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
    <div className="bg-bg-panel rounded-xl border border-border-subtle p-5 shadow-xl space-y-4 text-text-main">
      <div className="flex items-center justify-between border-b border-border-subtle pb-3">
        <div className="flex items-center gap-2 text-text-main font-bold text-base">
          <Code className="w-5 h-5 text-[var(--theme-accent)]" />
          <span>Personalización & Widget Embebible</span>
        </div>
        <span className="px-2.5 py-0.5 bg-[var(--theme-accent)]/10 text-[var(--theme-accent)] border border-[var(--theme-accent)]/20 text-xs font-semibold rounded-full uppercase">
          Modo: {botType}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-700 font-medium mb-1">Color Principal Widget</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={e => setPrimaryColor(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Título Encabezado Chat</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-700 font-medium mb-1">Código de Integración Embebible</label>
        <div className="relative bg-slate-950 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
          <pre>{embedCode}</pre>
          <button
            onClick={handleCopy}
            className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs font-sans transition-colors shadow"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Script'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
