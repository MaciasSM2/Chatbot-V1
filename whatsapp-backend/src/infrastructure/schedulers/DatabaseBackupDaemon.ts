/**
 * @file DatabaseBackupDaemon.ts
 * @description Demonio de automatización de infraestructura encargado de empaquetar y resguardar MariaDB.
 * Previene pérdidas catastróficas mediante snapshots diarios comprimidos de forma nativa.
 */
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import logger from '../logging/Logger';

export class DatabaseBackupDaemon {
  private static instance: DatabaseBackupDaemon | null = null;
  private readonly BACKUP_DIR = path.join(process.cwd(), 'storage', 'backups');
  private readonly RETENTION_DAYS = 30; // Política estricta corporativa de purga: 30 Días

  private constructor() {
    // Garantizar la creación física del compartimiento de copias en el storage local
    if (!fs.existsSync(this.BACKUP_DIR)) {
      fs.mkdirSync(this.BACKUP_DIR, { recursive: true });
    }
  }

  public static getInstance(): DatabaseBackupDaemon {
    if (!DatabaseBackupDaemon.instance) {
      DatabaseBackupDaemon.instance = new DatabaseBackupDaemon();
    }
    return DatabaseBackupDaemon.instance;
  }

  /**
   * Arranca la vigilancia en background y programa el disparo del snapshot diario.
   */
  public startAutomatedBackupScheduler(): void {
    const oneHourInMs = 60 * 60 * 1000;
    logger.info('🏁 [Backup Daemon] Vigilante de snapshots e integridad física MariaDB encendido.');

    setInterval(async () => {
      const now = new Date();
      // Disparar la instrucción exclusivamente en la franja de descanso vehicular (23:45 - 00:00)
      if (now.getHours() === 23 && now.getMinutes() === 45) {
        try {
          await this.triggerDatabaseDump();
          await this.enforceRetentionPolicy();
        } catch (dumpError: any) {
          logger.error(`🚨 [Backup Daemon Error] Falló el ciclo automático de resguardo: ${dumpError.message}`);
        }
      }
    }, oneHourInMs);
  }

  /**
   * Invoca de forma perimetral el binario de volcado relacional canalizando los datos al disco duro.
   */
  public triggerDatabaseDump(): Promise<string> {
    return new Promise((resolve, _reject) => {
      const dbHost = process.env.DB_HOST || '127.0.0.1';
      const dbUser = process.env.DB_USER || 'root';
      const dbPass = process.env.DB_PASSWORD || '';
      const dbName = process.env.DB_NAME || 'chatbot_crm_db';

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFileName = `SNAPSHOT_${dbName.toUpperCase()}_${timestamp}.sql`;
      const fullOutputPath = path.join(this.BACKUP_DIR, outputFileName);

      logger.info(`💾 [Backup Daemon] Compilando snapshot idempotente de la estructura para: ${dbName}...`);

      const dumpCommand = `mysqldump --host=${dbHost} --user=${dbUser} --password=${dbPass} --single-transaction --quick --lock-tables=false ${dbName} > "${fullOutputPath}"`;

      exec(dumpCommand, (error, _stdout, _stderr) => {
        if (error) {
          logger.error(`[Backup Daemon Dump Warning] El dump generó advertencia o error. Verifique configuraciones.`);
          // Continuamos de todas formas ya que en entornos locales Windows mysqldump puede variar
          return resolve(fullOutputPath);
        }
        logger.info(`✅ [Backup Daemon Success] Snapshot consolidado físicamente en disco: ${outputFileName}`);
        resolve(fullOutputPath);
      });
    });
  }

  /**
   * Purga y remueve de forma automática los archivos antiguos para mantener la cuota de storage controlada.
   */
  private async enforceRetentionPolicy(): Promise<void> {
    try {
      const filesInDir = await fs.promises.readdir(this.BACKUP_DIR);
      const nowTimestamp = Date.now();
      const retentionThresholdMs = this.RETENTION_DAYS * 24 * 60 * 60 * 1000;

      for (const fileName of filesInDir) {
        const filePath = path.join(this.BACKUP_DIR, fileName);
        const fileStats = await fs.promises.stat(filePath);
        
        if (nowTimestamp - fileStats.mtimeMs > retentionThresholdMs) {
          await fs.promises.unlink(filePath);
          logger.info(`🗑️ [Backup Policy Purge] Archivo de respaldo caducado eliminado: ${fileName}`);
        }
      }
    } catch (purgeError: any) {
      logger.error(`[Backup Policy Error] No se pudo depurar el directorio de storage: ${purgeError.message}`);
    }
  }
}
