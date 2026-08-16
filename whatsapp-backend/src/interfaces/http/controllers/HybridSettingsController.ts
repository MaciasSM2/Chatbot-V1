/**
 * @file HybridSettingsController.ts
 * @description Controlador HTTP para gestión de umbrales heurísticos y activaciones de IA por tenant.
 */

import { Request, Response } from 'express';

export class HybridSettingsController {
  private static readonly inMemoryThresholds = new Map<string, number>();

  constructor() {}

  /**
   * POST /api/v2/tenant/hybrid/threshold
   * Guarda el umbral de activación heurística de IA para el Tenant.
   */
  public saveThreshold = async (req: Request, res: Response): Promise<void> => {
    try {
      const userContext = (req as any).user || { tenantId: 'tenant-demo' };
      const { threshold } = req.body || {};

      if (threshold === undefined || typeof threshold !== 'number' || threshold < 0 || threshold > 1) {
        res.status(400).json({
          success: false,
          error: 'El parámetro "threshold" es requerido y debe ser un número entre 0.0 y 1.0.',
        });
        return;
      }

      HybridSettingsController.inMemoryThresholds.set(userContext.tenantId, threshold);

      res.status(200).json({
        success: true,
        message: `⚡ Umbral de activación heurística fijado en ${threshold} para el Tenant.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno de controlador';
      res.status(500).json({ success: false, error: message });
    }
  };

  /**
   * GET /api/v2/tenant/hybrid/threshold
   * Obtiene el umbral configurado o el default de 0.5.
   */
  public getThreshold = async (req: Request, res: Response): Promise<void> => {
    const userContext = (req as any).user || { tenantId: 'tenant-demo' };
    const threshold = HybridSettingsController.inMemoryThresholds.get(userContext.tenantId) ?? 0.5;

    res.status(200).json({
      success: true,
      data: { threshold }
    });
  };
}
