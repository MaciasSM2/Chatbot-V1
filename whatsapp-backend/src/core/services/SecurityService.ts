/**
 * @file SecurityService.ts
 * @description Servicio maestro de criptografía del dominio.
 * Sella las credenciales de operadores mediante scrypt y gestiona tokens de sesión simétricos.
 */
import crypto from 'crypto';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import logger from '../../infrastructure/logging/Logger';

export interface IOperatorSessionPayload {
  operatorId: string;
  email: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR';
  issuedAt: number;
  expiresAt: number;
}

export class SecurityService {
  private readonly JWT_SECRET_BUFFER: Buffer;
  private readonly HASH_ALGORITHM = 'sha256';
  private readonly TOKEN_DURATION_MS = 8 * 60 * 60 * 1000; // Turno estándar de 8 Horas

  constructor() {
    // Recuperar la firma maestra desde el perimeter perimetral de Zod Env
    const secretSeed = process.env.JWT_SECRET || 'secure_master_seed_generation_token_2026_default';
    this.JWT_SECRET_BUFFER = crypto.createHash(this.HASH_ALGORITHM).update(secretSeed).digest();
  }

  /**
   * Genera un Hash robusto e inmutable para almacenar contraseñas mediante scrypt de forma determinista.
   */
  public hashPassword(plainTextPassword: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(plainTextPassword, salt, 64);
    
    // Almacenar el salt junto al buffer derivado utilizando la delimitación por puntos estándar
    return `${salt}.${derivedKey.toString('hex')}`;
  }

  /**
   * Realiza la comparación en tiempo constante para mitigar ataques de temporización (Timing Attacks).
   */
  public verifyPassword(plainTextPassword: string, storedHashPackage: string): boolean {
    try {
      const [salt, originalHexHash] = storedHashPackage.split('.');
      if (!salt || !originalHexHash) return false;

      const bufferToVerify = Buffer.from(originalHexHash, 'hex');
      const verificationKey = crypto.scryptSync(plainTextPassword, salt, 64);

      // Usar timingSafeEqual para blindar el hilo de la CPU ante inspecciones analíticas de latencia
      return crypto.timingSafeEqual(bufferToVerify, verificationKey);
    } catch (err) {
      return false;
    }
  }

  /**
   * Compila y firma digitalmente una estructura inmutable de sesión (Self-Contained Token).
   */
  public generateSessionToken(operatorId: string, email: string, role: 'ADMIN' | 'SUPERVISOR' | 'OPERATOR'): string {
    const now = Date.now();
    
    const payload: IOperatorSessionPayload = {
      operatorId,
      email,
      role,
      issuedAt: now,
      expiresAt: now + this.TOKEN_DURATION_MS
    };

    const serializedPayload = JSON.stringify(payload);
    const base64Payload = Buffer.from(serializedPayload).toString('base64url');

    // Computar la firma electrónica HMAC SHA-256 para blindar el token contra alteraciones
    const hmac = crypto.createHmac('sha256', this.JWT_SECRET_BUFFER);
    hmac.update(base64Payload);
    const cryptographicSignature = hmac.digest('base64url');

    // Retornar el token compacto White-Label unificado
    return `${base64Payload}.${cryptographicSignature}`;
  }

  /**
   * Inspecciona, decodifica y valida de forma perimetral el token recibido desde el cliente.
   */
  public verifySessionToken(tokenString: string): IOperatorSessionPayload {
    const [base64Payload, receivedSignature] = tokenString.split('.');
    
    if (!base64Payload || !receivedSignature) {
      throw new UnauthorizedError('Estructura token corrupta o fragmentada.');
    }

    // 1. Validar criptográficamente la integridad de la firma antes de procesar el JSON
    const hmac = crypto.createHmac('sha256', this.JWT_SECRET_BUFFER);
    hmac.update(base64Payload);
    const validSignature = hmac.digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(receivedSignature), Buffer.from(validSignature))) {
      logger.warn('🚨 [Security Engine] Detectada alteración de bytes en firma JWT de red.');
      throw new UnauthorizedError('Firma de sesión inválida o manipulada de forma externa.');
    }

    // 2. Decodificar el JSON y evaluar las fronteras temporales del turno
    const jsonString = Buffer.from(base64Payload, 'base64url').toString('utf8');
    const session: IOperatorSessionPayload = JSON.parse(jsonString);

    if (Date.now() > session.expiresAt) {
      throw new UnauthorizedError('Turno operativo caducado. Se requiere re-autenticación.');
    }

    return session;
  }
}
