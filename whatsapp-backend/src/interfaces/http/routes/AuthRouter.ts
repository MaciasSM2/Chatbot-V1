/**
 * @file AuthRouter.ts
 * @description Enrutador para autenticación que expone /login y /logout sin credenciales fijas quemadas.
 */
import { Router } from 'express';
import { SecurityService } from '../../../core/services/SecurityService';
import { AuthController } from '../controllers/AuthController';
import { dbPool } from '../../../infrastructure/database/MySQLConnection';

export class AuthRouter {
  private readonly router = Router();
  private readonly controller: AuthController;

  constructor(private readonly securityService: SecurityService) {
    this.controller = new AuthController(dbPool, this.securityService);
    this.exposeRoutes();
  }

  private exposeRoutes(): void {
    // POST /api/auth/login
    this.router.post('/login', this.controller.executeLogin);

    // POST /api/auth/logout
    this.router.post('/logout', this.controller.executeLogout);
  }

  public getRouter(): Router {
    return this.router;
  }
}
