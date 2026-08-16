/**
 * @file MultiChatController.ts
 * @description Controlador HTTP para la simulación simultánea.
 * Recibe el mensaje único del cliente y lo delega al MultiChatOrchestrator.
 */

import { Request, Response } from 'express';
import { MultiChatOrchestrator } from '../../../core/services/MultiChatOrchestrator';

export class MultiChatController {
  constructor(private readonly multiChatOrchestrator: MultiChatOrchestrator) {}

  /**
   * POST /api/v2/simulator/multi-chat
   * Ejecuta la consulta síncrona en los 3 motores en paralelo.
   */
  public executeSimultaneousChats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userContext = (req as any).user;
      const { text, userPhone, tenantId: bodyTenantId } = req.body || {};

      const activeTenantId = userContext?.tenantId || bodyTenantId || 'tenant-demo-01';
      const targetPhone = userPhone || 'SIMULATOR-QUAD-USER';

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'El parámetro "text" es obligatorio y no puede estar vacío.',
        });
        return;
      }

      const results = await this.multiChatOrchestrator.executeSimultaneousChats(
        activeTenantId,
        targetPhone,
        text.trim()
      );

      res.status(200).json({
        success: true,
        data: results,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error interno en el orquestador simultáneo.';
      res.status(500).json({ success: false, error: errorMessage });
    }
  };

  public handleMultiChatExecution = async (req: Request, res: Response): Promise<void> => {
    return this.executeSimultaneousChats(req, res);
  };
}
