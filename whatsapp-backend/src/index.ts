/**
 * @file index.ts
 * @description Punto de entrada e inicialización de la suite transaccional del Bot.
 * Encapsula el arranque asíncrono y la gestión de apagado seguro del proceso.
 */
import dotenv from 'dotenv';
import { AppContainer } from './infrastructure/containers/AppContainer';
import { ExpressServer } from './infrastructure/server/ExpressServer';
import logger from './infrastructure/logging/Logger';

dotenv.config();

class ApplicationBootstrap {
  private container: AppContainer;
  private server!: ExpressServer;

  constructor() {
    this.container = AppContainer.getInstance();
  }

  /**
   * Orquesta la inicialización asíncrona de los componentes del software.
   */
  public async boot(): Promise<void> {
    try {
      logger.info('🚀 [Boot] Iniciando secuencia de arranque asíncrona de ApplicationBootstrap...');

      // 1. Inicializar el Contenedor IoC con verificación real de conectividad
      const dbConnected = await this.checkDatabaseConnectivity();
      const redisConnected = await this.checkRedisConnectivity();
      await this.container.init(dbConnected, redisConnected);

      // 2. Levantar la capa de transporte HTTP y WebSocket (Express, Socket.io, middleware de rawBody firmas)
      this.server = new ExpressServer(this.container);
      this.server.start();

      // 3. Registrar manejadores de señales para apagado limpio
      this.registerSignalHandlers();

    } catch (criticalError: any) {
      logger.error('🚨 [Boot Fatal Error] El sistema colapsó en la inicialización:', criticalError.message);
      process.exit(1);
    }
  }

  /**
   * Verifica conectividad con MariaDB mediante ping query.
   */
  private async checkDatabaseConnectivity(): Promise<boolean> {
    try {
      const mysql = await import('mysql2/promise');
      const dbPassword = process.env.DB_PASSWORD ?? '';
      const pool = mysql.createPool({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'prochat_admin',
        password: dbPassword,
        database: process.env.DB_NAME || 'chatbot_crm_db',
        connectionLimit: 2,
        connectTimeout: 5000
      });
      await pool.query('SELECT 1');
      await pool.end();
      logger.info('MariaDB connectivity check passed.');
      return true;
    } catch {
      logger.warn('MariaDB connectivity check failed. Running without database.');
      return false;
    }
  }

  /**
   * Verifica conectividad con Redis mediante PING.
   */
  private async checkRedisConnectivity(): Promise<boolean> {
    try {
      const Redis = (await import('ioredis')).default;
      const client = new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        connectTimeout: 5000,
        lazyConnect: true,
        maxRetriesPerRequest: 1
      });
      await client.connect();
      const pong = await client.ping();
      await client.quit();
      logger.info('Redis connectivity check passed.');
      return pong === 'PONG';
    } catch {
      logger.warn('Redis connectivity check failed. Running without cache.');
      return false;
    }
  }

  /**
   * Captura señales del sistema operativo para liberar recursos de forma ordenada (Graceful Shutdown).
   */
  private registerSignalHandlers(): void {
    const shutdownProcess = async (signal: string) => {
      logger.warn(`\n⏳ [Shutdown Engine] Señal ${signal} recibida. Deteniendo automatizaciones de forma segura...`);
      
      // Conceder una ventana máxima de 10 segundos para terminar queries pendientes en MariaDB
      const timeoutId = setTimeout(() => {
        logger.error('🚨 [Shutdown Timeout] Forzando salida destructiva por latencia excesiva.');
        process.exit(1);
      }, 10000);

      try {
        // Detener servidor HTTP, websockets, workers, redis y bases de datos unificadas
        await this.server.shutdown();
        
        clearTimeout(timeoutId);
        logger.info('✅ [Shutdown Engine] Ecosistema apagado con éxito. Hilos de persistencia liberados.');
        process.exit(0);
      } catch (err) {
        logger.error('🚨 [Shutdown Error] Error durante el apagado:', err);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdownProcess('SIGINT'));
    process.on('SIGTERM', () => shutdownProcess('SIGTERM'));
  }
}

// Inicializar el objeto bootstrap del software
const application = new ApplicationBootstrap();
application.boot();

/* ──────────────────────────────────────────────────────────────
   CENTINELAS DE FRONTERA: CAPTURA DE FALLOS CATASTRÓFICOS DEL RUNTIME
   ────────────────────────────────────────────────────────────── */

process.on('uncaughtException', (runtimeException: Error) => {
  logger.error('🚨 [Uncaught Exception DETECTED] Desbordamiento de pila en el hilo principal:', runtimeException);
  process.exit(1);
});

process.on('unhandledRejection', (rejectedPromiseReason: any) => {
  logger.error('🚨 [Unhandled Rejection DETECTED] Promesa asíncrona rota sin bloque catch:', rejectedPromiseReason);
});
