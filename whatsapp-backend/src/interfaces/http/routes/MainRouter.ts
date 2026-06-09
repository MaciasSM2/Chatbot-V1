/**
 * @file MainRouter.ts
 * @description Orquestador maestro de la frontera de red Express 5.
 */
import { Router } from 'express';
import Redis from 'ioredis';

import { WhatsAppWebhookController } from '../controllers/WhatsAppWebhookController';
import { CRMController } from '../controllers/CRMController';
import { BrandController } from '../controllers/BrandController';
import { QueueMonitorController } from '../controllers/QueueMonitorController';
import { SimulationController } from '../controllers/SimulationController';
import { ChatController } from '../ChatController';
import { GreetingController } from '../GreetingController';
import { ModuleSettingsController } from '../controllers/ModuleSettingsController';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { TimePeriodsController } from '../controllers/TimePeriodsController';

import { CorrelationIdMiddleware } from '../middlewares/CorrelationIdMiddleware';
import { RedisRateLimiterMiddleware } from '../middlewares/RedisRateLimiterMiddleware';
import { RutUploadMiddleware } from '../middlewares/RutUploadMiddleware';
import { validateUnifiedMetaSignature } from '../middlewares/UnifiedSignatureValidator';

export class MainRouter {
  private readonly router: Router;
  private readonly correlationGuard: CorrelationIdMiddleware;
  private readonly rateLimiterGuard: RedisRateLimiterMiddleware;
  private readonly uploadGuard: RutUploadMiddleware;

  constructor(
    private readonly webhookController: WhatsAppWebhookController,
    private readonly crmController: CRMController,
    private readonly brandController: BrandController,
    private readonly queueController: QueueMonitorController,
    private readonly simulationController: SimulationController,
    private readonly chatController: ChatController,
    private readonly greetingController: GreetingController,
    private readonly moduleController: ModuleSettingsController,
    private readonly analyticsController: AnalyticsController,
    private readonly timePeriodsController: TimePeriodsController,
    private readonly redisClient: Redis
  ) {
    this.router = Router();

    this.correlationGuard = new CorrelationIdMiddleware();
    this.rateLimiterGuard = new RedisRateLimiterMiddleware(this.redisClient);
    this.uploadGuard = new RutUploadMiddleware();

    this.compileMasterPipeline();
  }

  /**
   * Compila la tubería inmutable de red.
   */
  private compileMasterPipeline(): void {
    this.router.use(this.correlationGuard.injectCorrelationId);

    /* ──────────────────────────────────────────────────────────────
        1. WEBHOOK META v21.0 CON VALIDACIÓN HMAC
        ────────────────────────────────────────────────────────────── */
    const webhookLimiter = this.rateLimiterGuard.limitByContext(60, 60);
    this.router.get('/webhook', webhookLimiter, this.webhookController.verifyWebhook);
    this.router.post('/webhook', webhookLimiter, validateUnifiedMetaSignature, this.webhookController.handleIncomingPayload);

    /* ──────────────────────────────────────────────────────────────
        2. RUTAS ADMINISTRATIVAS
        ────────────────────────────────────────────────────────────── */
    const adminSubRouter = Router();

    adminSubRouter.get('/crm/clients', this.crmController.getClients);
    adminSubRouter.post('/crm/clients', this.crmController.createClient);
    adminSubRouter.put('/crm/clients/:id', this.crmController.updateClient);
    adminSubRouter.post('/crm/clients/upload-rut', this.uploadGuard.interceptBinaryStream, (req, res) => {
      res.status(200).json({ success: true, path: (req as any).sanitizedUploadedFilePath });
    });
    adminSubRouter.post('/crm/clients/sync', this.crmController.syncClient);
    adminSubRouter.get('/settings/brand', this.brandController.getBrandSettings);
    adminSubRouter.patch('/settings/brand/tone', this.brandController.updateBrandTone);
    adminSubRouter.get('/settings/modules', this.moduleController.getModules);
    adminSubRouter.put('/settings/modules/:id', this.moduleController.updateModuleStatus);
    adminSubRouter.get('/settings/modules/audit', this.moduleController.getAuditLogs);
    adminSubRouter.get('/settings/time-periods', this.timePeriodsController.getPeriods);
    adminSubRouter.put('/settings/time-periods/:id', this.timePeriodsController.updatePeriod);
    adminSubRouter.post('/chat/toggle-pause', this.chatController.toggleBotAutomation);
    adminSubRouter.get('/queues/stats', this.queueController.fetchQueueTelemetry);
    adminSubRouter.post('/queues/purge-failed', this.queueController.cleanFailedJobsRegistry);
    this.router.use('/admin', adminSubRouter);

    /* ──────────────────────────────────────────────────────────────
         4. SIMULADOR (RATE 20/min)
         ────────────────────────────────────────────────────────────── */
    const simulationSubRouter = Router();
    simulationSubRouter.use(this.rateLimiterGuard.limitByContext(20, 60));
    simulationSubRouter.post('/message', this.simulationController.handleSimulatorMessage);
    simulationSubRouter.post('/scenario', this.simulationController.executeMockScenario);
    this.router.use('/simulator', simulationSubRouter);

    /* ──────────────────────────────────────────────────────────────
         5. SALUDOS (DATA SUB-ROUTER)
         ────────────────────────────────────────────────────────────── */
    const dataSubRouter = Router();
    dataSubRouter.get('/greetings', this.greetingController.listTemplates);
    dataSubRouter.post('/greetings', this.greetingController.createTemplate);
    dataSubRouter.put('/greetings/:id', this.greetingController.updateTemplate);
    dataSubRouter.delete('/greetings/:id', this.greetingController.deleteTemplate);
    this.router.use('/', dataSubRouter);

    /* ──────────────────────────────────────────────────────────────
         6. CHATS — RESET (alias para resetTestChat)
         ────────────────────────────────────────────────────────────── */
    this.router.post('/chats/:chatId/reset', this.chatController.resetTestChat);

    /* ──────────────────────────────────────────────────────────────
         7. ANALYTICS — dashboard metrics
         ────────────────────────────────────────────────────────────── */
    this.router.get('/analytics', this.analyticsController.getDashboardMetrics);
  }

  /**
   * Retorna el enrutador maestro configurado listo para el consumo de Express 5.
   */
  public getRouter(): Router {
    return this.router;
  }
}
