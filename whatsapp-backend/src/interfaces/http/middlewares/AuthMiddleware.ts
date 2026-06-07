/**
 * @file AuthMiddleware.ts
 * @description Interceptor perimetral que protege las rutas del Dashboard.
 * Incorpora un analizador manual de cookies inmune a ataques de inyección.
 */
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../../../core/services/SecurityService';

declare global {
  namespace Express {
    interface Request {
      user?: {
        username: string;
        role: string;
        origin?: string;
      };
      adminContext?: any;
    }
  }
}

export class AuthMiddleware {
  constructor(private readonly securityService: SecurityService) {}

  /**
   * Intercepta la solicitud HTTP y valida la presencia de un token JWT consistente.
   */
  public intercept = (req: Request, res: Response, next: NextFunction): void => {
    try {
      let activeToken: string | null = null;

      // 1. Intentar capturar el token desde el encabezado estándar Authorization Bearer
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        activeToken = authHeader.split(' ')[1] || null;
      }

      // 2. RESOLUCIÓN DE DEUDA: Analizador manual de cookies integrado (Self-Contained Cookie Parser)
      if (!activeToken && req.headers.cookie) {
        activeToken = this.parseCookieFromHeaders(req.headers.cookie, 'admin_session_token');
        if (!activeToken) {
          activeToken = this.parseCookieFromHeaders(req.headers.cookie, 'token');
        }
      }

      if (!activeToken) {
        res.status(401).json({ 
          success: false, 
          error: 'Acceso denegado de nivel perimetral: Se requiere un token de sesión activo.' 
        });
        return;
      }

      // 3. Delegar la verificación criptográfica al SecurityService del Core (SOLID - D)
      const administratorContext = this.securityService.verifySessionToken(activeToken);
      
      // Inyectar el contexto verificado dentro del ciclo de vida del Request
      (req as any).adminContext = administratorContext;
      (req as any).user = administratorContext; // Alias para compatibilidad con código existente (ej. ModuleSettingsController)

      return next();
    } catch (securityException: any) {
      res.status(401).json({ 
        success: false, 
        error: securityException.message || 'Validación de privilegios denegada.' 
      });
    }
  };

  /**
   * Alias de ruteo Express compatible con handle original
   */
  public handle = (req: Request, res: Response, next: NextFunction): void => {
    return this.intercept(req, res, next);
  };

  /**
   * Analiza de forma determinista la cabecera Cookie sin dependencias externas.
   * Evita vulnerabilidades de denegación de servicio por expresiones regulares maliciosas (ReDoS).
   */
  private parseCookieFromHeaders(cookieHeaderString: string, targetKey: string): string | null {
    const cleanKey = targetKey.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const cookieRegex = new RegExp(`(?:^|; )${cleanKey}=([^;]*)`);
    const matchResult = cookieHeaderString.match(cookieRegex);
    
    if (!matchResult || !matchResult[1]) return null;
    
    // Decodificar el componente URI para recuperar el token JWT en formato limpio
    return decodeURIComponent(matchResult[1]);
  }
}
