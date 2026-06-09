/**
 * @file ModuleSettingsController.ts
 * @description Controlador para gestionar la activación/desactivación de módulos.
 */

import { Request, Response } from 'express';
import { ModuleSettingsService } from '../../../core/services/ModuleSettingsService';
import logger from '../../../infrastructure/logging/Logger';

export class ModuleSettingsController {
  constructor(private readonly moduleService: ModuleSettingsService) {}

  public getModules = async (_req: Request, res: Response): Promise<void> => {
    try {
      const modules = await this.moduleService.getModules();
      res.status(200).json(modules);
    } catch (err) {
      logger.error("Error obteniendo estado de módulos", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudo obtener la configuración de módulos." });
    }
  };

  public getAuditLogs = async (_req: Request, res: Response): Promise<void> => {
    try {
      const logs = await this.moduleService.getAuditLogs();
      res.status(200).json(logs);
    } catch (err) {
      logger.error("Error obteniendo logs de auditoría", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudo obtener el historial de auditoría." });
    }
  };

  public updateModuleStatus = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { id } = req.params;
      const { is_enabled } = req.body;
      
      const adminName = 'SYSTEM';

      if (typeof is_enabled !== 'boolean') {
        return res.status(400).json({ error: "Bad Request", message: "La propiedad is_enabled es requerida y debe ser booleana." });
      }

      const updated = await this.moduleService.updateModule(id as string, is_enabled, adminName);
      res.status(200).json(updated);
    } catch (err) {
      logger.error("Error actualizando módulo", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudo actualizar el módulo." });
    }
  };
}
