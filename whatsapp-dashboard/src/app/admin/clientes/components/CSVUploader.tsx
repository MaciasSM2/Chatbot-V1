'use client';

import React, { useState, useRef } from 'react';
import { X, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';
import { clientService } from '../../../../core/services/ClientApiService';

interface CSVUploaderProps {
  onClose: () => void;
  onUploadSuccess: () => void;
}

export function CSVUploader({ onClose, onUploadSuccess }: CSVUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeHeaderKey = (header: string): string => {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('El archivo debe tener extensión .csv');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessCount(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');

        if (lines.length <= 1) {
          throw new Error('El archivo CSV está vacío.');
        }

        const rawHeaders = lines[0]!.split(',').map(h => h.trim());
        const headers = rawHeaders.map(h => normalizeHeaderKey(h));

        // Detectar teléfono y nombre
        const phoneIndex = headers.findIndex(h => h.includes('tel') || h.includes('phone') || h.includes('cel') || h.includes('user'));
        const nameIndex = headers.findIndex(h => h.includes('nom') || h.includes('name'));

        if (phoneIndex === -1) {
          throw new Error('Columna de teléfono no encontrada (tel, phone, cel).');
        }

        let processed = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]!.split(',').map(c => c.trim());
          const phone = cols[phoneIndex]?.replace(/[^0-9+]/g, '');
          if (!phone) continue;

          const name = nameIndex !== -1 && cols[nameIndex] ? cols[nameIndex] : null;

          // Metadatos
          const metadata: Record<string, any> = {};
          cols.forEach((val, idx) => {
            if (idx !== phoneIndex && idx !== nameIndex && rawHeaders[idx]) {
              const key = normalizeHeaderKey(rawHeaders[idx]);
              metadata[key] = val || null;
            }
          });

          // Inyección remota de datos relacionales
          await clientService.createClient(phone, name, false, metadata);
          processed++;
        }

        setSuccessCount(processed);
        setTimeout(() => {
          onUploadSuccess();
        }, 1500);

      } catch (err: any) {
        setError(err.message || 'Error al procesar el archivo CSV');
      } finally {
        setIsUploading(false);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b0c0d] border border-[var(--border-subtle)] rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-subtle)] flex justify-between items-center bg-[#141617]/40">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-text-main">Cargar Base de Clientes (CSV)</h3>
            <p className="text-[10px] text-text-muted mt-0.5">Importación masiva hacia la base de datos MariaDB.</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 hover:bg-[#141617] rounded-xl text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 text-[10px] font-bold uppercase tracking-wider">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-start gap-3 text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle size={16} className="shrink-0" />
              <span>Procesados exitosamente: {successCount} registros. Redireccionando...</span>
            </div>
          )}

          <div className="border-2 border-dashed border-[var(--border-subtle)] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
            <UploadCloud size={32} className="text-brand-primary animate-pulse" />
            <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Formatos Admitidos: .CSV</div>
            <p className="text-[10px] text-text-muted max-w-xs leading-relaxed">
              Asegúrate de incluir las columnas de teléfono y nombre para inicializar las fichas del chatbot.
            </p>
            
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="modal-csv-uploader-input"
              disabled={isUploading}
            />
            <label
              htmlFor="modal-csv-uploader-input"
              className={`mt-4 bg-brand-primary hover:bg-brand-hover text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-brand-primary/10 ${
                isUploading ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {isUploading ? 'PROCESANDO REGISTROS...' : 'SELECCIONAR ARCHIVO'}
            </label>
          </div>
        </div>

      </div>
    </div>
  );
}
