/**
 * @file DocumentTreeParser.ts
 * @description Parser multiformato (PDF, TXT, JSON, CSV, XLSX) que transforma archivos heterogéneos
 * en un árbol estandarizado de reglas de decisión (IDecisionNode[]).
 */

import fs from 'fs';
import path from 'path';

export interface IDecisionNode {
  id: string;
  triggerKeywords: string[];
  responsePayload: string;
}

export interface IParsedDocumentResult {
  rawTextContent: string;
  decisionTree: IDecisionNode[];
  metadata: {
    fileName: string;
    fileType: 'PDF' | 'TXT' | 'JSON' | 'CSV' | 'XLSX';
    totalNodesExtracted: number;
  };
}

export class DocumentTreeParser {
  /**
   * Procesa un archivo del sistema de archivos y construye su representación en árbol.
   */
  public async parseDocument(filePath: string, fileType: 'PDF' | 'TXT' | 'JSON' | 'CSV' | 'XLSX'): Promise<IParsedDocumentResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`[DocumentTreeParser] Archivo no localizado: ${filePath}`);
    }

    const fileName = path.basename(filePath);

    switch (fileType) {
      case 'JSON':
        return this.parseJson(filePath, fileName);
      case 'CSV':
      case 'XLSX':
        return this.parseTabular(filePath, fileName, fileType);
      case 'TXT':
      case 'PDF':
        return this.parseText(filePath, fileName, fileType);
      default:
        throw new Error(`[DocumentTreeParser] Formato de archivo no soportado: ${fileType}`);
    }
  }

  private async parseJson(filePath: string, fileName: string): Promise<IParsedDocumentResult> {
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(rawData);

    const decisionTree: IDecisionNode[] = Array.isArray(parsed)
      ? parsed.map((item: Record<string, any>, index: number) => ({
          id: String(item.id || `node-${index}`),
          triggerKeywords: Array.isArray(item.keywords) ? item.keywords.map(String) : [],
          responsePayload: String(item.response || item.answer || ''),
        }))
      : [];

    return {
      rawTextContent: rawData,
      decisionTree,
      metadata: { fileName, fileType: 'JSON', totalNodesExtracted: decisionTree.length },
    };
  }

  private async parseTabular(filePath: string, fileName: string, fileType: 'CSV' | 'XLSX'): Promise<IParsedDocumentResult> {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const lines = rawContent.split('\n').filter(line => line.trim().length > 0);
    const decisionTree: IDecisionNode[] = [];

    // Omitir fila 0 (Cabecera del CSV/Excel exportado)
    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i]?.split(',') || [];
      if (columns.length >= 2) {
        const firstCol = columns[0];
        const secondCol = columns[1];
        if (firstCol && secondCol) {
          const triggers = firstCol.trim().toLowerCase().split(';');
          const responsePayload = secondCol.trim();

          if (responsePayload.length > 0) {
            decisionTree.push({
              id: `tab-node-${i}`,
              triggerKeywords: triggers,
              responsePayload,
            });
          }
        }
      }
    }

    return {
      rawTextContent: rawContent,
      decisionTree,
      metadata: { fileName, fileType, totalNodesExtracted: decisionTree.length },
    };
  }

  private async parseText(filePath: string, fileName: string, fileType: 'TXT' | 'PDF'): Promise<IParsedDocumentResult> {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const sections = rawContent.split(/\n\s*\n/).filter(s => s.trim().length > 0);

    const decisionTree: IDecisionNode[] = sections.map((section, index) => {
      const words = section.toLowerCase().replace(/[^a-z0-9áéíóúñ\s]/g, '').split(/\s+/);
      const keywords = Array.from(new Set(words.filter(w => w.length > 3))).slice(0, 5);

      return {
        id: `text-node-${index}`,
        triggerKeywords: keywords,
        responsePayload: section.trim(),
      };
    });

    return {
      rawTextContent: rawContent,
      decisionTree,
      metadata: { fileName, fileType, totalNodesExtracted: decisionTree.length },
    };
  }
}
