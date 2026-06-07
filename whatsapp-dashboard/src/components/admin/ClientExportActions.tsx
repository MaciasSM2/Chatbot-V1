import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useFieldStore } from '../../application/store/useFieldStore';
import { IClient } from '../../core/services/ClientApiService';
import { ExportModal } from '../../app/admin/clientes/components/ExportModal';

interface ClientExportActionsProps {
  clients: IClient[];
}

export function ClientExportActions({ clients }: ClientExportActionsProps) {
  const { customFields } = useFieldStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Columnas base y dinámicas en el orden correcto
  const getOrderedHeaders = (): string[] => {
    const headers = ['telefono', 'nombre', 'document_type', 'document_number'];
    
    customFields.forEach(field => {
      if (field.id !== 'document_type' && field.id !== 'document_number') {
        headers.push(field.id);
      }
    });

    headers.push('is_registered');
    return headers;
  };

  // 1. Generar Plantilla (Solo encabezados)
  const downloadTemplate = () => {
    const headers = getOrderedHeaders();

    // Crear hoja vacía con cabeceras configuradas
    const ws = XLSX.utils.json_to_sheet([], { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla");
    
    // Descargar en formato .xlsx para máxima compatibilidad
    XLSX.writeFile(wb, "Plantilla_Clientes_Chatbot.xlsx");
  };

  return (
    <>
      <div className="flex gap-3">
        <button 
          onClick={downloadTemplate}
          type="button"
          className="flex items-center justify-center gap-2 bg-background-header border border-border-subtle hover:bg-background-panel text-text-main px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          title="Descargar plantilla Excel limpia"
        >
          <FileSpreadsheet size={16} className="text-brand-primary animate-pulse" />
          <span>Plantilla Excel</span>
        </button>

        <button 
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="flex items-center justify-center gap-2 bg-background-header border border-border-subtle hover:bg-background-panel text-text-main px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          title="Exportar base de datos avanzada"
        >
          <Download size={16} />
          <span>Exportar Base</span>
        </button>
      </div>

      <ExportModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        clients={clients} 
        customFields={customFields} 
      />
    </>
  );
}
