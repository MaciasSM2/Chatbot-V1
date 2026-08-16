'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Users, UploadCloud, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { ClientTable } from './components/ClientTable';
import { ClientFilters } from './components/ClientFilters';
import { CSVUploader } from './components/CSVUploader';
import { ExportEngine } from './components/ExportEngine';
import { executeSecureRequest } from '../../../core/apiClient';

const fetcher = (url: string) => executeSecureRequest(url);

export default function CrmClientesPage() {
  // 1. Ingestión remota de datos relacionales desde MariaDB usando SWR reactivo
  const { data, error, mutate, isValidating } = useSWR('/admin/crm/clients', fetcher);
  
  // 2. Estados locales encapsulados para el control de filtrado y modales
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);

  const clientsList = data?.success && Array.isArray(data.data) ? data.data : [];

  // 3. Lógica determinista de filtrado en memoria del cliente
  const filteredClients = clientsList.filter((client: any) => {
    const matchesSearch = (client.phone_number || '').includes(searchTerm) || 
                          (client.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = selectedGender === 'ALL' || client.gender === selectedGender;
    return matchesSearch && matchesGender;
  });

  const handleExportData = () => {
    ExportEngine.toExcel(filteredClients);
  };

  return (
    <div className="space-y-8 p-2 text-xs text-text-main animate-in fade-in duration-200">
      
      {/* CABECERA MAESTRA */}
      <div className="pb-6 border-b border-[var(--border-strong)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Users className="text-brand-primary" size={18} />
            Consola Avanzada CRM Logística
          </h2>
          <p className="text-[11px] text-text-muted mt-0.5">
            Gobernanza central de prospectos, descargas documentales de RUT y control de pausas del bot.
          </p>
        </div>

        {/* BOTONES TÁCTICOS DE ACCIÓN MASIVA */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => mutate()}
            disabled={isValidating}
            type="button"
            className="p-3 bg-bg-card border border-border-subtle rounded-xl text-text-muted hover:text-text-main transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsCsvModalOpen(true)}
            type="button"
            className="bg-bg-card border border-border-subtle hover:border-border-strong px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer text-text-main"
          >
            <UploadCloud size={14} className="text-brand-primary" />
            Carga Masiva (CSV)
          </button>
          <button
            onClick={handleExportData}
            type="button"
            className="bg-[var(--theme-accent)] hover:brightness-110 text-white px-4 py-2.5 rounded-xl font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl shadow-[var(--theme-accent)]/10 cursor-pointer"
          >
            <FileSpreadsheet size={14} />
            Exportar Matriz
          </button>
        </div>
      </div>

      {/* COMPONENTE PANEL DE FILTROS SEGREGADO */}
      <ClientFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGender={selectedGender}
        onGenderChange={setSelectedGender}
      />

      {/* COMPONENTE TABLA REFACTORIZADO Y CONECTADO */}
      {error ? (
        <div className="p-8 text-center text-red-400 font-mono">❌ Fallo de comunicación relacional con el Core CRM.</div>
      ) : (
        <ClientTable clients={filteredClients} isLoading={!data && !error} onMutationRequired={() => mutate()} />
      )}

      {/* MODAL ENCAPSULADO DE CARGA LOGÍSTICA CSV */}
      {isCsvModalOpen && (
        <CSVUploader onClose={() => setIsCsvModalOpen(false)} onUploadSuccess={() => { setIsCsvModalOpen(false); mutate(); }} />
      )}
    </div>
  );
}
