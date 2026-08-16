import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet } from 'lucide-react';
import React from 'react';

export const SearchResultsActions = ({ results, queryParams }: { results: any[]; queryParams: any }) => {
  const handleExport = () => {
    // 1. Formatear los datos para el Excel (limpieza de columnas)
    const dataToExport = results.map(msg => ({
      Fecha: new Date(msg.timestamp).toLocaleString('es-CO'),
      Emisor: msg.sender ? msg.sender.toUpperCase() : 'DESCONOCIDO',
      Cliente: msg.clientName || msg.userId,
      Telefono: msg.userId,
      Mensaje: msg.text,
      Estado: msg.status || 'Enviado'
    }));

    // 2. Crear el libro de trabajo (Workbook)
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte de Mensajes");

    // 3. Generar el nombre del archivo basado en el filtro
    const fileName = `Reporte_Chat_${queryParams.query || 'General'}_${new Date().getTime()}.xlsx`;

    // 4. Descargar
    XLSX.writeFile(wb, fileName);
  };

  if (results.length === 0) return null;

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-emerald-900/20 uppercase tracking-tighter"
    >
      <FileSpreadsheet size={14} />
      Exportar {results.length} Hallazgos
    </button>
  );
};
