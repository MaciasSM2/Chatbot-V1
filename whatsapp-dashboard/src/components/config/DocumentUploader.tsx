'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { executeSecureRequest } from '../../core/apiClient';

export function DocumentUploader({ tenantId }: { tenantId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus('loading');
    setMessage('Parseando y extrayendo estructura del documento...');

    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('tenantId', tenantId);

      const res = await executeSecureRequest('/bots/upload-doc', {
        method: 'POST',
        body: formData
      });

      if (res.success) {
        setStatus('success');
        setMessage(`¡Documento "${file.name}" cargado! Reglas FSM y contexto listos.`);
      } else {
        setStatus('error');
        setMessage(res.error || 'Error procesando documento.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(`Fallo de red: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleUpload} className="bg-[#141517] p-5 rounded-2xl border border-white/10 space-y-4 text-white">
      <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
        <FileText size={16} className="text-emerald-400" /> Carga de Documentos Estructurales
      </h2>
      <p className="text-xs text-zinc-400">
        Sube archivos (PDF, TXT, JSON, CSV, XLSX) para estructurar respuestas automáticas en los chatbots.
      </p>

      <div className="flex items-center gap-3">
        <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl p-4 cursor-pointer hover:bg-white/5 transition-all text-xs text-zinc-400">
          <Upload size={18} className="text-zinc-500 mb-1" />
          <span>{file ? file.name : 'Seleccionar Archivo...'}</span>
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>

        <button
          type="submit"
          disabled={!file || status === 'loading'}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-3.5 rounded-xl cursor-pointer transition-all"
        >
          {status === 'loading' ? 'Subiendo...' : 'Subir'}
        </button>
      </div>

      {status === 'success' && (
        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 text-xs rounded-xl flex items-center gap-2 border border-emerald-500/20 font-medium">
          <CheckCircle2 size={14} />
          <span>{message}</span>
        </div>
      )}

      {status === 'error' && (
        <div className="p-2.5 bg-red-500/10 text-red-400 text-xs rounded-xl flex items-center gap-2 border border-red-500/20 font-medium">
          <AlertCircle size={14} />
          <span>{message}</span>
        </div>
      )}
    </form>
  );
}
