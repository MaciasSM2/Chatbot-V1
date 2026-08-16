/**
 * @file TenantSettingsController.ts
 * @description Controlador HTTP para la gestión de llaves y parámetros.
 * Notifica automáticamente en tiempo real al frontend tras persisitir cambios en BD.
 */

import { Request, Response } from 'express';
import { ITenantRepository } from '../../../core/interfaces/repositories/ITenantRepository';
import { ConfigurationBroadcaster } from '../../../core/events/ConfigurationBroadcaster';

export class TenantSettingsController {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly broadcaster: ConfigurationBroadcaster
  ) {}

  /**
   * GET /api/v2/tenant/settings
   */
  public getTenantSettings = async (req: Request, res: Response): Promise<void> => {
    const tenantId = (req.params.tenantId || req.query.tenantId || 'tenant-demo') as string;
    const config = await this.tenantRepository.getTenantApiKey(tenantId);

    res.status(200).json({
      success: true,
      data: {
        tenantId,
        provider: config?.provider || 'OPENAI',
        hasApiKey: Boolean(config?.plainApiKey),
        aiModel: config?.selectedModel || 'gpt-4o-mini'
      }
    });
  };

  /**
   * POST /api/v2/tenant/api-key
   * Guarda las credenciales cifradas y dispara la notificación en tiempo real a los clientes.
   */
  public saveApiKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const userContext = (req as unknown as { user?: { tenantId: string; email: string } }).user || {
        tenantId: req.body?.tenantId || 'tenant-demo',
        email: 'admin@system.local'
      };
      const { provider = 'OPENAI', apiKey, selectedModel = 'gpt-4o-mini', tenantId } = req.body || {};
      const targetTenantId = tenantId || userContext.tenantId;

      if (!apiKey && !req.body?.openaiApiKey) {
        res.status(400).json({
          success: false,
          error: 'Parámetros requeridos ausentes: provider, apiKey, selectedModel.',
        });
        return;
      }

      const keyToEncrypt = String(apiKey || req.body?.openaiApiKey).trim();

      // 1. Persistencia en base de datos relacional
      await this.tenantRepository.saveTenantApiKey({
        tenantId: targetTenantId,
        provider: provider.toUpperCase() as any,
        plainApiKey: keyToEncrypt,
        selectedModel: String(selectedModel).trim(),
      });

      // 2. Emisión del evento en tiempo real vía WebSocket (Observer)
      this.broadcaster.notifyConfigUpdated({
        tenantId: targetTenantId,
        updatedModule: 'API_KEYS',
        updatedBy: userContext.email,
        timestamp: new Date().toISOString(),
      });

      res.status(200).json({
        success: true,
        message: '🔑 Credencial cifrada y notificada en tiempo real a los clientes activos.',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error interno de servidor';
      res.status(500).json({ success: false, error: message });
    }
  };

  public saveTenantApiKey = async (req: Request, res: Response): Promise<void> => {
    return this.saveApiKey(req, res);
  };
}
