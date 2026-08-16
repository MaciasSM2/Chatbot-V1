'use client';

import React, { useState } from 'react';
import { Code, Copy, Check } from 'lucide-react';

export function EmbedCodeGenerator({ tenantId }: { tenantId: string }) {
  const [selectedChatType, setSelectedChatType] = useState<'FULL_JS' | 'HYBRID' | 'FULL_AI'>('HYBRID');
  const [copied, setCopied] = useState(false);

  const apiHost = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3015';
  const snippetCode = `<script\n  src="${apiHost}/api/widget/script.js"\n  data-tenant="${tenantId}"\n  data-chat-type="${selectedChatType}"\n  async\n></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#141517] border border-white/10 rounded-2xl p-6 space-y-4 text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 text-emerald-400">
          <Code size={18} /> Generador de Widget Embebible para Sitios Web
        </h2>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-zinc-300">Selecciona el Motor de Chat a Integrar:</label>
        <div className="grid grid-cols-3 gap-3">
          {(['FULL_JS', 'HYBRID', 'FULL_AI'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedChatType(type)}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedChatType === type
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border-transparent hover:bg-zinc-700'
              }`}
            >
              {type === 'FULL_JS' ? 'Chat 1: Full JS' : type === 'HYBRID' ? 'Chat 2: Híbrido' : 'Chat 3: Full IA'}
            </button>
          ))}
        </div>
      </div>

      <div className="relative bg-[#0b0c0d] border border-white/10 rounded-xl p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
        <pre>{snippetCode}</pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copiado' : 'Copiar Snippet'}
        </button>
      </div>

      <p className="text-[11px] text-zinc-400 leading-relaxed">
        Pega este fragmento de código antes de la etiqueta de cierre <code className="text-emerald-400">&lt;/body&gt;</code> en el HTML de tu sitio web para activar el chat en vivo.
      </p>
    </div>
  );
}
