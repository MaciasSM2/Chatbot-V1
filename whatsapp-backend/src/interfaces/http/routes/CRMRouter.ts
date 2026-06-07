/**
 * @file CRMRouter.ts
 * @description Router dedicado para los flujos operativos del CRM.
 */
import { Router } from 'express';
import { CRMController } from '../controllers/CRMController';

export class CRMRouter {
  private readonly router: Router = Router();

  constructor(private readonly controller: CRMController) {
    this.exposeRoutes();
  }

  private exposeRoutes(): void {
    // Vinculación explícita preservando el contexto orientado a objetos
    this.router.get('/crm/clients', (req, res) => this.controller.getClients(req, res));
  }

  public getRouter(): Router { return this.router; }
}
