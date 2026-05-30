/**
 * @file AuthMiddleware.ts
 * @description Middleware encargado de interceptar el ciclo req/res de Express
 * para validar privilegios administrativos antes de tocar endpoints críticos.
 */

import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../../core/services/TokenService';

// Extensión tipada de la interfaz Request de Express mediante Declaration Merging
declare global {
  namespace Express {
    interface Request {
      user?: import('../../../core/services/TokenService').IAdminPayload;
    }
  }
}

export class AuthMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * Intercepta la petición HTTP, evalúa el esquema Bearer y autoriza el paso al controlador.
   */
  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    try {
      const authHeader = req.headers.authorization;

      // Validación estructural del encabezado de autorización
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Se requiere un token de tipo Bearer válido en el encabezado de autorización.'
        });
      }

      // Extracción del hash del token omitiendo la palabra reservada 'Bearer '
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Estructura de token malformada.'
        });
      }

      // Delegación de la verificación al servicio puro de dominio
      const decodedPayload = this.tokenService.verifyToken(token);

      // Inyección de la identidad en el stream de la petición para auditorías posteriores
      req.user = decodedPayload;

      // Cede el control de la ejecución al siguiente nodo (Middleware o Controlador)
      return next();

    } catch (error: any) {
      // Captura controlada de excepciones de dominio específicas
      return res.status(401).json({
        error: 'Unauthorized',
        message: error?.message || 'Fallo de autenticación en la capa de seguridad.'
      });
    }
  };
}
