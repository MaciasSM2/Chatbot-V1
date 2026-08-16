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
import { BillingController } from '../controllers/BillingController';
import { CalendarController } from '../controllers/CalendarController';
import { BotController } from '../controllers/BotController';
import { MultiChatController } from '../controllers/MultiChatController';

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
    private readonly billingController: BillingController,
    private readonly calendarController: CalendarController,
    private readonly redisClient: Redis,
    private readonly multiChatController: MultiChatController,
    private readonly tenantDocumentController: any,
    private readonly hybridSettingsController: any,
    private readonly quotaSettingsController: any,
    private readonly widgetController: any,
    private readonly botController: BotController
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
    adminSubRouter.put('/settings/brand', this.brandController.updateBrandSettings);
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
         4. BILLING — facturacion
         ────────────────────────────────────────────────────────────── */
    const billingSubRouter = Router();
    billingSubRouter.get('/invoices', this.billingController.getInvoices);
    this.router.use('/billing', billingSubRouter);

    /* ──────────────────────────────────────────────────────────────
         5. CALENDAR — calendario
         ────────────────────────────────────────────────────────────── */
    const calendarSubRouter = Router();
    calendarSubRouter.get('/', this.calendarController.getExceptions);
    calendarSubRouter.post('/', this.calendarController.createException);
    calendarSubRouter.delete('/:dateStr', this.calendarController.deleteException);
    calendarSubRouter.post('/sync-colombia', this.calendarController.syncColombia);
    this.router.use('/calendar', calendarSubRouter);

    /* ──────────────────────────────────────────────────────────────
         6. SIMULADOR (RATE 20/min)
         ────────────────────────────────────────────────────────────── */
    const simulationSubRouter = Router();
    simulationSubRouter.use(this.rateLimiterGuard.limitByContext(20, 60));
    simulationSubRouter.post('/message', this.simulationController.handleSimulatorMessage);
    simulationSubRouter.post('/scenario', this.simulationController.executeMockScenario);
    simulationSubRouter.post('/multi-chat', (req, res) => {
      return this.multiChatController.handleMultiChatExecution(req, res);
    });
    this.router.use('/simulator', simulationSubRouter);

    /* ──────────────────────────────────────────────────────────────
         7. SALUDOS (DATA SUB-ROUTER)
         ────────────────────────────────────────────────────────────── */
    const dataSubRouter = Router();
    dataSubRouter.get('/greetings', (req, res) => this.greetingController.listTemplates(req, res));
    dataSubRouter.post('/greetings', (req, res) => this.greetingController.createTemplate(req, res));
    dataSubRouter.put('/greetings/:id', (req, res) => this.greetingController.updateTemplate(req, res));
    dataSubRouter.delete('/greetings/:id', (req, res) => this.greetingController.deleteTemplate(req, res));
    this.router.use('/', dataSubRouter);

    /* ──────────────────────────────────────────────────────────────
         8. CHATS — RESET (alias para resetTestChat)
         ────────────────────────────────────────────────────────────── */
    this.router.post('/chats/:chatId/reset', this.chatController.resetTestChat);
    this.router.post('/chats/:chatId/pause', this.chatController.pauseBot);
    this.router.post('/chats/:chatId/resume', this.chatController.resumeBot);

    /* ──────────────────────────────────────────────────────────────
         9. ANALYTICS — dashboard metrics
         ────────────────────────────────────────────────────────────── */
    this.router.get('/analytics', this.analyticsController.getDashboardMetrics);
    this.router.get('/analytics/summary', this.analyticsController.getSummaryStats);

    /* ──────────────────────────────────────────────────────────────
         10. BOTS & EMBEDDABLE WIDGET — 3 Modos (JS, Híbrido, Full IA)
         ────────────────────────────────────────────────────────────── */
    this.router.post('/bots/chat', this.botController.chat);
    this.router.post('/bots/upload-doc', this.botController.uploadDocument);
    this.router.post('/tenant/document', (req, res) => {
      return this.tenantDocumentController.uploadDocument(req, res);
    });
    this.router.post('/tenant/hybrid/threshold', (req, res) => {
      return this.hybridSettingsController.saveThreshold(req, res);
    });
    this.router.get('/tenant/hybrid/threshold', (req, res) => {
      return this.hybridSettingsController.getThreshold(req, res);
    });
    this.router.post('/tenant/quota/limit', (req, res) => {
      return this.quotaSettingsController.saveDailyLimit(req, res);
    });
    this.router.get('/tenant/quota/status', (req, res) => {
      return this.quotaSettingsController.getQuotaStatus(req, res);
    });
    this.router.get('/widget/script.js', (req, res) => {
      return this.widgetController.getWidgetScript(req, res);
    });
    this.router.get('/widget/config/:tenantId', (req, res) => {
      return this.widgetController.getWidgetConfig(req, res);
    });
    this.router.post('/widget/message', (req, res) => {
      return this.widgetController.processWidgetMessage(req, res);
    });
  }


  /**
   * Retorna el enrutador maestro configurado listo para el consumo de Express 5.
   */
  public getRouter(): Router {
    return this.router;
  }
}
