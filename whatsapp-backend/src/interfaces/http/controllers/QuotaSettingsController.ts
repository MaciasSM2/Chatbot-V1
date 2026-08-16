/**
 * @file QuotaSettingsController.ts
 * @description Controlador HTTP para gestión de límites presupuestales y telemetría de cuotas diarias.
 */

import { Request, Response } from 'express';
import { TenantQuotaService } from '../../../core/services/TenantQuotaService';

export class QuotaSettingsController {
  private readonly quotaService: TenantQuotaService;

  constructor() {
    this.quotaService = new TenantQuotaService();
  }

  /**
   * POST /api/v2/tenant/quota/limit
   * Guarda el límite diario en USD para el Tenant.
   */
  public saveDailyLimit = async (req: Request, res: Response): Promise<void> => {
    try {
      const userContext = (req as any).user || { tenantId: 'tenant-demo-01' };
      const { limitUsd } = req.body || {};

      if (limitUsd === undefined || typeof limitUsd !== 'number' || limitUsd < 0) {
        res.status(400).json({
          success: false,
          error: 'El parámetro "limitUsd" es requerido y debe ser un número mayor o igual a 0.0.',
        });
        return;
      }

      await this.quotaService.setDailyLimit(userContext.tenantId, limitUsd);

      res.status(200).json({
        success: true,
        message: `⚡ Límite presupuestal diario fijado en $${limitUsd} USD para el Tenant.`,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno de controlador';
      res.status(500).json({ success: false, error: message });
    }
  };

  /**
   * GET /api/v2/tenant/quota/status
   * Obtiene la telemetría de consumo acumulado y límites activos para el Tenant.
   */
  public getQuotaStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const userContext = (req as any).user || { tenantId: 'tenant-demo-01' };
      const status = await this.quotaService.getQuotaStatus(userContext.tenantId);

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno de controlador';
      res.status(500).json({ success: false, error: message });
    }
  };
}
