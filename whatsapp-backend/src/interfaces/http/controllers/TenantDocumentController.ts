/**
 * @file TenantDocumentController.ts
 * @description Controlador HTTP encendido para recibir, parsear y asociar archivos de estructura por Tenant.
 */

import { Request, Response } from 'express';
import { ITenantRepository } from '../../../core/interfaces/repositories/ITenantRepository';
import { DocumentTreeParser } from '../../../core/services/DocumentTreeParser';

export class TenantDocumentController {
  private readonly parser: DocumentTreeParser;

  constructor(private readonly tenantRepository: ITenantRepository) {
    this.parser = new DocumentTreeParser();
  }

  /**
   * POST /api/v2/tenant/document
   * Procesa y almacena un archivo estructurado vinculándolo al Tenant y al tipo de Chat correspondiente.
   */
  public uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const userContext = (req as any).user || { tenantId: 'tenant-demo' };
      const { chatType, fileType, filePath, fileName, textContent } = req.body || {};

      if (!chatType || !fileType) {
        res.status(400).json({
          success: false,
          error: 'Parámetros requeridos ausentes: chatType, fileType.',
        });
        return;
      }

      let finalFilePath = filePath;
      let finalFileName = fileName || 'document_upload';

      // Si suben contenido directo como texto o JSON
      if (textContent) {
        finalFilePath = `./temp_upload_${Date.now()}.txt`;
        require('fs').writeFileSync(finalFilePath, textContent, 'utf-8');
        finalFileName = 'direct_text_entry';
      }

      if (!finalFilePath) {
        res.status(400).json({
          success: false,
          error: 'Debe especificar filePath o textContent.',
        });
        return;
      }

      // 1. Ejecutar el parseo unificado
      const parseResult = await this.parser.parseDocument(finalFilePath, fileType);

      // 2. Guardar en la base de datos vinculada al Tenant
      const docId = await this.tenantRepository.saveTenantDocument(
        userContext.tenantId,
        chatType,
        finalFileName,
        fileType,
        parseResult.rawTextContent,
        JSON.stringify(parseResult.decisionTree)
      );

      // Limpieza de archivo temporal si fue generado
      if (textContent && require('fs').existsSync(finalFilePath)) {
        require('fs').unlinkSync(finalFilePath);
      }

      res.status(200).json({
        success: true,
        message: '📄 Documento procesado e indexado en el árbol de decisión con éxito.',
        data: {
          documentId: docId,
          nodesExtracted: parseResult.metadata.totalNodesExtracted,
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno al procesar el documento.';
      res.status(500).json({ success: false, error: message });
    }
  };
}
