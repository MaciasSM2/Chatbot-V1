'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';
import { executeSecureRequest } from '../../core/apiClient';

interface IQuotaStatus {
  tenantId: string;
  limitUsd: number;
  consumedUsd: number;
  remainingUsd: number;
  isExceeded: boolean;
  percentageUsed: number;
}

export function QuotaConfigurator() {
  const [quota, setQuota] = useState<IQuotaStatus | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState('');

  const fetchQuotaStatus = async () => {
    setLoading(true);
    const res = await executeSecureRequest('/tenant/quota/status');
    if (res.success && res.data) {
      setQuota(res.data);
      setLimitInput(String(res.data.limitUsd));
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchQuotaStatus();
  }, []);

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(limitInput);
    if (isNaN(val) || val < 0) {
      setActionStatus('❌ El límite debe ser un número positivo.');
      return;
    }

    setActionStatus('Guardando...');
    const res = await executeSecureRequest('/tenant/quota/limit', {
      method: 'POST',
      body: JSON.stringify({ limitUsd: val })
    });

    if (res.success) {
      setActionStatus('✅ Límite guardado correctamente.');
      void fetchQuotaStatus();
    } else {
      setActionStatus(`❌ Error: ${res.error || 'no se pudo guardar'}`);
    }
  };

  return (
    <div className="bg-[#141517] p-6 rounded-2xl border border-white/10 space-y-6 text-white font-sans">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h2 className="text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 text-emerald-400">
          <DollarSign size={18} /> Control de Presupuesto Diario de IA (USD)
        </h2>
        <button
          onClick={() => void fetchQuotaStatus()}
          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
          title="Actualizar consumo"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {quota && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1c1e21] p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Consumo Hoy</span>
            <div className="text-lg font-mono font-bold text-zinc-200">
              ${quota.consumedUsd.toFixed(6)} <span className="text-xs text-zinc-500">USD</span>
            </div>
          </div>
          <div className="bg-[#1c1e21] p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-[10px] uppercase font-bold text-zinc-500">Estado de Operación</span>
            <div className="flex items-center gap-1.5 text-xs font-bold mt-1">
              {quota.isExceeded ? (
                <span className="text-red-400 flex items-center gap-1 bg-red-950/20 px-2 py-0.5 rounded-full border border-red-500/20">
                  <ShieldAlert size={12} /> Excedido (Downgraded)
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle size={12} /> Activo (IA Permitida)
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {quota && quota.limitUsd > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-zinc-400">
            <span>Uso de Presupuesto Diario</span>
            <span>{quota.percentageUsed}%</span>
          </div>
          <div className="w-full bg-[#1c1e21] h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                quota.percentageUsed >= 90 ? 'bg-red-500' : quota.percentageUsed >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${quota.percentageUsed}%` }}
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSaveLimit} className="space-y-3 pt-2">
        <label className="block text-xs font-bold text-zinc-300">Ajustar Límite Diario (USD):</label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            placeholder="Ej. 5.00"
            className="flex-1 bg-[#1c1e21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Fijar Límite
          </button>
        </div>
        {actionStatus && (
          <p className="text-[11px] font-mono text-zinc-400">{actionStatus}</p>
        )}
      </form>

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        * Nota: Establecer el límite en 0 permite consultas ilimitadas. Si el consumo en USD supera el límite diario configurado, las estrategias Chat 2 y Chat 3 conmutarán al motor de reglas locales en JavaScript (Chat 1) para evitar sobrecostos.
      </p>
    </div>
  );
}
