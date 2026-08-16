'use client';

import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, AlertCircle } from 'lucide-react';
import { useTenantStore } from '../../application/store/useTenantStore';

export function ApiKeyConfigurator() {
  const { hasApiKey, saveApiKey, fetchSettings } = useTenantStore();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    setStatus('Cifrando llave con AES-256-GCM...');

    const ok = await saveApiKey(apiKey.trim());
    if (ok) {
      setApiKey('');
      setStatus('✅ LLave API registrada de forma segura.');
    } else {
      setStatus('❌ Error guardando llave API.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#141517] p-5 rounded-2xl border border-white/10 space-y-4 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
          <Key size={16} className="text-purple-400" /> Credenciales LLaves de API Privadas
        </h2>
        {hasApiKey ? (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
            <ShieldCheck size={12} /> Cifrado Activo
          </span>
        ) : (
          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono">
            Sin Key
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        Las llaves se encriptan simétricamente por cada tenant en la base de datos de MariaDB.
      </p>

      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Ingresar sk-..."
        className="w-full bg-[#1c1e21] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
      />

      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={loading || !apiKey.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all"
        >
          Guardar Llave
        </button>
        {status && (
          <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
            <AlertCircle size={14} className="text-zinc-500" /> {status}
          </span>
        )}
      </div>
    </form>
  );
}
