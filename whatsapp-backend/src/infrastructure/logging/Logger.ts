/**
 * @file Logger.ts
 * @description Logger de producción estructurado mediante Winston.
 * Previene el llenado de discos en contenedores mediante esquemas de rotación atómica por tamaño.
 */
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export class AppLogger {
  private static instance: winston.Logger | null = null;

  public static getInstance(): winston.Logger {
    if (!AppLogger.instance) {
      const logFormat = winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Captura automática de trazas de desborde de pila (Stack Trace)
        winston.format.json()
      );

      AppLogger.instance = winston.createLogger({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: logFormat,
        defaultMeta: { service: 'chatbot_core_engine' },
        transports: [
          // 1. Canal de Consola Estándar optimizado para recolectores como Logstash/Fluentd
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, service, stack }) => {
                return `[${timestamp}] [${level}] [${service}]: ${stack || message}`;
              })
            )
          }),

          // 2. Transportador Rotativo Defensivo para Errores Críticos
          new DailyRotateFile({
            filename: 'storage/logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true, // Comprime los archivos viejos en formato .gz
            maxSize: '20m',      // Límite físico por archivo: 20 Megabytes
            maxFiles: '14d',     // Política de Purgado: Borrar registros mayores a 14 días
            level: 'error',
            format: logFormat
          }),

          // 3. Transportador Rotativo Defensivo para Trazas Generales de la FSM
          new DailyRotateFile({
            filename: 'storage/logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: logFormat
          }),

          // 4. Conector de Webhook de Emergencia (Slack/Discord)
          new (require('./SlackWebhookTransport').SlackWebhookTransport)({
            level: 'error',
            webhookUrl: process.env.EMERGENCY_SLACK_WEBHOOK || ''
          })
        ]
      });
    }

    return AppLogger.instance;
  }
}

export const logger = AppLogger.getInstance();
export default logger;
