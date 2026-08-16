/**
 * @file HolidaySyncScheduler.ts
 * @description Daemon orientado a objetos encargado de pre-calcular e indexar los festivos en MariaDB.
 * Aplica el principio de Responsabilidad Única aislando las tareas asíncronas de mantenimiento.
 */
import { Pool, PoolConnection } from 'mysql2/promise';
import { ColombiaHolidayProvider } from '../providers/ColombiaHolidayProvider';
import logger from '../logging/Logger';

export class HolidaySyncScheduler {
  private readonly provider: ColombiaHolidayProvider;

  constructor(private readonly mariadbPool: Pool) {
    this.provider = new ColombiaHolidayProvider();
  }

  /**
   * Ejecuta el pre-cálculo masivo e inyección indexada para el año corriente y subsiguiente.
   */
  public async executeAnnualSync(): Promise<void> {
    const currentYear = new Date().getFullYear();
    const targetYears = [currentYear, currentYear + 1];
    
    const connection: PoolConnection = await this.mariadbPool.getConnection();

    try {
      logger.info(`⏳ [Scheduler Daemon] Iniciando procesamiento de calendarios para los años: ${targetYears.join(', ')}`);
      await connection.beginTransaction();

      for (const year of targetYears) {
        // Recorrer los 12 meses y evaluar matemáticamente cada día mediante el Algoritmo de Gauss
        for (let month = 0; month < 12; month++) {
          const daysInMonth = new Date(year, month + 1, 0).getDate();

          for (let day = 1; day <= daysInMonth; day++) {
            const evaluateDate = new Date(year, month, day);
            const isCalculatedHoliday = await this.provider.isHoliday(evaluateDate);

            if (isCalculatedHoliday) {
              const formattedIsoDate = evaluateDate.toISOString().split('T')[0]!;
              
              // Inyección idempotente: Evita duplicar si el operador ya parametrizó la excepción
              await connection.query(`
                INSERT IGNORE INTO holiday_exceptions (exception_date, label, type)
                VALUES (?, ?, 'HOLIDAY')
              `, [formattedIsoDate, `Festivo Oficial Regular - Cómputo Automático ${year}`]);
            }
          }
        }
      }

      await connection.commit();
      logger.info('✅ [Scheduler Daemon] Matriz anual de festivos consolidada físicamente en MariaDB.');
    } catch (schedulerError: any) {
      await connection.rollback();
      logger.error(`🚨 [Scheduler Daemon Error] La sincronización de cronogramas colapsó: ${schedulerError.message}`);
      throw schedulerError;
    } finally {
      connection.release();
    }
  }

  /**
   * Inicializa un bucle de verificación de baja fricción en background que despierta cada 24 horas.
   */
  private async needsYearSync(): Promise<boolean> {
    try {
      const currentYear = new Date().getFullYear();
      const [rows] = await this.mariadbPool.query<any[]>(
        `SELECT MAX(exception_date) as last_date FROM holiday_exceptions WHERE type = 'HOLIDAY'`
      );
      const lastDate = rows?.[0]?.last_date;
      if (!lastDate) return true;
      const lastYear = new Date(lastDate).getFullYear();
      return lastYear < currentYear;
    } catch {
      return false;
    }
  }

  public startCronWorker(): void {
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    
    // Ejecutar un disparo preventivo inmediato al arrancar el contenedor por primera vez
    this.executeAnnualSync().catch(err => {
      logger.error('[Scheduler Startup Error] Falló el disparo preventivo de festivos:', err);
    });

    setInterval(async () => {
      try {
        if (await this.needsYearSync()) {
          logger.info('[Scheduler] Detectado año sin festivos sincronizados. Forzando sync.');
          await this.executeAnnualSync();
        }
      } catch (err: any) {
        logger.error('[Scheduler Interval Error] Falló la verificación de festivos:', err.message);
      }
    }, twentyFourHoursInMs);
  }
}
