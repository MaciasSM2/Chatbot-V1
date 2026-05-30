/**
 * @file ExportModal.tsx
 * @description Interfaz para configurar la exportación con filtros avanzados.
 */

import React, { useState } from 'react';
import { FileSpreadsheet, FileText, X, Download } from 'lucide-react';
import { ExportEngine } from './ExportEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: any[];
  customFields: any[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, clients, customFields }) => {
  const [format, setFormat] = useState<'excel' | 'pdf'>('excel');
  const [onlyRegistered, setOnlyRegistered] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    let filtered = [...clients];
    if (onlyRegistered) filtered = filtered.filter(c => c.isRegistered);

    if (format === 'excel') ExportEngine.toExcel(filtered, customFields);
    else ExportEngine.toPDF(filtered, customFields);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-black text-gray-800 uppercase tracking-tight text-sm">Exportar Base de Datos</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-colors"><X size={18}/></button>
        </div>

        <div className="p-8 space-y-6">
          {/* Selector de Formato */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setFormat('excel')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${format === 'excel' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 text-gray-400'}`}
            >
              <FileSpreadsheet size={24} />
              <span className="text-[10px] font-bold uppercase">Excel (.xlsx)</span>
            </button>
            <button 
              onClick={() => setFormat('pdf')}
              className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${format === 'pdf' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-100 text-gray-400'}`}
            >
              <FileText size={24} />
              <span className="text-[10px] font-bold uppercase">Reporte PDF</span>
            </button>
          </div>

          {/* Filtros de Exportación */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl cursor-pointer">
              <input 
                type="checkbox" 
                checked={onlyRegistered}
                onChange={(e) => setOnlyRegistered(e.target.checked)}
                className="w-4 h-4 accent-emerald-500" 
              />
              <span className="text-xs font-bold text-gray-600 uppercase">Solo clientes registrados</span>
            </label>
          </div>

          <button 
            onClick={handleExport}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            <Download size={18} />
            Generar y Descargar
          </button>
        </div>
      </div>
    </div>
  );
};
