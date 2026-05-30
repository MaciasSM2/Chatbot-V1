import dotenv from "dotenv";
dotenv.config(); // Cargar variables de entorno inmediatamente antes de configurar CORS y Sockets

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import Redis from "ioredis";
import { Queue } from "bullmq";
import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { EnqueueMessageUseCase } from "./core/usecases/EnqueueMessageUseCase";
import { WhatsappWebhookController } from "./interfaces/http/WhatsappWebhookController";
import { GreetingController } from "./interfaces/http/GreetingController";
import { IGreetingRepository } from "./core/interfaces/repositories/IGreetingRepository";
import { ChatbotOrchestrator } from "./core/services/ChatbotOrchestrator";
import { ChatController } from "./interfaces/http/ChatController";
import { ClientController } from "./interfaces/http/ClientController";
import { RedisSessionRepository } from "./providers/database/RedisSessionRepository";
import { PostgresSessionRepository } from "./providers/database/PostgresSessionRepository";
import { MessageWorker } from "./core/MessageWorker";
import { AnalyticsController } from "./interfaces/http/AnalyticsController";
import { verifyWebhookSignature } from "./interfaces/http/middlewares/webhookSignature";


// Módulo 1: Dependencias
import { WelcomeOrchestrator } from "./core/services/WelcomeOrchestrator";
import { ContinuityService } from "./core/services/ContinuityService";
import { DateTimeManager } from "./core/services/DateTimeManager";
import { HolidayManager } from "./core/services/HolidayManager";
import { HumanDelayService } from "./core/services/HumanDelayService";
import { ModuleSettingsService } from "./core/services/ModuleSettingsService";
import { PostgresClientRepository } from "./providers/database/PostgresClientRepository";
import { PostgresGreetingRepository } from "./providers/database/PostgresGreetingRepository";
import { InMemoryGreetingRepository } from "./providers/database/InMemoryGreetingRepository";
import { PostgresMessageRepository } from "./providers/database/PostgresMessageRepository";
import { Message } from "./core/entities/Message";
import { ChatSession } from "./core/entities/ChatSession";
import register from "./infrastructure/metrics/Metrics";

import { MetaWhatsAppGateway } from "./infrastructure/gateways/MetaWhatsAppGateway";
import { MockWhatsAppGateway } from "./infrastructure/gateways/MockWhatsAppGateway";
import { MetaMockController } from "./interfaces/http/MetaMockController";
import { IWhatsAppGateway } from "./core/interfaces/IWhatsAppGateway";
import { TokenService } from "./core/services/TokenService";
import { AuthMiddleware } from "./interfaces/http/middlewares/AuthMiddleware";
import { ModuleSettingsController } from "./interfaces/http/controllers/ModuleSettingsController";
import { createAdminRoutes } from "./interfaces/http/routes/AdminRoutes";
import { StatsService } from "./core/services/StatsService";
import logger from "./infrastructure/logging/Logger";
import { ConcurrencyTester } from "./core/services/StressTester";


const app = express();
const server = createServer(app);

const allowedOrigins = [
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL || ""
].filter(Boolean);

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return true; // Permitir curl, postman, etc.
  if (allowedOrigins.indexOf(origin) !== -1) return true;
  // Permitir loopback, localhost, y IPs de red local privada (192.168.*, 10.*, 172.*)
  if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
    return true;
  }
  return false;
};

const io = new Server(server, {
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
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));


const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Verificación Crítica (Fail Fast)
if (!process.env.DATABASE_URL) {
  throw new Error("CRITICAL: DATABASE_URL is not defined in environment variables");
}

// Configuraciones de Infraestructura
const redisConnection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: () => null
});
redisConnection.connect().catch(() => {});
redisConnection.on("error", () => {});

const useRedisGlobal = process.env.USE_REDIS !== 'false';
const messageQueue = useRedisGlobal ? new Queue("process-whatsapp-message", { connection: redisConnection }) : null;
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  max: parseInt(process.env.DB_MAX_CONNECTIONS || "20"),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

let worker: MessageWorker | null = null;

// Inicialización y Migración Automática de Base de Datos
async function initializeDatabase() {
  try {
    const sqlPath = path.join(__dirname, "../init.sql");
    if (fs.existsSync(sqlPath)) {
      const sql = fs.readFileSync(sqlPath, "utf8");
      await dbPool.query(sql);
      logger.info("[Database] Tablas e índices inicializados/actualizados con éxito desde init.sql");
    } else {
      // Intentar buscar en el directorio actual (por si se compila a dist)
      const distSqlPath = path.join(__dirname, "init.sql");
      if (fs.existsSync(distSqlPath)) {
        const sql = fs.readFileSync(distSqlPath, "utf8");
        await dbPool.query(sql);
        logger.info("[Database] Tablas e índices inicializados/actualizados con éxito desde init.sql (dist)");
      } else {
        logger.warn("[Database] No se encontró el archivo init.sql en la ruta esperada.");
      }
    }
  } catch (err) {
    logger.error("[Database] Error crítico inicializando base de datos", { error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}

// Helper para la pausa (Delay)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const PORT = process.env.PORT || 3000;

const main = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = 5000;
  
  logger.info("🚀 Iniciando ecosistema ChatBot proactivo...");

  // --- BLOQUE 1: REINTENTO POSTGRES ---
  let pgConnected = false;
  let pgRetries = 0;
  while (!pgConnected && pgRetries < MAX_RETRIES) {
    try {
      logger.info(`📡 Intentando conectar a PostgreSQL (Intento ${pgRetries + 1})...`);
      await initializeDatabase();
      pgConnected = true;
      logger.info("✅ PostgreSQL: Conexión exitosa.");
    } catch (error) {
      pgRetries++;
      logger.warn(`⚠️ PostgreSQL no disponible (Intento ${pgRetries}/${MAX_RETRIES}). Reintento en 5s...`);
      await wait(RETRY_DELAY);
    }
  }
  if (!pgConnected) {
    logger.warn("⚠️ POSTGRESQL NO DETECTADO: El sistema iniciará en [MODO DEMO - MEMORIA LOCAL].");
  }

  // --- BLOQUE 2: REINTENTO REDIS CON DEBUG DE RED ---
  let redisConnected = false;
  let redisRetries = 0;

  const redisOptions = redisConnection.options;
  const redisEndpoint = `${redisOptions.host}:${redisOptions.port}`;

  if (useRedisGlobal) {
    while (!redisConnected && redisRetries < MAX_RETRIES) {
      try {
        logger.info(`🔍 Buscando Redis en: ${redisEndpoint} (Intento ${redisRetries + 1})...`);
        
        await redisConnection.ping(); 
        redisConnected = true;
        
        logger.info(`✅ Redis: ¡Conexión establecida exitosamente en ${redisEndpoint}!`);
      } catch (error) {
        redisRetries++;
        logger.warn(`⚠️ Redis no responde en ${redisEndpoint} (Intento ${redisRetries}/${MAX_RETRIES}).`);
        logger.info(`💡 Tip: Verifica que tu contenedor Docker de Redis esté mapeado al puerto ${redisOptions.port}.`);
        
        await wait(RETRY_DELAY);
      }
    }

    if (!redisConnected) {
      logger.warn("⚠️ REDIS NO DETECTADO: El sistema iniciará en [MODO DEMO - MEMORIA LOCAL].");
    }
  } else {
    logger.info("ℹ️ REDIS DESHABILITADO (USE_REDIS=false). Operando de forma autónoma con Postgres/Memoria.");
  }

  // --- ARRANQUE FINAL ---
  try {
    await startup();
    server.listen(PORT, () => {
      logger.info(`✨ Servidor Full-Stack corriendo en el puerto: ${PORT}`);
      logger.info(`📊 Métricas Prometheus listas en: http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    logger.error("❌ Error crítico en servicios:", error);
    process.exit(1);
  }
};

// Ejecución del entry point
main();

async function startup() {
  // Repositorios
  const sessionRepository = useRedisGlobal 
    ? new RedisSessionRepository(redisConnection) 
    : new PostgresSessionRepository(dbPool);
  const clientRepository = new PostgresClientRepository(dbPool);
  const messageRepository = new PostgresMessageRepository(dbPool);

  const greetingRepository = await createGreetingRepository();

  // Servicio de Configuración de Módulos (Feature Toggles)
  const moduleService = new ModuleSettingsService(dbPool);

  // Servicios Módulo 1
  const holidayManager = new HolidayManager(dbPool);
  const dateTimeManager = new DateTimeManager(holidayManager, dbPool);
  const delayService = new HumanDelayService();
  const welcomeOrchestrator = new WelcomeOrchestrator(
    clientRepository,
    greetingRepository,
    dateTimeManager,
    delayService,
    undefined,
    moduleService
  );

  const orchestrator = new ChatbotOrchestrator(welcomeOrchestrator, clientRepository);
  const continuityService = new ContinuityService(messageQueue);
  const enqueueUseCase = new EnqueueMessageUseCase(messageQueue, redisConnection, continuityService);

  // Proveedor de WhatsApp (Inyección de Dependencias + DIP)
  let whatsappClient: IWhatsAppGateway;
  let metaMockController: MetaMockController | null = null;

  if (process.env.NODE_ENV === 'test' || process.env.USE_MOCK_GATEWAY === 'true') {
    const mockGateway = new MockWhatsAppGateway();
    metaMockController = new MetaMockController(mockGateway);
    whatsappClient = mockGateway;
    logger.info("⚠️ Usando MockWhatsAppGateway para inyección de fallas.");
  } else {
    whatsappClient = new MetaWhatsAppGateway(
      process.env.WA_PHONE_NUMBER_ID || '',
      process.env.WA_ACCESS_TOKEN || ''
    );
    logger.info("✅ Usando MetaWhatsAppGateway (Producción).");
  }

  // Inicializar Worker (Procesamiento asíncrono)
  worker = new MessageWorker(redisConnection, orchestrator, sessionRepository, whatsappClient, io, messageRepository, welcomeOrchestrator);
  
  // Registrar fallback de memoria para ContinuityService (cuando Redis no esté)
  continuityService.registerFallbackProcessor(async (userId, minutes) => {
    if (worker) {
      await worker.processContinuityDirectly(userId, minutes);
    }
  });
  
  worker.start();

  // Registrar fallback de procesamiento directo si falla el encolamiento (Redis offline)
  enqueueUseCase.registerFallbackProcessor(async (messageId, userId, messageBody, customResponse) => {
    if (worker) {
      await worker.processMessageDirectly(messageId, userId, messageBody, customResponse);
    } else {
      logger.error("No se pudo procesar el mensaje directo: el worker no está inicializado.");
    }
  });

  // Configuración de Salas Privadas en Socket.io (Aislamiento de Mensajes)
  io.on("connection", (socket) => {
    logger.info(`[Socket.io] Nueva conexión establecida: ${socket.id}`);

    socket.on("join", (userId) => {
      socket.join(userId);
      logger.info(`[Socket.io] Cliente ${userId} se unió a su sala privada`, { socketId: socket.id });
    });

    socket.on("disconnect", () => {
      logger.info(`[Socket.io] Conexión cerrada: ${socket.id}`);
    });
  });

  // Controladores HTTP
  const webhookController = new WhatsappWebhookController(enqueueUseCase);
  const greetingController = new GreetingController(greetingRepository);
  const chatController = new ChatController(messageRepository, sessionRepository, dbPool);
  const clientController = new ClientController(clientRepository, sessionRepository);
  const analyticsController = new AnalyticsController(messageRepository, sessionRepository, dbPool);
  const statsService = new StatsService(dbPool);

  // Rutas de Webhook (Espejo para soportar /webhook y /api/webhook)
  app.post("/webhook", verifyWebhookSignature, (req, res) => webhookController.handleWebhook(req, res));
  app.get("/webhook", (req, res) => webhookController.verifyWebhook(req, res));
  app.post("/api/webhook", verifyWebhookSignature, (req, res) => webhookController.handleWebhook(req, res));
  app.get("/api/webhook", (req, res) => webhookController.verifyWebhook(req, res));

  if (metaMockController) {
    app.patch("/api/test/meta-scenario", (req, res) => metaMockController!.configureScenario(req, res));
  }

  app.post("/api/test/stress", async (req, res) => {
    try {
      const tester = new ConcurrencyTester(async (userId, text) => {
        if (worker) {
          const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          await worker.processMessageDirectly(messageId, userId, text);
        }
      });
      tester.runBatch().catch(err => {
        logger.error("Error en batch de stress test", { error: err instanceof Error ? err.message : String(err) });
      });
      res.status(200).json({ success: true, message: "Stress test iniciado exitosamente." });
    } catch (err) {
      logger.error("Error al iniciar stress test", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error" });
    }
  });



  // Rutas Administrativas
  app.get("/api/greetings", (req, res) => greetingController.listTemplates(req, res));
  app.post("/api/greetings", (req, res) => greetingController.createTemplate(req, res));
  app.put("/api/greetings/:id", (req, res) => greetingController.updateTemplate(req, res));
  app.delete("/api/greetings/:id", (req, res) => greetingController.deleteTemplate(req, res));
  app.get("/api/analytics", (req, res) => analyticsController.getAnalytics(req, res));
  
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await statsService.getSummary();
      res.status(200).json(stats);
    } catch (err) {
      logger.error("Error obteniendo Stats", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Middleware de Seguridad para Clientes
  const checkClientsModule = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const isClientsEnabled = await moduleService.isEnabled('module_clients');
      if (!isClientsEnabled) {
        return res.status(503).json({ 
          error: "Service Unavailable", 
          message: "El módulo de Gestión de Clientes está temporalmente inactivo." 
        });
      }
      next();
    } catch (err) {
      next();
    }
  };

  // Inicialización de la Capa de Seguridad y Rutas Administrativas
  const tokenService = new TokenService();
  const authMiddleware = new AuthMiddleware(tokenService);
  const moduleController = new ModuleSettingsController(moduleService);
  const adminRoutes = createAdminRoutes(moduleController, authMiddleware);

  app.use("/api/settings", adminRoutes);

  // Rutas de Chats y Clientes
  app.get("/api/chats", (req, res) => chatController.getActiveChats(req, res));
  app.get("/api/chats/:userId/history", (req, res) => chatController.getChatHistory(req, res));
  app.delete("/api/chats/:userId/reset", (req, res) => chatController.resetTestChat(req, res));
  app.post("/api/chats/:userId/pause", (req, res) => chatController.pauseBot(req, res));
  app.post("/api/chats/:userId/resume", (req, res) => chatController.resumeBot(req, res));
  app.post("/api/chats/:userId/continuity", async (req, res) => {
    try {
      const { userId } = req.params;
      const minutes = req.body?.minutes ? Number(req.body.minutes) : 5;
      if (worker) {
        await worker.processContinuityDirectly(userId, minutes);
        res.status(200).json({ success: true, message: `Continuidad de ${minutes} min inyectada.` });
      } else {
        res.status(500).json({ error: "Worker no inicializado." });
      }
    } catch (err) {
      logger.error("Error en inyección de continuidad", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  app.get("/api/messages/search", (req, res) => chatController.searchMessages(req, res));
  app.get("/api/messages/:userId", (req, res) => chatController.getChatHistory(req, res));
  app.delete("/api/messages/:userId", (req, res) => chatController.resetTestChat(req, res));
  app.get("/api/clients", checkClientsModule, (req, res) => clientController.getClients(req, res));
  app.put("/api/clients/:id", checkClientsModule, (req, res) => clientController.updateClient(req, res));
  app.post("/api/clients", checkClientsModule, (req, res) => clientController.createClient(req, res));

  // Rutas de Configuración Global
  app.get("/api/settings", async (req, res) => {
    try {
      const result = await dbPool.query("SELECT value FROM global_settings WHERE key = 'schedule'");
      if (result.rows.length > 0) {
        res.status(200).json(result.rows[0].value);
      } else {
        const defaultSchedule = {
          work_hours_start: "08:00",
          work_hours_end: "18:00",
          working_days: [1, 2, 3, 4, 5],
          timezone: "America/Bogota"
        };
        res.status(200).json(defaultSchedule);
      }
    } catch (err) {
      logger.error("Error obteniendo configuraciones globales", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudo obtener la configuración." });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const { work_hours_start, work_hours_end, working_days } = req.body;

      if (!work_hours_start || !work_hours_end || !Array.isArray(working_days)) {
        return res.status(400).json({ error: "Bad Request", message: "Faltan parámetros requeridos o formato incorrecto." });
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(work_hours_start) || !timeRegex.test(work_hours_end)) {
        return res.status(400).json({ error: "Bad Request", message: "El formato de hora de inicio o fin no es válido (debe ser HH:MM)." });
      }

      const isValidDays = working_days.every(d => typeof d === 'number' && d >= 0 && d <= 6);
      if (!isValidDays) {
        return res.status(400).json({ error: "Bad Request", message: "Los días laborables deben ser números entre 0 (Domingo) y 6 (Sábado)." });
      }

      const newValue = {
        work_hours_start,
        work_hours_end,
        working_days,
        timezone: "America/Bogota"
      };

      await dbPool.query(
        "INSERT INTO global_settings (key, value) VALUES ('schedule', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [JSON.stringify(newValue)]
      );

      res.status(200).json({ success: true, settings: newValue });
    } catch (err) {
      logger.error("Error guardando configuraciones globales", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudo actualizar la configuración." });
    }
  });

  // Rutas de Configuración del Calendario y Excepciones (Fase 2)
  app.get("/api/calendar", async (req, res) => {
    try {
      const result = await dbPool.query(
        "SELECT TO_CHAR(date, 'YYYY-MM-DD') as date, day_type FROM calendar_settings ORDER BY date ASC"
      );
      res.status(200).json(result.rows);
    } catch (err) {
      logger.warn("[Calendar API] PostgreSQL no disponible para GET, usando fallback en memoria");
      const list = Array.from(HolidayManager.inMemoryCalendarSettings.entries()).map(([date, day_type]) => ({
        date,
        day_type
      }));
      list.sort((a, b) => a.date.localeCompare(b.date));
      res.status(200).json(list);
    }
  });

  app.post("/api/calendar", async (req, res) => {
    try {
      const { date, day_type } = req.body;
      if (!date || !day_type) {
        return res.status(400).json({ error: "Bad Request", message: "Faltan parámetros requeridos (date, day_type)." });
      }

      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date) || isNaN(Date.parse(date))) {
        return res.status(400).json({ error: "Bad Request", message: "El formato de fecha no es válido (debe ser YYYY-MM-DD)." });
      }

      const validDayTypes = [
        'WEEKDAY', 
        'WEEKEND', 
        'SATURDAY_WORKABLE', 
        'SUNDAY_WORKABLE', 
        'HOLIDAY_WORKABLE', 
        'HOLIDAY_NON_WORKABLE'
      ];
      if (!validDayTypes.includes(day_type)) {
        return res.status(400).json({ error: "Bad Request", message: "El tipo de día no es válido." });
      }

      try {
        await dbPool.query(
          "INSERT INTO calendar_settings (date, day_type) VALUES ($1, $2) ON CONFLICT (date) DO UPDATE SET day_type = EXCLUDED.day_type",
          [date, day_type]
        );
      } catch (dbErr) {
        logger.warn("[Calendar API] Falló inserción en base de datos, guardando en memoria local");
      }

      HolidayManager.inMemoryCalendarSettings.set(date, day_type);
      res.status(200).json({ success: true, exception: { date, day_type } });
    } catch (err) {
      logger.error("Error guardando excepción de calendario", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudo guardar la excepción." });
    }
  });

  app.delete("/api/calendar/:date", async (req, res) => {
    try {
      const { date } = req.params;
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        return res.status(400).json({ error: "Bad Request", message: "El formato de fecha no es válido (debe ser YYYY-MM-DD)." });
      }

      try {
        await dbPool.query("DELETE FROM calendar_settings WHERE date = $1", [date]);
      } catch (dbErr) {
        logger.warn("[Calendar API] Falló eliminación en base de datos, eliminando de memoria local");
      }

      HolidayManager.inMemoryCalendarSettings.delete(date);
      res.status(200).json({ success: true, message: `Excepción para la fecha ${date} eliminada.` });
    } catch (err) {
      logger.error("Error eliminando excepción de calendario", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudo eliminar la excepción." });
    }
  });

  app.post("/api/calendar/sync-colombia", async (req, res) => {
    try {
      const colombianHolidays = [
        { date: '2026-01-01', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-01-12', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-03-23', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-04-02', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-04-03', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-05-01', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-05-18', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-06-08', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-06-15', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-06-29', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-07-20', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-08-07', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-10-12', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-11-02', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-11-16', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-12-08', day_type: 'HOLIDAY_NON_WORKABLE' },
        { date: '2026-12-25', day_type: 'HOLIDAY_NON_WORKABLE' }
      ];

      for (const h of colombianHolidays) {
        HolidayManager.inMemoryCalendarSettings.set(h.date, h.day_type as any);
        try {
          await dbPool.query(
            "INSERT INTO calendar_settings (date, day_type) VALUES ($1, $2) ON CONFLICT (date) DO UPDATE SET day_type = EXCLUDED.day_type",
            [h.date, h.day_type]
          );
        } catch (dbErr) {
          // Ignorar error de BD y continuar
        }
      }

      res.status(200).json({ success: true, count: colombianHolidays.length, message: "Festivos de Colombia 2026 sincronizados con éxito." });
    } catch (err) {
      logger.error("Error sincronizando festivos de Colombia", { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: "Internal Server Error", message: "No se pudieron sincronizar los festivos." });
    }
  });

  // Obtener el último festivo registrado
  app.get("/api/holidays/last", async (req, res) => {
    try {
      const holidayDatesSet = new Set<string>([
        '2024-12-25', '2025-01-01', '2026-01-01', '2026-05-22', '2026-12-25', '2027-01-01'
      ]);

      try {
        const dbResult = await dbPool.query(
          "SELECT TO_CHAR(date, 'YYYY-MM-DD') as date, day_type FROM calendar_settings WHERE day_type IN ('HOLIDAY_NON_WORKABLE', 'HOLIDAY_WORKABLE')"
        );
        for (const row of dbResult.rows) {
          holidayDatesSet.add(row.date);
        }
      } catch (dbErr) {}

      for (const [date, day_type] of HolidayManager.inMemoryCalendarSettings.entries()) {
        if (day_type === 'HOLIDAY_NON_WORKABLE' || day_type === 'HOLIDAY_WORKABLE') {
          holidayDatesSet.add(date);
        }
      }

      const now = new Date();
      for (const [date, day_type] of HolidayManager.inMemoryCalendarSettings.entries()) {
        if (day_type === 'WEEKDAY') {
          holidayDatesSet.delete(date);
        }
      }
      try {
        const dbWeekdayResult = await dbPool.query(
          "SELECT TO_CHAR(date, 'YYYY-MM-DD') as date FROM calendar_settings WHERE day_type = 'WEEKDAY'"
        );
        for (const row of dbWeekdayResult.rows) {
          holidayDatesSet.delete(row.date);
        }
      } catch (dbErr) {}

      const pastHolidays = Array.from(holidayDatesSet)
        .map(d => new Date(d))
        .filter(d => d <= now)
        .sort((a, b) => b.getTime() - a.getTime());

      const lastHoliday = pastHolidays[0];
      if (lastHoliday) {
        const offset = lastHoliday.getTimezoneOffset();
        const localDate = new Date(lastHoliday.getTime() - (offset * 60 * 1000));
        const formattedDate = localDate.toISOString().split('T')[0] || '';
        res.status(200).json({ date: formattedDate });
      } else {
        res.status(200).json({ date: '2026-05-22' });
      }
    } catch (err) {
      res.status(200).json({ date: '2026-05-22' });
    }
  });

  // Endpoint de simulación de saludos para pruebas (Soporta GET y POST con isNewClient)
  const executeSimulation = async (req: express.Request, res: express.Response) => {
    const category = (req.params.category || req.body?.category) as any;
    const userId = (req.query.userId || req.body?.userId) as string;
    const minutesStr = (req.query.minutes || req.body?.minutes) as string;
    const minutes = minutesStr ? parseInt(minutesStr, 10) : undefined;
    const isNewClientStr = (req.query.isNewClient || req.body?.isNewClient) as string;
    const isNewClient = isNewClientStr === 'true' || req.body?.isNewClient === true;
    const gender = (req.query.gender || req.body?.gender || 'M') as 'M' | 'F';
    const dayTypeOverride = (req.query.dayType || req.body?.dayType) as string | undefined;
    const timePeriodOverride = (req.query.timePeriod || req.body?.timePeriod) as string | undefined;

    if (!['INITIATION', 'RESPONSE', 'CONTINUITY'].includes(category)) {
      return res.status(400).json({ error: `Categoría inválida: ${category}` });
    }

    try {
      // 1. Verificar si el módulo de saludos está activo
      const isGreetingEnabled = await moduleService.isEnabled('module_greetings');
      if (!isGreetingEnabled) {
        if (userId) {
          const userMsgId = `sim_usr_${Date.now()}`;
          const profileSuffix = isNewClient ? " [NUEVO]" : " [EXISTENTE]";
          const genderSuffix = gender === 'F' ? " [DAMA]" : " [CABALLERO]";
          const userMessageText = category === 'CONTINUITY' && minutes
            ? `Simulación de categoría: ${category} (${minutes} min)${profileSuffix}${genderSuffix}`
            : `Simulación de categoría: ${category}${profileSuffix}${genderSuffix}`;

          const userMsg = new Message(
            userMsgId,
            userId,
            'user',
            userMessageText,
            'read',
            new Date()
          );
          await messageRepository.save(userMsg);

          io.to(userId).emit(`new_message_${userId}`, {
            id: userMsgId,
            sender: 'user',
            text: userMsg.text,
            timestamp: userMsg.timestamp,
            status: 'read'
          });

          // Mensaje de sistema que dice: "Módulo de Saludos Desactivado por el Administrador"
          const sysMsgId = `sim_sys_${Date.now()}`;
          const sysMessageText = "Módulo de Saludos Desactivado por el Administrador";

          const sysMsg = new Message(
            sysMsgId,
            userId,
            'system',
            sysMessageText,
            'read',
            new Date()
          );
          await messageRepository.save(sysMsg);

          io.to(userId).emit(`new_message_${userId}`, {
            id: sysMsgId,
            sender: 'system',
            text: sysMsg.text,
            timestamp: sysMsg.timestamp,
            status: 'read'
          });
        }

        return res.status(200).json({
          disabled: true,
          greeting: "Módulo de Saludos Desactivado por el Administrador",
          message: "Módulo de Saludos Desactivado por el Administrador"
        });
      }

      const result = await welcomeOrchestrator.validateAndGreet(
        userId || 'TEST_BOT_DEBUG', 
        gender, 
        category, 
        minutes,
        dayTypeOverride,
        timePeriodOverride,
        isNewClient
      );
      
      let forcedGreeting = result.greeting;
      const validationToken = result.token;
      const matchStatus = result.status;
      const clientName = result.name;
      const dayType = result.dayType;
      const isNonWorkable = result.isNonWorkable;

      // Si el perfil es Existente (isNewClient === false) y no es fuera de horario, adjuntar inmediatamente el menú
      if (!isNewClient && !isNonWorkable) {
        forcedGreeting += "\n\n¿En qué puedo ayudarte hoy?\n1. Soporte Técnico\n2. Ventas\n3. Horarios";
      }

      let userMsgId = "";
      if (userId) {
        userMsgId = `sim_usr_${Date.now()}`;
        const profileSuffix = isNewClient ? " [NUEVO]" : " [EXISTENTE]";
        const genderSuffix = gender === 'F' ? " [DAMA]" : " [CABALLERO]";
        const userMessageText = category === 'CONTINUITY' && minutes
          ? `Simulación de categoría: ${category} (${minutes} min)${profileSuffix}${genderSuffix}`
          : `Simulación de categoría: ${category}${profileSuffix}${genderSuffix}`;

        const userMsg = new Message(
          userMsgId,
          userId,
          'user',
          userMessageText,
          'delivered',
          new Date()
        );
        await messageRepository.save(userMsg);
        
        io.to(userId).emit(`new_message_${userId}`, {
          id: userMsgId,
          sender: 'user',
          text: userMsg.text,
          timestamp: userMsg.timestamp,
          status: 'delivered'
        });

        // 1. Emitir un Mensaje de Sistema con el Token de Validación
        const sysMsgId = `sim_sys_${Date.now()}`;
        const sysMessageText = matchStatus === 'VALIDATED'
          ? `🔒 Simulación Validada. Token: ${validationToken} (MATCH OK: ${clientName})`
          : `🔒 Simulación Anónima. Token: ${validationToken} (MATCH PENDIENTE: ${clientName})`;

        const sysMsg = new Message(
          sysMsgId,
          userId,
          'system',
          sysMessageText,
          'read',
          new Date()
        );
        await messageRepository.save(sysMsg);

        io.to(userId).emit(`new_message_${userId}`, {
          id: sysMsgId,
          sender: 'system',
          text: sysMsg.text,
          timestamp: sysMsg.timestamp,
          status: 'read'
        });

        // 2. Efecto "Visto" tras 1.5 segundos
        await new Promise((resolve) => setTimeout(resolve, 1500));
        
        userMsg.updateStatus('read');
        await messageRepository.save(userMsg);

        // Emitimos la actualización del estado del mensaje
        io.to(userId).emit(`message_status_${userId}`, {
          messageId: userMsgId,
          status: 'read'
        });

        // 3. Esperar otro segundo (tiempo de "Escribiendo...") antes de entregar el saludo
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      if (userId) {
        const botMsgId = `sim_bot_${Date.now()}`;
        const botMsg = new Message(
          botMsgId,
          userId,
          'bot',
          forcedGreeting,
          'read',
          new Date()
        );
        await messageRepository.save(botMsg);

        io.to(userId).emit(`new_message_${userId}`, {
          id: botMsgId,
          sender: 'bot',
          text: forcedGreeting,
          timestamp: botMsg.timestamp,
          status: 'read'
        });
      }

      // Actualizar explícitamente el estado de la sesión de FSM en Redis o Base de Datos
      let nextStep = (isNewClient && !isNonWorkable) ? "AWAITING_NAME" : (isNonWorkable ? "WELCOME" : "AWAITING_MENU_OPTION");
      
      const reqInitialState = (req.body?.initialState || req.query?.initialState) as string | undefined;
      if (reqInitialState) {
        if (reqInitialState === 'MAIN_MENU') {
          nextStep = 'AWAITING_MENU_OPTION';
        } else if (reqInitialState === 'AWAITING_DATA') {
          nextStep = 'AWAITING_NAME';
        } else if (reqInitialState === 'GREETING') {
          nextStep = 'WELCOME';
        }
      }

      const session = new ChatSession({
        userId: userId || 'TEST_BOT_DEBUG',
        currentStep: nextStep,
        updatedAt: new Date()
      });
      session.addMessageToHistory('bot', forcedGreeting);
      await sessionRepository.save(session);

      res.status(200).json({ 
        greeting: forcedGreeting,
        token: validationToken,
        status: matchStatus,
        name: clientName,
        dayType,
        isNonWorkable
      });
    } catch (error) {
      logger.error("Error en endpoint de simulación de saludo", { error: (error as Error).message });
      res.status(500).json({ error: (error as Error).message });
    }
  };

  app.get("/api/test/greeting/:category", executeSimulation);
  app.post("/api/test/greeting", executeSimulation);
  app.post("/api/test/greeting/:category", executeSimulation);

  // Endpoint de Métricas para Prometheus
  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  });

  // Endpoint de Salud Resiliente con Diagnóstico Aislado
  app.get("/health", async (req, res) => {
    let dbStatus = "connected";
    let redisStatus = "connected";
    let isHealthy = true;

    try {
      await dbPool.query("SELECT 1");
    } catch (error) {
      dbStatus = "disconnected";
      isHealthy = false;
    }

    try {
      await redisConnection.ping();
    } catch (error) {
      redisStatus = "disconnected";
      isHealthy = false;
    }

    res.status(isHealthy ? 200 : 500).json({
      status: isHealthy ? "healthy" : "unhealthy",
      database: dbStatus,
      redis: redisStatus
    });
  });

  // Middleware Global de Captura de Errores
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error("Error no controlado capturado por el middleware global", {
      error: err?.message || String(err),
      stack: err?.stack,
      path: req.path
    });
    res.status(500).json({
      error: "Internal Server Error",
      message: "Ocurrió un error inesperado en el servidor."
    });
  });

  // El servidor inicia escuchando puertos en la orquestación main() en el punto de entrada principal
}

async function createGreetingRepository(): Promise<IGreetingRepository> {
  try {
    await dbPool.query('SELECT 1');
    logger.info("[DB] Conexión exitosa, usando PostgresGreetingRepository");
    return new PostgresGreetingRepository(dbPool);
  } catch {
    logger.warn("[DB] PostgreSQL no disponible, usando InMemoryGreetingRepository (modo demo)");
    return new InMemoryGreetingRepository();
  }
}

/**
 * Función de Cierre Gracioso
 * Se encarga de aterrizar el sistema sin pérdida de datos.
 */
const gracefulShutdown = async (signal: string) => {
  logger.warn(`\n🛑 Recibida señal ${signal}. Iniciando cierre de seguridad...`);

  // Establecemos un tiempo límite para el cierre (ej: 10 segundos)
  const forceExitTimeout = setTimeout(() => {
    logger.error("❌ El cierre tardó demasiado. Forzando salida por seguridad.");
    process.exit(1);
  }, 10000);

  try {
    // 1. Dejar de aceptar nuevas peticiones HTTP y WebSockets
    if (server.listening) {
      server.close(() => {
        logger.info("📡 Servidor HTTP cerrado (no más peticiones entrantes).");
      });
    }

    // 2. Cerrar el Worker de BullMQ (Deja de tomar mensajes nuevos de la cola)
    // Pero permite que el mensaje actual termine de procesarse.
    if (worker) {
      await worker.close();
      logger.info("🏗️ Worker de mensajes detenido.");
    }

    // 3. Cerrar la Cola de Mensajes de BullMQ
    if (messageQueue) {
      await messageQueue.close();
      logger.info("📦 Cola de mensajes BullMQ cerrada.");
    }

    // 4. Cerrar conexión a Redis
    if (redisConnection) {
      await redisConnection.quit();
      logger.info("🧠 Conexión a Redis cerrada limpiamente.");
    }

    // 5. Cerrar Pool de PostgreSQL
    if (dbPool) {
      await dbPool.end();
      logger.info("🐘 Pool de PostgreSQL liberado.");
    }

    clearTimeout(forceExitTimeout);
    logger.info("✅ Sistema apagado con éxito. ¡Hasta pronto, colega! 🚀");
    process.exit(0);

  } catch (error) {
    logger.error("❌ Error durante el apagado:", error);
    process.exit(1);
  }
};

/**
 * Escucha de Señales del Sistema Operativo
 */
// SIGINT: Se activa con Ctrl+C en la terminal o detención local
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// SIGTERM: Se activa cuando Docker o el sistema piden cerrar el proceso
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

