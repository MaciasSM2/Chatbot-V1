/**
 * @file HealthRouter.ts
 */
import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

export class HealthRouter {
  private readonly router: Router = Router();

  constructor(private readonly controller: HealthController) {
    this.router.get('/system/health', (req, res) => this.controller.checkSystemVitality(req, res));
  }

  public getRouter(): Router { return this.router; }
}
