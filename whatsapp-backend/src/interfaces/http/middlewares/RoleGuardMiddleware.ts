/**
 * @file RoleGuardMiddleware.ts
 * @description Interceptor de seguridad perimetral de autorización por roles (RBAC).
 */

import { Request, Response, NextFunction } from 'express';

export type UserRole = 'ROLE_PRESENTACION' | 'SUPER_ADMIN_A' | 'SUPER_ADMIN_B' | 'SUPER_ADMIN_C' | 'VIEWER' | 'ADMIN_A' | 'ADMIN_B' | 'ADMIN_C';

export interface IAuthenticatedUserContext {
  userId: string;
  tenantId: string;
  email: string;
  role: UserRole;
}

export class RoleGuardMiddleware {
  /**
   * Fabrica de middlewares de autorización.
   * 
   * @param allowedRoles Lista explícita de roles autorizados para el endpoint.
   */
  public static authorize(allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const userContext = (req as unknown as { user?: IAuthenticatedUserContext }).user;

      if (!userContext || !userContext.role || !userContext.tenantId) {
        res.status(401).json({
          success: false,
          error: 'Acceso denegado: Contexto de sesión o identidad tenant ausente.',
        });
        return;
      }

      const isAuthorized = allowedRoles.includes(userContext.role);

      if (!isAuthorized) {
        res.status(403).json({
          success: false,
          error: `Acceso restringido: El perfil [${userContext.role}] no posee privilegios sobre este módulo.`,
        });
        return;
      }

      next();
    };
  }
}
