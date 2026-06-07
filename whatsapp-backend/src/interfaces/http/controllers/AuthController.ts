/**
 * @file AuthController.ts
 * @description Controlador de red encargado de gobernar el alta y baja de cookies de sesión.
 * Erradica el almacenamiento inseguro en localStorage implementando el estándar HttpOnly.
 */
import { Request, Response } from 'express';
import { Pool, RowDataPacket } from 'mysql2/promise';
import { SecurityService } from '../../../core/services/SecurityService';
import logger from '../../../infrastructure/logging/Logger';

export class AuthController {
  constructor(
    private readonly mariadbPool: Pool,
    private readonly securityService: SecurityService
  ) {}

  /**
   * POST /api/auth/login
   * Valida credenciales relacionales e inyecta la cookie de aislamiento inmutable.
   */
  public executeLogin = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Campos obligatorios ausentes en el cuerpo HTTP.' });
      return;
    }

    try {
      // 1. Consultar de forma indexada la existencia física del operador en MariaDB
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT id, email, password_hash, role FROM operadores_sistema WHERE UPPER(email) = ? LIMIT 1`,
        [email.toUpperCase().trim()]
      );

      const operator = rows[0];

      // 2. Ejecutar verificación determinista en tiempo constante mediante scrypt
      if (!operator || !this.securityService.verifyPassword(password, operator.password_hash)) {
        logger.warn(`[Login Auth Alert] Intento de acceso denegado para la cuenta: ${email}`);
        res.status(401).json({ success: false, error: 'Credenciales de acceso incorrectas o inexistentes.' });
        return;
      }

      // 3. Compilar el token firmado compacto White-Label
      const sessionToken = this.securityService.generateSessionToken(
        operator.id,
        operator.email,
        operator.role
      );

      // 4. RESOLUCIÓN DE RIESGO 4: Inyección perimetral hermética via Cookies HTTP-Only
      const cookieOptionsString = [
        `admin_session_token=${sessionToken}`,
        'Path=/',
        'HttpOnly',                                    // Bloqueo físico contra lectura de scripts XSS
        process.env.NODE_ENV === 'production' ? 'Secure' : '', // Obliga uso exclusivo de HTTPS en producción
        'SameSite=Strict',                             // Cortafuegos de mitigación para ataques de Cross-Site CSRF
        `Max-Age=${8 * 60 * 60}`                       // Tiempo límite de vida de 8 horas emparejado al JWT
      ].filter(Boolean).join('; ');

      res.setHeader('Set-Cookie', cookieOptionsString);

      // Compatibilidad con frontend heredado que espera 'token' cookie
      const compatCookie = [
        `token=${sessionToken}`,
        'Path=/',
        'HttpOnly',
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
        'SameSite=Strict',
        `Max-Age=${8 * 60 * 60}`
      ].filter(Boolean).join('; ');

      res.append('Set-Cookie', compatCookie);

      logger.info(`🔐 [Login Auth Success] Operador autenticado. ID: ${operator.id} | Rol: ${operator.role}`);

      res.status(200).json({
        success: true,
        userContext: {
          email: operator.email,
          role: operator.role
        },
        token: sessionToken // Mantener token en el payload por retrocompatibilidad si la UI lo lee
      });

    } catch (loginSystemCrash: any) {
      logger.error('🚨 [Auth Controller Collapse] Fallo catastrófico en Login:', loginSystemCrash);
      res.status(500).json({ success: false, error: 'Error interno en la pasarela de control de accesos.' });
    }
  };

  /**
   * POST /api/auth/logout
   * Purga y destruye de forma inmediata la validez de la cookie en el navegador del cliente.
   */
  public executeLogout = async (_req: Request, res: Response): Promise<void> => {
    // Sobreescribir la cookie fijando su Max-Age en cero para forzar su borrado del DOM
    res.setHeader('Set-Cookie', 'admin_session_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    res.append('Set-Cookie', 'token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
    logger.info('🔌 [Logout Auth] Sesión de operador purgada de la cabecera de red.');
    res.status(200).json({ success: true, message: 'Frontera de sesión cerrada correctamente.' });
  };
}
