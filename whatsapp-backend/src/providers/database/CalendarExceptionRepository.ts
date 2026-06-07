/**
 * @file CalendarExceptionRepository.ts
 * @description Repositorio relacional encargado de la administración de jornadas excepcionales.
 * Provee los ganchos de control para bloquear o habilitar la FSM de forma dinámica.
 */
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import logger from '../../infrastructure/logging/Logger';

export interface ICalendarException {
  id?: number;
  exceptionDate: string; // Formato inmutable: YYYY-MM-DD
  description: string;
  isWorkable: boolean;    // true = Forzar día hábil, false = Forzar día festivo / bloqueo
}

export class CalendarExceptionRepository {
  constructor(private readonly mariadbPool: Pool) {}

  /**
   * Registra una jornada de excepción aplicando una política de inserción transaccional segura.
   */
  public async registerException(exception: ICalendarException): Promise<boolean> {
    try {
      const [result] = await this.mariadbPool.query<ResultSetHeader>(
        `INSERT INTO holiday_exceptions (exception_date, label, type)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE 
          label = VALUES(label),
          type = VALUES(type)`,
        [
          exception.exceptionDate, 
          exception.description, 
          exception.isWorkable ? 'WORKABLE_SPECIAL' : 'HOLIDAY'
        ]
      );

      logger.info(`📅 [Calendar Engine] Registrada excepción temporal para el día: ${exception.exceptionDate}`);
      return result.affectedRows > 0;
    } catch (dbError: any) {
      logger.error(`🚨 [Calendar Engine Error] No se pudo escribir la jornada excepcional: ${dbError.message}`);
      return false;
    }
  }

  /**
   * Recupera el mapa completo de bloqueos activos para hidratar el calendario visual del frontend.
   */
  public async getAllActiveExceptions(): Promise<ICalendarException[]> {
    try {
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT id, exception_date as exceptionDate, label as description, type 
         FROM holiday_exceptions 
         ORDER BY exception_date ASC`
      );

      return rows.map(row => ({
        id: row.id,
        exceptionDate: row.exceptionDate,
        description: row.description,
        isWorkable: row.type === 'WORKABLE_SPECIAL'
      }));
    } catch (error: any) {
      logger.error(`[Calendar Repository] Falló el listado de anomalías de calendario: ${error.message}`);
      return [];
    }
  }

  /**
   * Evalúa de forma específica una fecha para determinar si posee una anulación de comportamiento activa.
   */
  public async evaluateDateOverride(targetIsoDate: string): Promise<ICalendarException | null> {
    const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
      `SELECT exception_date as exceptionDate, label as description, type 
       FROM holiday_exceptions 
       WHERE exception_date = ? LIMIT 1`,
      [targetIsoDate]
    );

    if (rows.length === 0) return null;
    const row = rows[0]!;

    return {
      exceptionDate: row.exceptionDate,
      description: row.description,
      isWorkable: row.type === 'WORKABLE_SPECIAL'
    };
  }

  /**
   * Remueve físicamente una anulación devolviendo el día a su comportamiento natural.
   */
  public async deleteException(exceptionDate: string): Promise<boolean> {
    const [result] = await this.mariadbPool.query<ResultSetHeader>(
      `DELETE FROM holiday_exceptions WHERE exception_date = ?`,
      [exceptionDate]
    );
    return result.affectedRows > 0;
  }
}
