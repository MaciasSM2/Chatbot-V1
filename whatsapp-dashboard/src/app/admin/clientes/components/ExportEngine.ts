/**
 * @file ExportEngine.ts
 * @description Lógica de transformación de datos para reportes empresariales.
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useFieldStore } from '../../../../application/store/useFieldStore';

export const ExportEngine = {
  /**
   * Aplana los metadatos JSONB para que sean columnas legibles.
   */
  flattenClients(clients: any[], customFields?: any[]) {
    const fields = customFields || useFieldStore.getState().customFields;
    return clients.map(client => {
      const flatClient: any = {
        'Teléfono': client.phone_number || client.phoneNumber,
        'Nombre': client.full_name || client.name || 'Sin registro',
        'Estado': (client.is_registered !== undefined ? client.is_registered : client.isRegistered) ? 'Recurrente' : 'Nuevo',
        'Fecha Registro': (client.created_at || client.createdAt) ? new Date(client.created_at || client.createdAt).toLocaleDateString('es-CO') : '-'
      };

      // Inyectar dinámicamente los campos JSONB
      fields.forEach(field => {
        flatClient[field.label] = client.metadata?.[field.id] || '-';
      });

      return flatClient;
    });
  },

  /** Exporta a Excel (.xlsx) */
  toExcel(clients: any[], customFields?: any[]) {
    const fields = customFields || useFieldStore.getState().customFields;
    const data = this.flattenClients(clients, fields);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes_WhatsApp");
    XLSX.writeFile(wb, `Reporte_Clientes_${Date.now()}.xlsx`);
  },

  /** Exporta a PDF profesional */
  toPDF(clients: any[], customFields?: any[]) {
    const fields = customFields || useFieldStore.getState().customFields;
    const doc = new jsPDF();
    const data = this.flattenClients(clients, fields);
    
    // Título y Estilo
    doc.setFontSize(18);
    doc.text("Reporte Maestro de Clientes - WhatsApp Bot", 14, 22);
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleString('es-CO')}`, 14, 30);

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const rows = data.map((item: any) => headers.map(h => item[h]));

      autoTable(doc, {
        startY: 35,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
        styles: { fontSize: 8 }
      });
    } else {
      doc.text("No hay datos para exportar con los filtros seleccionados.", 14, 45);
    }

    doc.save(`Reporte_Clientes_${Date.now()}.pdf`);
  }
};
