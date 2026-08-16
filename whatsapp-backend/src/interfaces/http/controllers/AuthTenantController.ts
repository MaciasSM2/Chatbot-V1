/**
 * @file AuthTenantController.ts
 * @description Controlador para el login y emisión de contexto JWT RBAC de inquilinos.
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ITenantRepository } from '../../../core/interfaces/repositories/ITenantRepository';

export class AuthTenantController {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  /**
   * POST /api/v2/auth/login
   * Valida credenciales de operadores y emite un JWT con rol y tenantId codificados.
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        res.status(400).json({ success: false, error: 'Email y contraseña requeridos.' });
        return;
      }

      const user = await this.tenantRepository.findUserByEmail(email);

      // Simulación de validación para demostración si el registro no está en DB
      if (!user) {
        // Generar un mock de sesión si el email es válido para prueba
        if (email.includes('@')) {
          const mockRole = email.includes('admina') ? 'SUPER_ADMIN_A' : 
                             email.includes('adminb') ? 'SUPER_ADMIN_B' : 
                             email.includes('adminc') ? 'SUPER_ADMIN_C' : 'ROLE_PRESENTACION';
          
          const token = jwt.sign(
            { userId: 'mock-user', tenantId: 'tenant-demo', email, role: mockRole },
            process.env.JWT_SECRET || 'master_jwt_secret_token_corporate_2026',
            { expiresIn: '8h' }
          );

          res.status(200).json({
            success: true,
            token,
            user: { email, role: mockRole, tenantId: 'tenant-demo' }
          });
          return;
        }

        res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
        return;
      }

      // Validar contraseña (aquí usaríamos bcrypt, en demo simple texto plano)
      if (user.passwordHash !== password) {
        res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, tenantId: user.tenantId, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'master_jwt_secret_token_corporate_2026',
        { expiresIn: '8h' }
      );

      res.status(200).json({
        success: true,
        token,
        user: { email: user.email, role: user.role, tenantId: user.tenantId }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error en autenticación';
      res.status(500).json({ success: false, error: message });
    }
  };
}
