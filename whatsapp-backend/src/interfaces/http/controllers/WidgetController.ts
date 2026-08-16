/**
 * @file WidgetController.ts
 * @description Controlador público encendido para servir la configuración del Widget
 * y procesar mensajes de visitantes en sitios web de terceros.
 */

import { Request, Response } from 'express';
import { ITenantRepository } from '../../../core/interfaces/repositories/ITenantRepository';
import { IBotEngineStrategy } from '../../../core/domain/strategies/IBotEngineStrategy';

export class WidgetController {
  private readonly tenantRepository: ITenantRepository;
  private readonly fullJsStrategy: IBotEngineStrategy;
  private readonly hybridStrategy: IBotEngineStrategy;
  private readonly fullAiStrategy: IBotEngineStrategy;

  constructor(
    tenantRepository: ITenantRepository,
    fullJsStrategy: IBotEngineStrategy,
    hybridStrategy: IBotEngineStrategy,
    fullAiStrategy: IBotEngineStrategy
  ) {
    this.tenantRepository = tenantRepository;
    this.fullJsStrategy = fullJsStrategy;
    this.hybridStrategy = hybridStrategy;
    this.fullAiStrategy = fullAiStrategy;
  }

  /**
   * GET /api/v2/widget/config/:tenantId
   * Recupera el tema visual, logo y tipo de bot asignado al Widget.
   */
  public getWidgetConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantId = req.params.tenantId as string;

      if (!tenantId) {
        res.status(400).json({ success: false, error: 'Parámetro tenantId requerido.' });
        return;
      }

      const apiKeyConfig = await this.tenantRepository.getTenantApiKey(tenantId);

      res.status(200).json({
        success: true,
        data: {
          tenantId,
          primaryColor: '#10b981',
          botName: 'Asistente Virtual',
          providerActive: apiKeyConfig?.provider || 'NONE',
          supportedModes: ['FULL_JS', 'HYBRID', 'FULL_AI'],
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al obtener la configuración del Widget.';
      res.status(500).json({ success: false, error: message });
    }
  };

  /**
   * POST /api/v2/widget/message
   * Despacha la consulta del visitante del sitio web al motor asignado por el cliente.
   */
  public processWidgetMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tenantId, chatType, text, userSessionId } = req.body || {};

      if (!tenantId || !chatType || !text) {
        res.status(400).json({
          success: false,
          error: 'Parámetros obligatorios ausentes: tenantId, chatType, text.',
        });
        return;
      }

      const sessionId = userSessionId || `widget-user-${Date.now()}`;
      let strategy: IBotEngineStrategy;

      switch (chatType) {
        case 'FULL_JS':
          strategy = this.fullJsStrategy;
          break;
        case 'HYBRID':
          strategy = this.hybridStrategy;
          break;
        case 'FULL_AI':
          strategy = this.fullAiStrategy;
          break;
        default:
          strategy = this.fullJsStrategy;
      }

      const result = await strategy.processMessage(tenantId, sessionId, text.trim());

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en la ejecución del Widget.';
      res.status(500).json({ success: false, error: message });
    }
  };

  public getWidgetScript = async (_req: Request, res: Response): Promise<void> => {
    // Serve static widget JS or route content
    const fs = require('fs');
    const path = require('path');
    const widgetFilePath = path.join(__dirname, '../../../../../../whatsapp-dashboard/public/widget.js');
    if (fs.existsSync(widgetFilePath)) {
      res.setHeader('Content-Type', 'application/javascript');
      res.status(200).send(fs.readFileSync(widgetFilePath, 'utf-8'));
    } else {
      res.status(404).send('widget.js not found');
    }
  };
}
