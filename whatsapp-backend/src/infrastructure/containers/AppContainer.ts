import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';
import { Queue } from 'bullmq';
import logger from '../../infrastructure/logging/Logger';

import { UnifiedChatbotOrchestrator } from '../../core/services/UnifiedChatbotOrchestrator';
import { SecurityService } from '../../core/services/SecurityService';
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
import { TokenService } from '../../core/services/TokenService';
import { HumanDelayService } from '../../core/services/HumanDelayService';
import { AuditLogService } from '../../core/services/AuditLogService';
import { PromptInjectionGuard } from '../../core/services/PromptInjectionGuard';
import { TransportLiquidationService } from '../../core/services/TransportLiquidationService';
import { WelcomeOrchestrator } from '../../core/services/WelcomeOrchestrator';
import { ModuleSettingsService } from '../../core/services/ModuleSettingsService';
import { EnqueueMessageUseCase } from '../../core/usecases/EnqueueMessageUseCase';

import { dbPool } from '../database/MySQLConnection';
import { setupUnifiedDatabase } from '../database/setup-db';
import { HybridSessionRepository } from '../../providers/database/HybridSessionRepository';
import { MySQLClientRepository } from '../../providers/database/MySQLClientRepository';
import { MySQLBrandRepository } from '../../providers/database/MySQLBrandRepository';
import { MySQLGreetingRepository } from '../../providers/database/MySQLGreetingRepository';
import { MySQLMessageRepository } from '../../providers/database/MySQLMessageRepository';
import { MySQLInvoiceRepository } from '../../providers/database/MySQLInvoiceRepository';
import { MySQLSicetacRepository } from '../../providers/database/MySQLSicetacRepository';
// import { MySQLCorporateSettingsRepository } from '../../providers/database/MySQLCorporateSettingsRepository';
import { ColombiaHolidayProvider } from '../providers/ColombiaHolidayProvider';
import { MetaWhatsAppGateway } from '../../infrastructure/gateways/MetaWhatsAppGateway';
import { MockWhatsAppGateway } from '../../infrastructure/gateways/MockWhatsAppGateway';
import { HolidaySyncScheduler } from '../schedulers/HolidaySyncScheduler';
import { OutboundRetryScheduler } from '../schedulers/OutboundRetryScheduler';

// import { CalendarController } from '../../interfaces/http/CalendarController';
import { BrandController } from '../../interfaces/http/controllers/BrandController';
import { GreetingController } from '../../interfaces/http/GreetingController';
import { WhatsAppWebhookController } from '../../interfaces/http/controllers/WhatsAppWebhookController';
import { CRMController } from '../../interfaces/http/controllers/CRMController';
import { HealthController } from '../../interfaces/http/controllers/HealthController';
import { AnalyticsController } from '../../interfaces/http/controllers/AnalyticsController';
// import { AuthController } from '../../interfaces/http/controllers/AuthController';
// import { SimulationController } from '../../interfaces/http/controllers/SimulationController';
// import { ChatController } from '../../interfaces/http/ChatController';
// import { QueueMonitorController } from '../../interfaces/http/controllers/QueueMonitorController';
import { AuthMiddleware } from '../../interfaces/http/middlewares/AuthMiddleware';
import { MainRouter } from '../../interfaces/http/routes/MainRouter';

export class AppContainer {
  private static instance: AppContainer | null = null;
  private isInitialized = false;

  public mariadbPool!: Pool;
  public redisClient!: Redis;
  public messageQueue!: Queue | null;
  public securityService!: SecurityService;
  public chatbotOrchestrator!: UnifiedChatbotOrchestrator;
  public messageWorker!: MessageWorker;
  public mainRouter!: MainRouter;
  public authGuard!: AuthMiddleware;

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
  public tokenService!: TokenService;
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

  private constructor() {}

  public static getInstance(): AppContainer {
    if (!AppContainer.instance) {
      AppContainer.instance = new AppContainer();
    }
    return AppContainer.instance;
  }

  public async init(_dbConnected: boolean, _redisConnected: boolean): Promise<void> {
    await this.initialize();
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      logger.info('Initializing IoC container wiring...');

      this.mariadbPool = dbPool;
      this.redisClient = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true
      });

      const isRedisActive = process.env.USE_REDIS !== 'false';
      this.messageQueue = isRedisActive ? new Queue('process-whatsapp-message', { connection: this.redisClient }) : null;

      await setupUnifiedDatabase(this.mariadbPool);

      const migrationRunner = new MigrationRunner(this.mariadbPool, [V1__Initial_Logistics_Schema]);
      await migrationRunner.runAll();

      const circuitBreaker = new AdvancedCircuitBreaker(3, 10000);

      this.securityService = new SecurityService();
      this.authGuard = new AuthMiddleware(this.securityService);

      process.env.NODE_ENV === 'test' || process.env.USE_MOCK_GATEWAY === 'true'
        ? new MockWhatsAppGateway()
        : new MetaWhatsAppGateway(
            process.env.WA_PHONE_NUMBER_ID || '',
            process.env.WA_ACCESS_TOKEN || ''
          );

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
      await this.holidayManager.loadHolidays();

      this.dateTimeManager = new DateTimeManager(this.holidayManager, this.mariadbPool);
      await this.dateTimeManager.loadTimePeriodsConfig();

      this.delayService = new HumanDelayService();
      this.tokenService = new TokenService();
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

      this.holidaySyncScheduler = new HolidaySyncScheduler(this.mariadbPool);
      this.holidaySyncScheduler.startCronWorker();

      this.auditLogService = new AuditLogService(this.mariadbPool);
      this.outboundRetryScheduler = new OutboundRetryScheduler(this.mariadbPool, this.whatsAppOutboundService, circuitBreaker);
      this.outboundRetryScheduler.startRetryPipeline();
      this.promptInjectionGuard = new PromptInjectionGuard();

      const cacheWarmUpService = new CacheWarmUpService(this.mariadbPool, this.redisClient);
      cacheWarmUpService.executeWarmUpPipeline();

      const { DatabaseBackupDaemon } = require('../schedulers/DatabaseBackupDaemon');
      const backupDaemon = DatabaseBackupDaemon.getInstance();
      backupDaemon.startAutomatedBackupScheduler();

      this.isInitialized = true;
      logger.info('IoC container fully wired.');
    } catch (err: any) {
      logger.error('IoC initialization failed:', err.message);
      throw err;
    }
  }

  public startWorker(_ioInstance: any): void {
    this.messageWorker = new MessageWorker(this.redisClient, this.chatbotOrchestrator);
    this.messageWorker.startWorkerPipeline();

    this.continuityService.registerFallbackProcessor(async (userId, minutes) => {
      logger.info('Continuity fallback triggered (legacy)', { userId, minutes });
    });

    this.enqueueMessageUseCase.registerFallbackProcessor(async (messageId, userId, _messageBody, _customResponse) => {
      logger.info('Direct message fallback triggered (legacy)', { messageId, userId });
    });

    logger.info('Async worker pipeline and fallbacks started.');
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
