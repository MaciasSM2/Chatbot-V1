import { Request, Response } from 'express';
import { BotEngineService, BotType } from '../../../core/services/BotEngineService';
import { DocumentParserService } from '../../../core/services/DocumentParserService';

export class BotController {
  private botEngine = new BotEngineService();
  private docParser = new DocumentParserService();

  public chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { botType, userMessage, conversationHistory, rules, documentContext, aiConfig } = req.body;

      if (!userMessage || !botType) {
        res.status(400).json({ success: false, error: 'Campos userMessage y botType son requeridos' });
        return;
      }

      const result = await this.botEngine.processMessage({
        botType: botType as BotType,
        userMessage,
        conversationHistory: conversationHistory || [],
        rules: rules || [],
        documentContext: documentContext || '',
        aiConfig
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      console.error('Error en BotController.chat:', err);
      res.status(500).json({ success: false, error: err.message || 'Error interno' });
    }
  };

  public uploadDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = (req as any).files?.document || (req as any).file;
      const fileName = file?.name || req.body?.fileName || 'document.txt';
      const fileType = file?.mimetype || req.body?.fileType || 'text/plain';

      let buffer: Buffer;
      if (file?.data) {
        buffer = file.data;
      } else if (req.body?.contentBase64) {
        buffer = Buffer.from(req.body.contentBase64, 'base64');
      } else if (req.body?.rawText) {
        buffer = Buffer.from(req.body.rawText, 'utf-8');
      } else {
        res.status(400).json({ success: false, error: 'No se envió archivo o contenido' });
        return;
      }

      const parsed = await this.docParser.parseDocument(buffer, fileType, fileName);

      res.json({
        success: true,
        data: parsed
      });
    } catch (err: any) {
      console.error('Error procesando documento:', err);
      res.status(500).json({ success: false, error: err.message || 'Error al procesar archivo' });
    }
  };
}
