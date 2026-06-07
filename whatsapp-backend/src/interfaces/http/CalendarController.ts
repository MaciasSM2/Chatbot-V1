/**
 * @file CalendarController.ts
 * @description Maneja las peticiones relacionadas con el calendario y festivos.
 * Extrae la lógica de rutas inline de MainRouter hacia un controlador dedicado.
 */
import { Request, Response } from 'express';
import { HolidayManager } from '../../core/services/HolidayManager';
import { dbPool } from '../../infrastructure/database/MySQLConnection';
import logger from '../../infrastructure/logging/Logger';

export class CalendarController {
  constructor(private readonly holidayManager: HolidayManager) {}

  /**
   * Sincroniza los festivos de Colombia para un año específico.
   * POST /api/calendar/sync o POST /api/calendar/sync-colombia
   */
  async syncYear(req: Request, res: Response): Promise<void> {
    const year = req.body?.year
      ? Number(req.body.year)
      : req.query?.year
        ? Number(req.query.year)
        : new Date().getFullYear();

    try {
      await this.holidayManager.syncHolidaysForYear(year);
      res.status(200).json({
        success: true,
        message: `Festivos de Colombia para el año ${year} sincronizados correctamente en MariaDB.`,
      });
    } catch (error) {
      logger.error('Error en syncYear', {
        error: error instanceof Error ? error.message : String(error),
      });
      res.status(500).json({
        success: false,
        error: 'No se pudo completar la sincronización de festivos.',
      });
    }
  }

  /**
   * Devuelve la lista actual de excepciones del calendario.
   * GET /api/calendar
   */
  async getExceptions(_req: Request, res: Response): Promise<void> {
    try {
      const [rows]: any = await dbPool.query(
        "SELECT DATE_FORMAT(exception_date, '%Y-%m-%d') as date, type as day_type, label FROM holiday_exceptions ORDER BY exception_date ASC"
      );
      const mapped = rows.map((r: any) => {
        const day_type =
          r.day_type === 'WORKABLE_SPECIAL' ? 'HOLIDAY_WORKABLE' : 'HOLIDAY_NON_WORKABLE';
        return { date: r.date, day_type, label: r.label };
      });
      res.status(200).json(mapped);
    } catch (_err) {
      // Fallback: datos en memoria
      const list = Array.from(HolidayManager.inMemoryCalendarSettings.entries()).map(
        ([date, type]) => ({
          date,
          day_type: type === 'HOLIDAY_NON_WORKABLE' ? 'HOLIDAY_NON_WORKABLE' : 'HOLIDAY_WORKABLE',
          label:
            type === 'HOLIDAY_NON_WORKABLE' ? 'Cierre Administrativo' : 'Especial Laborable',
        })
      );
      list.sort((a, b) => a.date.localeCompare(b.date));
      res.status(200).json(list);
    }
  }

  /**
   * Agrega o actualiza una excepción en el calendario.
   * POST /api/calendar
   */
  async addException(req: Request, res: Response): Promise<void> {
    try {
      const { date, day_type } = req.body;
      const type = day_type === 'HOLIDAY_WORKABLE' ? 'WORKABLE_SPECIAL' : 'HOLIDAY';
      const label =
        day_type === 'HOLIDAY_WORKABLE' ? 'Especial Laborable' : 'Cierre Administrativo/Festivo';

      await dbPool.query(
        'INSERT INTO holiday_exceptions (exception_date, label, type) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE type = VALUES(type), label = VALUES(label)',
        [date, label, type]
      );
      await this.holidayManager.loadHolidays();
      res.status(200).json({ success: true });
    } catch (err) {
      logger.error('Error guardando excepción de calendario', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  /**
   * Elimina una excepción del calendario por fecha.
   * DELETE /api/calendar/:date
   */
  async deleteException(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.params;
      await dbPool.query('DELETE FROM holiday_exceptions WHERE exception_date = ?', [date]);
      await this.holidayManager.loadHolidays();
      res.status(200).json({ success: true });
    } catch (err) {
      logger.error('Error eliminando excepción de calendario', {
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
