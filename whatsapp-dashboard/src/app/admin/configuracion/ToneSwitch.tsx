'use client';

import React, { useState } from 'react';
import { MessageSquare, ShieldCheck } from 'lucide-react';
import { executeSecureRequest, getApiUrl } from '../../../core/apiClient';

export default function ToneSwitch() {
  // Condición 3: Switch directo de dos opciones (1 = Formal Corporativo, 2 = Cercano Comercial)
  const [toneProfile, setToneProfile] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleToneChange = async (selectedTone: number) => {
    setToneProfile(selectedTone);
    setIsSyncing(true);

    try {
      // Envío directo y simplificado a MariaDB
      await executeSecureRequest(`${getApiUrl()}/settings/brand/tone`, {
        method: 'PATCH',
        body: JSON.stringify({ toneProfile: selectedTone })
      });
    } catch (error) {
      console.error('Error de red sincronizando perfil semántico:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-[#0b0c0d] border border-[var(--border-subtle)] rounded-[2rem] p-6 max-w-md space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <h4 className="text-xs font-black text-text-main uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-brand-primary" />
          Personalización del Tono de Habla
        </h4>
        {isSyncing && <span className="text-[9px] font-mono text-brand-primary animate-pulse">Sincronizando...</span>}
      </div>

      <p className="text-[10px] text-text-muted leading-relaxed">
        Selecciona la personalidad que adoptará el chatbot para interactuar de forma automática en WhatsApp. Las respuestas cambiarán de manera determinista instantáneamente.
      </p>

      {/* Selector Plano de Fricción Cero */}
      <div className="bg-[#141617] border border-[var(--border-subtle)] p-1 rounded-xl flex items-center w-full overflow-hidden">
        <button
          type="button"
          onClick={() => handleToneChange(1)}
          className={`flex-1 text-center py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer text-[9px] flex items-center justify-center gap-1.5 ${
            toneProfile === 1 ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'text-text-muted hover:text-text-main'
          }`}
        >
          <ShieldCheck size={12} />
          Formal Corporativo
        </button>
        <button
          type="button"
          onClick={() => handleToneChange(2)}
          className={`flex-1 text-center py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer text-[9px] flex items-center justify-center gap-1.5 ${
            toneProfile === 2 ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'text-text-muted hover:text-text-main'
          }`}
        >
          Cercano Comercial
        </button>
      </div>
    </div>
  );
}
