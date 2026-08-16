/**
 * @file RbacGuardMiddleware.ts
 * @description Middleware HTTP que intercepta las peticiones y bloquea accesos no autorizados.
 */

import { Request, Response, NextFunction } from 'express';
import { RbacPolicyService } from '../../../core/services/RbacPolicyService';
import { IUserAuthContext, Permission } from '../../../core/domain/entities/UserPermission';

export class RbacGuardMiddleware {
  constructor(private readonly policyService: RbacPolicyService) {}

  /**
   * Middleware para requerir un permiso específico.
   */
  public requirePermission(requiredPermission: Permission) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const userContext = (req as unknown as { user?: IUserAuthContext }).user;

      if (!userContext) {
        res.status(401).json({
          success: false,
          error: 'Acceso denegado: Usuario no autenticado.',
        });
        return;
      }

      const isAuthorized = this.policyService.hasPermission(userContext, requiredPermission);

      if (!isAuthorized) {
        res.status(403).json({
          success: false,
          error: `Acceso restringido: El perfil [${userContext.role}] no tiene autorización para esta función.`,
        });
        return;
      }

      next();
    };
  }
}
