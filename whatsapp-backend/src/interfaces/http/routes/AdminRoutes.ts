/**
 * @file AdminRoutes.ts
 * @description Enrutador que acopla el middleware de autenticación a los endpoints 
 * de alteración del estado de los módulos.
 */

import { Router } from 'express';
import { ModuleSettingsController } from '../controllers/ModuleSettingsController';
import { AuthMiddleware } from '../middlewares/AuthMiddleware';

export const createAdminRoutes = (
  moduleController: ModuleSettingsController,
  authMiddleware: AuthMiddleware
): Router => {
  const router = Router();

  // Inyección implícita del middleware protector en la tubería de rutas administrativas
  router.use(authMiddleware.handle);

  // Todos los endpoints declarados de aquí en adelante son estrictamente privados
  router.get('/modules', moduleController.getModules);
  router.patch('/modules/:id', moduleController.updateModuleStatus);
  router.get('/modules/audit', moduleController.getAuditLogs);

  return router;
};
