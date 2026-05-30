/**
 * @file CSVUploader.tsx
 * @description Componente modular encargado de la ingesta de archivos planos (CSV), 
 * ejecutando la limpieza de streams de texto y la abstracción de columnas hacia JSONB.
 */

import React, { useRef } from 'react';
import { Upload } from 'lucide-react';

export interface ParsedCSVRow {
  phone: string;
  name: string | null;
  metadata: Record<string, any>;
}

interface CSVUploaderProps {
  isUploading: boolean;
  onUploadStart: () => void;
  onProcessBatch: (rows: ParsedCSVRow[]) => Promise<void>;
  onImportSuccess: (processedCount: number) => void;
  onImportError: (errorMessage: string) => void;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  isUploading,
  onUploadStart,
  onProcessBatch,
  onImportSuccess,
  onImportError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Normaliza cadenas de texto para transformarlas en claves JSON válidas y legibles.
   * Remueve acentos, eñes y caracteres especiales.
   */
  const normalizeHeaderKey = (header: string): string => {
    return header
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remueve diacríticos
      .trim()
      .replace(/[^a-z0-9]/g, '_')     // Reemplaza espacios/especiales por underscores
      .replace(/_+/g, '_');           // Evita múltiples underscores seguidos
  };

  /**
   * Manejador del evento de selección de archivo. Convierte el stream binario en texto plano.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación estricta del formato MIME
    if (!file.name.endsWith('.csv')) {
      onImportError('El formato del archivo debe ser estrictamente extensión .csv');
      return;
    }

    onUploadStart();
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const textStream = event.target?.result as string;
        const lines = textStream.split(/\r?\n/).filter((line) => line.trim() !== '');

        if (lines.length <= 1) {
          throw new Error('El archivo no contiene registros suficientes para procesar.');
        }

        // Extracción y sanitización de cabeceras
        const rawHeaders = lines[0]!.split(',').map((h) => h.trim());
        const normalizedHeaders = rawHeaders.map((h) => normalizeHeaderKey(h));

        // Detección heurística de columnas core del negocio (Teléfono y Nombre)
        const phoneIndex = normalizedHeaders.findIndex(
          (h) => h.includes('tel') || h.includes('phone') || h.includes('cel') || h.includes('user')
        );
        const nameIndex = normalizedHeaders.findIndex(
          (h) => h.includes('nom') || h.includes('name')
        );

        if (phoneIndex === -1) {
          throw new Error('No se detectó una columna de identificador válida (Teléfono, Celular o Phone).');
        }

        const rowsToProcess: ParsedCSVRow[] = [];

        // Iteración de registros (Línea 0 omitida por ser la cabecera)
        for (let i = 1; i < lines.length; i++) {
          const columns = lines[i]!.split(',').map((c) => c.trim());
          const rawPhone = columns[phoneIndex];

          if (!rawPhone) continue; // Salta líneas huérfanas o vacías

          const payloadPhone = rawPhone.replace(/[^0-9+]/g, ''); // Limpieza del string telefónico
          const payloadName = nameIndex !== -1 && columns[nameIndex] ? columns[nameIndex] : null;

          // Construcción de la caja de metadatos dinámica (JSONB)
          const payloadMetadata: Record<string, any> = {};
          columns.forEach((cellValue, cellIdx) => {
            if (cellIdx !== phoneIndex && cellIdx !== nameIndex) {
              const originalHeader = rawHeaders[cellIdx];
              if (originalHeader) {
                const targetKey = normalizeHeaderKey(originalHeader);
                payloadMetadata[targetKey] = cellValue || null;
              }
            }
          });

          rowsToProcess.push({
            phone: payloadPhone,
            name: payloadName,
            metadata: payloadMetadata,
          });
        }

        // Delegamos la petición HTTP al orquestador para mantener la modularidad
        await onProcessBatch(rowsToProcess);
        
        onImportSuccess(rowsToProcess.length);
        if (fileInputRef.current) fileInputRef.current.value = ''; // Flush del buffer del input

      } catch (err: any) {
        onImportError(err?.message || 'Error durante el análisis estructural del CSV');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="inline-block">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        id="csv-uploader-input"
        disabled={isUploading}
      />
      <label
        htmlFor="csv-uploader-input"
        className={`inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer ${
          isUploading ? 'opacity-50 pointer-events-none animate-pulse' : ''
        }`}
      >
        <Upload size={16} />
        {isUploading ? 'Normalizando Estructuras...' : 'Cargar CSV Masivo'}
      </label>
    </div>
  );
};
