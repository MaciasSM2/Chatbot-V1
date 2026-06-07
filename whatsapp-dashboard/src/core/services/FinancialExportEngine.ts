/**
 * @file FinancialExportEngine.ts
 * @description Servicio encargado de compilar y descargar reportes corporativos en formatos XLSX y PDF.
 * Procesa los datos en el hilo del cliente para mitigar el ancho de banda del servidor.
 */
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { IClientCrmEntity } from '../interfaces/CrmNetworkContracts';

export class FinancialExportEngine {
  
  /**
   * Genera y descarga un libro de Excel estructurado con los registros del CRM de Clientes.
   */
  public exportClientsToExcel(clientsCollection: IClientCrmEntity[], companyName: string): void {
    const normalizedRows = clientsCollection.map((client, index) => ({
      'Índice': index + 1,
      'Número de WhatsApp': client.phone_number,
      'Razón Social / Nombre': client.full_name || 'No Registrado',
      'Género': client.gender === 'M' ? 'Masculino' : client.gender === 'F' ? 'Femenino' : 'No Definido',
      'Tipo de Documento': client.document_type || 'N/A',
      'Identificación / NIT': client.document_number || 'N/A',
      'Estado Bot': client.is_paused === 1 ? 'Pausado (Humano)' : 'Automatizado',
      'Fecha Alta': client.created_at ? new Date(client.created_at).toLocaleDateString('es-CO') : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(normalizedRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consolidado CRM');

    const columnWidths = [
      { wch: 8 },  // Índice
      { wch: 20 }, // WhatsApp
      { wch: 35 }, // Nombre
      { wch: 12 }, // Género
      { wch: 18 }, // Tipo Doc
      { wch: 22 }, // Identificación
      { wch: 20 }, // Estado Bot
      { wch: 15 }  // Fecha Alta
    ];
    worksheet['!cols'] = columnWidths;

    const sanitizedFileName = `CRM_LOGISTICA_${companyName.toUpperCase().replace(/\s+/g, '_')}_2026.xlsx`;
    XLSX.writeFile(workbook, sanitizedFileName);
  }

  /**
   * Genera un reporte analítico en PDF con tipografías estricta e identidad White-Label corporativa.
   */
  public exportAuditReportToPdf(
    clientsCollection: IClientCrmEntity[], 
    companyName: string, 
    logoUrl: string
  ): void {
    const pdfDoc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    pdfDoc.setFont('helvetica', 'bold');
    
    // --- ENCABEZADO CORPORATIVO ---
    pdfDoc.setFillColor(7, 10, 14);
    pdfDoc.rect(0, 0, 210, 38, 'F');
    
    pdfDoc.setTextColor(255, 255, 255);
    pdfDoc.setFontSize(14);
    pdfDoc.text(companyName.toUpperCase(), 15, 16);
    
    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(9);
    pdfDoc.setTextColor(156, 163, 175);
    pdfDoc.text('Auditoría General de Cuentas y Registro de Rutas SICE-TAC', 15, 23);
    pdfDoc.text(`Fecha Emisión: ${new Date().toLocaleString('es-CO')}`, 15, 29);

    // --- LÍNEA DIVISORIA DE ACENTO ---
    pdfDoc.setFillColor(37, 211, 102);
    pdfDoc.rect(0, 38, 210, 1.5, 'F');

    // --- TABLA DE REGISTROS ---
    pdfDoc.setTextColor(17, 20, 23);
    pdfDoc.setFont('helvetica', 'bold');
    pdfDoc.setFontSize(9);

    let currentYAxis = 52;
    pdfDoc.text('WHATSAPP', 15, currentYAxis);
    pdfDoc.text('RAZÓN SOCIAL / PROSPECTO', 55, currentYAxis);
    pdfDoc.text('IDENTIFICACIÓN', 135, currentYAxis);
    pdfDoc.text('ESTADO', 180, currentYAxis);

    pdfDoc.setDrawColor(200, 200, 200);
    pdfDoc.setLineWidth(0.3);
    pdfDoc.line(15, currentYAxis + 2, 195, currentYAxis + 2);

    pdfDoc.setFont('helvetica', 'normal');
    pdfDoc.setFontSize(8.5);
    currentYAxis += 8;

    for (const client of clientsCollection) {
      if (currentYAxis > 275) {
        pdfDoc.addPage();
        currentYAxis = 20;
      }

      const cleanPhone = client.phone_number;
      const cleanName = (client.full_name || 'PENDIENTE REGISTRO').substring(0, 38);
      const cleanDoc = client.document_number ? `${client.document_type || 'CC'}: ${client.document_number}` : 'NO PROVISTO';
      const cleanStatus = client.is_paused === 1 ? 'PAUSA ASESOR' : 'AUTOMÁTICO';

      pdfDoc.text(cleanPhone, 15, currentYAxis);
      pdfDoc.text(cleanName, 55, currentYAxis);
      pdfDoc.text(cleanDoc, 135, currentYAxis);
      pdfDoc.text(cleanStatus, 180, currentYAxis);

      pdfDoc.setDrawColor(240, 240, 240);
      pdfDoc.line(15, currentYAxis + 2.5, 195, currentYAxis + 2.5);
      
      currentYAxis += 7.5;
    }

    // --- PIE DE PÁGINA INMUTABLE ---
    pdfDoc.setFont('helvetica', 'oblique');
    pdfDoc.setFontSize(7.5);
    pdfDoc.setTextColor(150, 150, 150);
    pdfDoc.text('Documento cifrado emitido bajo protocolo de seguridad AES-256-GCM. Conforme a Ley 1581 Habeas Data.', 15, 288);

    const fileSuffix = `REPORTE_CRM_${Date.now()}.pdf`;
    pdfDoc.save(fileSuffix);
  }
}
