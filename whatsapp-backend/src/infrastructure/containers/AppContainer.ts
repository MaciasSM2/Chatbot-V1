import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import logger from '../../infrastructure/logging/Logger';

import { UnifiedChatbotOrchestrator } from '../../core/services/UnifiedChatbotOrchestrator';
import { DateTimeManager } from '../../core/services/DateTimeManager';
import { SiceTacLiquidationEngine } from '../../core/services/SiceTacLiquidationEngine';
import { MessageWorker } from '../../core/MessageWorker';
import { HolidayManager } from '../../core/services/HolidayManager';
import { ContinuityService } from '../../core/services/ContinuityService';
import { BrandPromptService } from '../../core/services/BrandPromptService';
import { WhatsAppOutboundService } from '../services/WhatsAppOutboundService';
import { CorporateFallbackService } from '../../core/services/CorporateFallbackService';
import { CacheWarmUpService } from '../schedulers/CacheWarmUpService';
import { MigrationRunner } from '../database/migrations/MigrationRunner';
import { V1__Initial_Logistics_Schema } from '../database/migrations/V1__Initial_Logistics_Schema';
import { AdvancedCircuitBreaker } from '../resilience/AdvancedCircuitBreaker';
import { StatsService } from '../../core/services/StatsService';
import { HumanDelayService } from '../../core/services/HumanDelayService';
import { AuditLogService } from '../../core/services/AuditLogService';
import { PromptInjectionGuard } from '../../core/services/PromptInjectionGuard';
import { TransportLiquidationService } from '../../core/services/TransportLiquidationService';
import { WelcomeOrchestrator } from '../../core/services/WelcomeOrchestrator';
import { ModuleSettingsService } from '../../core/services/ModuleSettingsService';
import { EnqueueMessageUseCase } from '../../core/usecases/EnqueueMessageUseCase';
import { ConfigurationBroadcaster } from '../../core/events/ConfigurationBroadcaster';

import { dbPool } from '../database/MySQLConnection';
import { setupUnifiedDatabase } from '../database/setup-db';
import { HybridSessionRepository } from '../../providers/database/HybridSessionRepository';
import { MySQLClientRepository } from '../../providers/database/MySQLClientRepository';
import { MySQLBrandRepository } from '../../providers/database/MySQLBrandRepository';
import { MySQLGreetingRepository } from '../../providers/database/MySQLGreetingRepository';
import { MySQLMessageRepository } from '../../providers/database/MySQLMessageRepository';
import { MySQLInvoiceRepository } from '../../providers/database/MySQLInvoiceRepository';
import { MySQLSicetacRepository } from '../../providers/database/MySQLSicetacRepository';
import { ColombiaHolidayProvider } from '../providers/ColombiaHolidayProvider';

import { HolidaySyncScheduler } from '../schedulers/HolidaySyncScheduler';
import { OutboundRetryScheduler } from '../schedulers/OutboundRetryScheduler';

import { BrandController } from '../../interfaces/http/controllers/BrandController';
import { GreetingController } from '../../interfaces/http/GreetingController';
import { WhatsAppWebhookController } from '../../interfaces/http/controllers/WhatsAppWebhookController';
import { CRMController } from '../../interfaces/http/controllers/CRMController';
import { HealthController } from '../../interfaces/http/controllers/HealthController';
import { AnalyticsController } from '../../interfaces/http/controllers/AnalyticsController';
import { ModuleSettingsController } from '../../interfaces/http/controllers/ModuleSettingsController';
import { TimePeriodsController } from '../../interfaces/http/controllers/TimePeriodsController';
import { BillingController } from '../../interfaces/http/controllers/BillingController';
import { CalendarController } from '../../interfaces/http/controllers/CalendarController';
import { MainRouter } from '../../interfaces/http/routes/MainRouter';
import { MySQLTenantRepository } from '../database/repositories/MySQLTenantRepository';
import { JsRuleBotStrategy } from '../../core/domain/strategies/JsRuleBotStrategy';
import { HybridBotStrategy } from '../../core/domain/strategies/HybridBotStrategy';
import { FullAiBotStrategy } from '../../core/domain/strategies/FullAiBotStrategy';
import { CavemanTokenOptimizer } from '../../core/services/CavemanTokenOptimizer';
import { MultiChatOrchestrator } from '../../core/services/MultiChatOrchestrator';
import { MultiChatController } from '../../interfaces/http/controllers/MultiChatController';
import { TenantSettingsController } from '../../interfaces/http/controllers/TenantSettingsController';
import { TenantSecurityService } from '../../core/services/TenantSecurityService';
import { AuthTenantController } from '../../interfaces/http/controllers/AuthTenantController';
import { TenantDocumentController } from '../../interfaces/http/controllers/TenantDocumentController';
import { HybridSettingsController } from '../../interfaces/http/controllers/HybridSettingsController';
import { WidgetController } from '../../interfaces/http/controllers/WidgetController';
import { QuotaSettingsController } from '../../interfaces/http/controllers/QuotaSettingsController';
import { DatabaseBackupDaemon } from '../schedulers/DatabaseBackupDaemon';

class MockQueue {
  public readonly isMock = true;
  async getActiveCount() { return 0; }
  async getWaitingCount() { return 0; }
  async getDelayedCount() { return 0; }
  async getFailedCount() { return 0; }
  async getCompletedCount() { return 0; }
  async clean() { return []; }
  async add(_name: string, data: any, _opts?: any) {
    const container = AppContainer.getInstance();
    const chatbotOrchestrator = container.chatbotOrchestrator;
    const correlationId = data?.metadata?.correlationId || `MOCK-${Date.now()}`;
    
    setImmediate(async () => {
      try {
        if (chatbotOrchestrator) {
          await chatbotOrchestrator.handleMessage({
            clientPhone: data?.from || data?.userId || 'unknown',
            messageText: data?.text?.body || data?.messageBody || '',
            isSimulation: false,
            correlationId
          });
        }
      } catch (err: any) {
        logger.error(`[MockQueue Error] Failed to process message: ${err.message}`, { correlationId });
      }
    });

    return { id: `mock-job-${Date.now()}` };
  }
}

export class AppContainer {
  private static instance: AppContainer | null = null;
  private isInitialized = false;

  public mariadbPool!: Pool;
  public redisClient!: Redis;
  public messageQueue!: Queue | null;
  public chatbotOrchestrator!: UnifiedChatbotOrchestrator;
  public messageWorker!: MessageWorker;
  public mainRouter!: MainRouter;

  public clientRepository!: MySQLClientRepository;
  public brandRepo!: MySQLBrandRepository;
  public greetingRepository!: MySQLGreetingRepository;
  public messageRepository!: MySQLMessageRepository;
  public invoiceRepo!: MySQLInvoiceRepository;
  public sicetacRepo!: MySQLSicetacRepository;
  public sessionRepository!: HybridSessionRepository;

  public moduleService!: ModuleSettingsService;
  public holidayManager!: HolidayManager;
  public dateTimeManager!: DateTimeManager;
  public delayService!: HumanDelayService;
  public statsService!: StatsService;
  public brandPromptService!: BrandPromptService;
  public liquidationService!: TransportLiquidationService;
  public continuityService!: ContinuityService;
  public enqueueMessageUseCase!: EnqueueMessageUseCase;
  public welcomeOrchestrator!: WelcomeOrchestrator;
  public whatsAppOutboundService!: WhatsAppOutboundService;
  public auditLogService!: AuditLogService;
  public promptInjectionGuard!: PromptInjectionGuard;
  public holidaySyncScheduler!: HolidaySyncScheduler;
  public outboundRetryScheduler!: OutboundRetryScheduler;

  public whatsAppWebhookController!: WhatsAppWebhookController;
  public brandController!: BrandController;
  public greetingController!: GreetingController;
  public crmController!: CRMController;
  public healthController!: HealthController;
  public analyticsController!: AnalyticsController;
  public moduleController!: ModuleSettingsController;
  public timePeriodsController!: TimePeriodsController;
  public billingController!: BillingController;
  public calendarController!: CalendarController;
  public tenantRepository!: MySQLTenantRepository;
  public multiChatOrchestrator!: MultiChatOrchestrator;
  public multiChatController!: MultiChatController;
  public tenantSettingsController!: TenantSettingsController;
  public authTenantController!: any;
  public tenantDocumentController!: any;
  public hybridSettingsController!: any;
  public widgetController!: any;
  public quotaSettingsController!: any;

  private constructor() {}

  public static getInstance(): AppContainer {
    if (!AppContainer.instance) {
      AppContainer.instance = new AppContainer();
    }
    return AppContainer.instance;
  }

  public async init(dbConnected: boolean, redisConnected: boolean): Promise<void> {
    await this.initialize(dbConnected, redisConnected);
  }

  public async initialize(dbConnected: boolean = true, redisConnected: boolean = true): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing IoC container wiring...');

      this.mariadbPool = dbPool;

      // Verificar conectividad MariaDB antes de continuar (Fail-Fast)
      if (dbConnected) {
        await this.mariadbPool.query('SELECT 1');
        logger.info('MariaDB pool verified.');
      }

      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        maxRetriesPerRequest: process.env.NODE_ENV === 'test' ? 0 : 20
      });

      // Registrar listener de errores para evitar que se caiga la app si no hay Redis local
      this.redisClient.on('error', (err) => {
        // Silencioso o warning si se espera que no haya Redis
        logger.debug(`[Redis] Error en cliente: ${err.message}`);
      });

      // Verificar conectividad Redis (Fail-Fast)
      if (redisConnected) {
        try {
          await this.redisClient.ping();
          logger.info('Redis cluster verified.');
        } catch (pingErr: any) {
          logger.warn(`Redis connection ping failed: ${pingErr.message}`);
          redisConnected = false;
        }
      }

      const isRedisActive = process.env.USE_REDIS !== 'false' && redisConnected;
      this.messageQueue = isRedisActive ? new Queue('process-whatsapp-message', { connection: this.redisClient }) : new MockQueue() as any;

      // B. Ejecutar auto-migración DDL — modo graceful: si MariaDB no disponible, continuar en modo demo
      try {
        await setupUnifiedDatabase(this.mariadbPool);

        const migrationRunner = new MigrationRunner(this.mariadbPool, [V1__Initial_Logistics_Schema]);
        await migrationRunner.runAll();
        logger.info('Database schema and migrations applied.');
      } catch (dbSetupErr: any) {
        logger.warn(`⚠️ [Demo Mode] DB setup skipped (no MariaDB): ${dbSetupErr.message}`);
      }

      const circuitBreaker = new AdvancedCircuitBreaker(3, 10000);

      this.clientRepository = new MySQLClientRepository(this.mariadbPool);
      this.brandRepo = new MySQLBrandRepository(this.mariadbPool);
      this.greetingRepository = new MySQLGreetingRepository(this.mariadbPool);
      this.messageRepository = new MySQLMessageRepository(this.mariadbPool);
      this.sessionRepository = new HybridSessionRepository(this.redisClient, this.mariadbPool);
      this.invoiceRepo = new MySQLInvoiceRepository(this.mariadbPool);
      this.sicetacRepo = new MySQLSicetacRepository(this.mariadbPool);

      const fallbackService = new CorporateFallbackService(this.mariadbPool);
      this.whatsAppOutboundService = new WhatsAppOutboundService(
        circuitBreaker,
        fallbackService,
        process.env.WA_PHONE_NUMBER_ID || '573000000000'
      );

      this.holidayManager = new HolidayManager(new ColombiaHolidayProvider(), this.mariadbPool);
      try { await this.holidayManager.loadHolidays(); } catch { logger.warn('⚠️ [Demo Mode] Holidays not loaded (no DB).'); }

      this.dateTimeManager = new DateTimeManager(this.holidayManager, this.mariadbPool);
      try { await this.dateTimeManager.loadTimePeriodsConfig(); } catch { logger.warn('⚠️ [Demo Mode] Time periods not loaded (no DB).'); }

      this.delayService = new HumanDelayService();
      this.statsService = new StatsService(this.mariadbPool);
      this.brandPromptService = new BrandPromptService(this.brandRepo, circuitBreaker);

      const siceTacEngine = new SiceTacLiquidationEngine(this.mariadbPool, this.redisClient);
      this.liquidationService = new TransportLiquidationService(this.invoiceRepo, siceTacEngine);
      this.continuityService = new ContinuityService(isRedisActive ? this.redisClient : null);

      this.welcomeOrchestrator = new WelcomeOrchestrator(
        this.clientRepository,
        this.greetingRepository,
        this.dateTimeManager,
        this.delayService,
        undefined,
        new ModuleSettingsService(this.mariadbPool),
        this.brandRepo
      );

      this.enqueueMessageUseCase = new EnqueueMessageUseCase(
        this.messageQueue,
        this.redisClient,
        this.continuityService
      );

      this.chatbotOrchestrator = new UnifiedChatbotOrchestrator(
        this.sessionRepository as any,
        siceTacEngine,
        this.whatsAppOutboundService as any
      );

      this.messageWorker = new MessageWorker(this.redisClient, this.chatbotOrchestrator);

      this.whatsAppWebhookController = new WhatsAppWebhookController(
        this.messageQueue!
      );

      this.moduleService = new ModuleSettingsService(this.mariadbPool);
      this.brandController = new BrandController(this.brandPromptService);
      this.greetingController = new GreetingController(this.greetingRepository);
      this.crmController = new CRMController(this.clientRepository as any);
      this.healthController = new HealthController(this.mariadbPool, this.redisClient);
      this.analyticsController = new AnalyticsController(this.statsService);
      this.moduleController = new ModuleSettingsController(this.moduleService);
      this.timePeriodsController = new TimePeriodsController(this.dateTimeManager);
      this.billingController = new BillingController(this.invoiceRepo);
      this.calendarController = new CalendarController(this.mariadbPool);

      const securityService = new TenantSecurityService();
      this.tenantRepository = new MySQLTenantRepository(this.mariadbPool, securityService);
      const cavemanOptimizer = new CavemanTokenOptimizer();
      const fullJsStrat = new JsRuleBotStrategy(this.welcomeOrchestrator, siceTacEngine, this.tenantRepository);
      const hybridStrat = new HybridBotStrategy(this.tenantRepository);
      const fullAiStrat = new FullAiBotStrategy(this.tenantRepository, cavemanOptimizer);
      this.multiChatOrchestrator = new MultiChatOrchestrator(fullJsStrat, hybridStrat, fullAiStrat);
      this.multiChatController = new MultiChatController(this.multiChatOrchestrator);
      this.tenantSettingsController = new TenantSettingsController(this.tenantRepository, ConfigurationBroadcaster.getInstance());
      this.authTenantController = new AuthTenantController(this.tenantRepository);
      this.tenantDocumentController = new TenantDocumentController(this.tenantRepository);
      this.hybridSettingsController = new HybridSettingsController();
      this.widgetController = new WidgetController(
        this.tenantRepository,
        fullJsStrat,
        hybridStrat,
        fullAiStrat
      );
      this.quotaSettingsController = new QuotaSettingsController();

      this.holidaySyncScheduler = new HolidaySyncScheduler(this.mariadbPool);
      this.holidaySyncScheduler.startCronWorker();

      this.auditLogService = new AuditLogService(this.mariadbPool);
      this.outboundRetryScheduler = new OutboundRetryScheduler(this.mariadbPool, this.whatsAppOutboundService, circuitBreaker);
      this.outboundRetryScheduler.startRetryPipeline();
      this.promptInjectionGuard = new PromptInjectionGuard();

      const cacheWarmUpService = new CacheWarmUpService(this.mariadbPool, this.redisClient);
      cacheWarmUpService.executeWarmUpPipeline();

      const backupDaemon = DatabaseBackupDaemon.getInstance();
      backupDaemon.startAutomatedBackupScheduler();

      this.isInitialized = true;
      logger.info('IoC container fully wired.');
    } catch (err: any) {
      logger.error('IoC initialization failed:', err.message);
      throw err;
    }
  }

  public startWorker(ioInstance: any): void {
    if (ioInstance) {
      ConfigurationBroadcaster.getInstance().initialize(ioInstance);
    }
    if (this.messageQueue && (this.messageQueue as any).isMock) {
      logger.info('Skipping MessageWorker BullMQ consumer daemon (running in standalone/memory mode).');
      return;
    }
    try {
      this.messageWorker.startWorkerPipeline();
      logger.info('Async worker pipeline and fallbacks started.');
    } catch (workerErr: any) {
      logger.warn(`⚠️ [Demo Mode] BullMQ worker not started (no Redis): ${workerErr.message}`);
    }

    this.continuityService.registerFallbackProcessor(async (userId, minutes) => {
      logger.info('Continuity fallback triggered (legacy)', { userId, minutes });
    });

    this.enqueueMessageUseCase.registerFallbackProcessor(async (messageId, userId, _messageBody, _customResponse) => {
      logger.info('Direct message fallback triggered (legacy)', { messageId, userId });
    });
  }

  public getStatsService(): StatsService {
    if (!this.isInitialized) throw new Error('Container not initialized.');
    return this.statsService;
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down IoC container...');
    if (this.messageWorker) {
      await this.messageWorker.gracefulShutdown();
    }
    if (this.outboundRetryScheduler) {
      this.outboundRetryScheduler.stopRetryPipeline();
    }
    if (this.redisClient) {
      await this.redisClient.quit();
    }
    if (this.mariadbPool) {
      await this.mariadbPool.end();
    }
    logger.info('IoC infrastructure shut down cleanly.');
  }
}
