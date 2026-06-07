/**
 * @file ExpressServer.ts
 * @description Encapsulación de Express, Socket.io, enrutadores, middlewares y ciclo de vida de red.
 */
import express, { Express } from "express";
import { createServer, Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { AppContainer } from "../containers/AppContainer";
import { registerGlobalMiddlewares, isOriginAllowed } from "../../interfaces/http/middlewares/GlobalMiddlewareRegistry";
import { MainRouter } from "../../interfaces/http/routes/MainRouter";
import { AuthController } from "../../interfaces/http/controllers/AuthController";
import { QueueMonitorController } from "../../interfaces/http/controllers/QueueMonitorController";
import { SimulationController } from "../../interfaces/http/controllers/SimulationController";
import { ChatController } from "../../interfaces/http/ChatController";
import { ModuleSettingsController } from "../../interfaces/http/controllers/ModuleSettingsController";
import { AnalyticsController } from "../../interfaces/http/controllers/AnalyticsController";
import { SocketServer } from "./SocketServer";
import logger from "../logging/Logger";
import { env } from "../../config/env";
import { globalErrorHandler, notFoundHandler } from "../../interfaces/http/middlewares/GlobalErrorHandler";
import { SystemMetricsManager } from "../metrics/Metrics";

export class ExpressServer {
  private readonly app: Express;
  private readonly server: HttpServer;
  private readonly io: SocketIOServer;

  constructor(private readonly container: AppContainer) {
    this.app = express();
    this.server = createServer(this.app);

    // Inicializar Socket.io con las mismas reglas de CORS
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: (origin, callback) => {
          if (isOriginAllowed(origin)) {
            callback(null, true);
          } else {
            callback(new Error("Not allowed by CORS"));
          }
        },
        methods: ["GET", "POST"]
      }
    });

    this.configure();
  }

  private configure(): void {
    // 1. Registrar middlewares globales (CORS, raw body-parser)
    registerGlobalMiddlewares(this.app);

    // 2. Montar metrics de Prometheus
    const metricsManager = SystemMetricsManager.getInstance();
    this.app.use(metricsManager.getMetricsRouter());

    // 3. Configurar eventos de Sockets (salas privadas)
    const socketServer = new SocketServer(this.io, this.container.securityService);
    socketServer.initEvents();

    // 4. Arrancar los workers asíncronos de BullMQ y fallbacks
    this.container.startWorker(this.io);

    // 5. Health check perimetral para pruebas de humo y orquestación
    const healthHandler = async (_req: any, res: any) => {
      try {
        const [rows] = await this.container.mariadbPool.query('SELECT 1 as health_token');
        const redisOk = await this.container.redisClient.ping();
        const mariaOk = rows && (rows as any)[0]?.health_token === 1;
        res.json({
          success: true,
          status: mariaOk && redisOk === 'PONG' ? 'HEALTHY' : 'DEGRADED',
          timestamp: new Date().toISOString(),
          infrastructure: {
            mariaDb: mariaOk ? 'OK' : 'DOWN',
            redis: redisOk === 'PONG' ? 'OK' : 'DOWN'
          }
        });
      } catch {
        res.json({ success: true, status: 'DEGRADED', timestamp: new Date().toISOString(), infrastructure: { mariaDb: 'DOWN', redis: 'DOWN' } });
      }
    };
    this.app.get('/api/health', healthHandler);
    this.app.get('/health', healthHandler);

    // 6. Montar rutas principales de la aplicación
    const mainRouter = new MainRouter(
      this.container.whatsAppWebhookController,
      this.container.crmController,
      this.container.brandController,
      new AuthController(this.container.mariadbPool, this.container.securityService),
      new QueueMonitorController(this.container.messageQueue!),
      new SimulationController(this.container.chatbotOrchestrator, this.container.clientRepository as any),
      new ChatController(this.container.messageRepository, this.container.sessionRepository, this.container.mariadbPool),
      this.container.greetingController,
      new ModuleSettingsController(this.container.moduleService),
      new AnalyticsController(this.container.statsService),
      this.container.redisClient
    );
    this.app.use('/api', mainRouter.getRouter());

    // 7. Catch-all 404 para rutas no registradas (retorna JSON)
    this.app.use(notFoundHandler);

    // 8. Manejador global de errores semánticos y logs
    this.app.use(globalErrorHandler);
  }

  /**
   * Arranca la escucha en el puerto de red configurado
   */
  public start(): void {
    const PORT = env.PORT || 3000;
    this.server.listen(Number(PORT), "0.0.0.0", () => {
      logger.info(`✨ Servidor Full-Stack corriendo en el puerto: ${PORT}`);
      logger.info(`📊 Métricas Prometheus listas en: http://localhost:${PORT}/metrics`);
    });
  }

  /**
   * Cierra las conexiones de red y libera recursos en apagado gracioso
   */
  public async shutdown(): Promise<void> {
    if (this.server.listening) {
      await new Promise<void>((resolve) => this.server.close(() => resolve()));
      logger.info("📡 Servidor HTTP cerrado (no más peticiones entrantes).");
    }

    // Cerrar Socket.io de forma ordenada
    this.io.close();
    logger.info("🔌 [Socket.io] Cerrado el canal de WebSockets.");

    // Cerrar colas y workers
    if (this.container.messageQueue) {
      await this.container.messageQueue.close();
      logger.info("📦 Cola de mensajes BullMQ cerrada.");
    }

    // Delegar el apagado del resto de la infraestructura al contenedor IoC
    await this.container.shutdown();
  }
}
