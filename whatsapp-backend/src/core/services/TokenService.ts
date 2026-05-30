/**
 * @file TokenService.ts
 * @description Clase encargada del ciclo de vida criptográfico de los JSON Web Tokens.
 * Aplica encapsulamiento estricto sobre las claves secretas del entorno.
 */

import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError';

export interface IAdminPayload {
  adminId: string;
  username: string;
  role: 'SUPER_ADMIN' | 'OPERATOR';
}

export class TokenService {
  private readonly jwtSecret: string;
  // Expiración por defecto acoplada a la jornada laboral estándar (8 horas)
  private readonly expirationTime: string = '8h'; 

  constructor() {
    // Garantiza de forma temprana que la aplicación falle si no se configura la semilla de seguridad
    this.jwtSecret = process.env.JWT_SECRET || '';
    if (!this.jwtSecret) {
      throw new Error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is missing.');
    }
  }

  /**
   * Genera un nuevo token firmado para un administrador autenticado.
   * @param {IAdminPayload} payload - Datos de identidad del usuario.
   */
  public generateToken(payload: IAdminPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.expirationTime as any });
  }

  /**
   * Verifica la firma y decodifica el contenido de un token recibido por HTTP.
   * @param {string} token - Token en texto plano extraído del encabezado.
   * @throws {UnauthorizedError} Si la firma está corrupta o el token expiró.
   */
  public verifyToken(token: string): IAdminPayload {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded as IAdminPayload;
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedError('El token de seguridad proporcionado ha expirado.');
      }
      throw new UnauthorizedError('Firma de token inválida. Acceso denegado de forma atómica.');
    }
  }
}
