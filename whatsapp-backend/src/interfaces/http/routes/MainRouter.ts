/**
 * @file MainRouter.ts
 * @description Orquestador maestro de la frontera de red Express 5.
 * Ensambla de forma determinista la totalidad de los nuevos controladores y middlewares del IoC.
 */
import { Router } from 'express';
import Redis from 'ioredis';

// Importación de Controladores Homologados
import { WhatsAppWebhookController } from '../controllers/WhatsAppWebhookController';
import { CRMController } from '../controllers/CRMController';
import { BrandController } from '../controllers/BrandController';
import { AuthController } from '../controllers/AuthController';
import { QueueMonitorController } from '../controllers/QueueMonitorController';
import { SimulationController } from '../controllers/SimulationController';
import { ChatController } from '../ChatController';
import { GreetingController } from '../GreetingController';
import { ModuleSettingsController } from '../controllers/ModuleSettingsController';
import { AnalyticsController } from '../controllers/AnalyticsController';

// Importación de Middlewares de Blindaje Perimetral
import { AuthMiddleware } from '../middlewares/AuthMiddleware';
import { CorrelationIdMiddleware } from '../middlewares/CorrelationIdMiddleware';
import { RedisRateLimiterMiddleware } from '../middlewares/RedisRateLimiterMiddleware';
import { RutUploadMiddleware } from '../middlewares/RutUploadMiddleware';

export class MainRouter {
  private readonly router: Router;
  private readonly authGuard: AuthMiddleware;
  private readonly correlationGuard: CorrelationIdMiddleware;
  private readonly rateLimiterGuard: RedisRateLimiterMiddleware;
  private readonly uploadGuard: RutUploadMiddleware;

  constructor(
    // Inyección de dependencias abstractas desde el AppContainer Singleton (SOLID - D)
    private readonly webhookController: WhatsAppWebhookController,
    private readonly crmController: CRMController,
    private readonly brandController: BrandController,
    private readonly authController: AuthController,
    private readonly queueController: QueueMonitorController,
    private readonly simulationController: SimulationController,
    private readonly chatController: ChatController,
    private readonly greetingController: GreetingController,
    private readonly moduleController: ModuleSettingsController,
    private readonly analyticsController: AnalyticsController,
    private readonly redisClient: Redis
  ) {
    this.router = Router();

    // Instanciación de los componentes de seguridad perimetral
    this.authGuard = new AuthMiddleware(null as any); // Consume internamente el SecurityService del Core
    this.correlationGuard = new CorrelationIdMiddleware();
    this.rateLimiterGuard = new RedisRateLimiterMiddleware(this.redisClient);
    this.uploadGuard = new RutUploadMiddleware();

    this.compileMasterPipeline();
  }

  /**
   * Compila la tubería inmutable de red inyectando las salvaguardas contra fallos y ataques.
   */
  private compileMasterPipeline(): void {
    // MIDDLEWARE GLOBAL OBLIGATORIO: Estampar ID forense UUID a cada byte entrante
    this.router.use(this.correlationGuard.injectCorrelationId);

    /* ──────────────────────────────────────────────────────────────
       1. CANALES PERIMETRALES PÚBLICOS (WEBHOOK OFICIAL DE META v21.0)
       ────────────────────────────────────────────────────────────── */
    // Límite estricto: Máximo 60 peticiones por minuto para digerir ráfagas de Facebook
    const webhookLimiter = this.rateLimiterGuard.limitByContext(60, 60);
    this.router.get('/webhook', webhookLimiter, this.webhookController.verifyWebhook);
    this.router.post('/webhook', webhookLimiter, this.webhookController.handleIncomingPayload);

    /* ──────────────────────────────────────────────────────────────
       2. PASARELA DE AUTENTICACIÓN OPERADORES (HTTP-ONLY SECURE COOKIES)
       ────────────────────────────────────────────────────────────── */
    // Límite: Máximo 5 intentos de Login por minuto para mitigar ataques de fuerza bruta
    const authLimiter = this.rateLimiterGuard.limitByContext(5, 60);
    this.router.post('/auth/login', authLimiter, this.authController.executeLogin);
    this.router.post('/auth/logout', this.authController.executeLogout);

    /* ──────────────────────────────────────────────────────────────
       3. CANALES PRIVADOS ADMINISTRATIVOS COMPROMETIDOS (CRM & GOBERNANZA)
       ────────────────────────────────────────────────────────────── */
    const adminSubRouter = Router();
    adminSubRouter.use(this.authGuard.intercept); // Cortafuegos JWT obligatorio para toda esta sección

    // Endpoints del CRM de Clientes e Inyección de esquemas dinámicos JSON
    adminSubRouter.get('/crm/clients', this.crmController.getClients);

    // Carga segura de flujos binarios del RUT PDF (Fase 60) con validación técnica de Magic Numbers
    adminSubRouter.post('/crm/clients/upload-rut', this.uploadGuard.interceptBinaryStream, (req, res) => {
      res.status(200).json({ success: true, path: (req as any).sanitizedUploadedFilePath });
    });

    // Control de pausas conversacionales y traspaso manual a asesores humanos (Fase 69)
    adminSubRouter.post('/chat/toggle-pause', this.chatController.toggleBotAutomation);

    // Monitoreo cuantitativo de colas y purga de Dead-Letter en Redis/BullMQ (Fase 75)
    adminSubRouter.get('/queues/stats', this.queueController.fetchQueueTelemetry);
    adminSubRouter.post('/queues/purge-failed', this.queueController.cleanFailedJobsRegistry);

    // Configuración de marca blanca y paletas inyectadas por hardware
    adminSubRouter.get('/settings/brand', this.brandController.getBrandSettings);

    // Configuración de módulos funcionales
    adminSubRouter.get('/settings/modules', this.moduleController.getModules);
    adminSubRouter.patch('/settings/modules/:id', this.moduleController.updateModuleStatus);
    adminSubRouter.get('/settings/modules/audit', this.moduleController.getAuditLogs);

    // Esquemas dinámicos de campos CRM
    adminSubRouter.get('/crm/clients/schema', (_req, res) => {
      res.json({ success: true, schema: [] });
    });
    adminSubRouter.post('/crm/clients/schema', (req, res) => {
      res.json({ success: true, schema: req.body.schema || [] });
    });

    // Sincronización offline de prospectos CRM
    adminSubRouter.post('/crm/clients/sync', this.crmController.syncClient);

    // Acoplar las rutas administrativas protegidas
    this.router.use('/admin', adminSubRouter);

    /* ──────────────────────────────────────────────────────────────
       4. CONSOLA DE SIMULACIÓN AVANZADA Y PRUEBAS DE ESCENARIOS
       ────────────────────────────────────────────────────────────── */
    const simulationSubRouter = Router();
    // Limitar el panel de pruebas ante inundaciones DoS locales: Máximo 20 ejecuciones por minuto
    simulationSubRouter.use(this.rateLimiterGuard.limitByContext(20, 60));

    // Ruta unificada para mensajes del simulador frontend (usa BillingFsm — misma FSM que Meta webhook)
    simulationSubRouter.post('/message', this.simulationController.handleSimulatorMessage);

    // Inyección de escenarios avanzados anulando las variables de fecha/hora físicas (Fase 68)
    simulationSubRouter.post('/scenario', this.simulationController.executeMockScenario);

    this.router.use('/simulator', simulationSubRouter);

    /* ──────────────────────────────────────────────────────────────
       5. DATOS DEL DASHBOARD (CHATS & GREETINGS BAJO AUTENTICACIÓN)
       ────────────────────────────────────────────────────────────── */
    const dataSubRouter = Router();
    dataSubRouter.use(this.authGuard.intercept);
    dataSubRouter.use(this.rateLimiterGuard.limitByContext(120, 60));

    // Chats activos y mensajería
    dataSubRouter.get('/chats', this.chatController.getActiveChats);
    dataSubRouter.get('/messages/search', this.chatController.searchMessages);
    dataSubRouter.get('/messages/:chatId', this.chatController.getChatHistory);
    dataSubRouter.delete('/messages/:chatId', this.chatController.resetTestChat);
    dataSubRouter.post('/chats/:chatId/pause', this.chatController.pauseBot);
    dataSubRouter.post('/chats/:chatId/resume', this.chatController.resumeBot);

    // Plantillas de saludo (Greeting Templates)
    dataSubRouter.get('/greetings', this.greetingController.listTemplates);
    dataSubRouter.post('/greetings', this.greetingController.createTemplate);
    dataSubRouter.put('/greetings/:id', this.greetingController.updateTemplate);
    dataSubRouter.delete('/greetings/:id', this.greetingController.deleteTemplate);

    // Analíticas del cuadro de mando
    dataSubRouter.get('/analytics/summary', this.analyticsController.getSummaryStats);
    dataSubRouter.get('/analytics/traffic', this.analyticsController.getDashboardMetrics);

    this.router.use(dataSubRouter);
  }

  /**
   * Retorna el enrutador maestro configurado listo para el consumo de Express 5.
   */
  public getRouter(): Router {
    return this.router;
  }
}
