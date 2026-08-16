import { Request, Response } from 'express';
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { HolidayManager } from '../../../core/services/HolidayManager';
import { ColombiaHolidayProvider } from '../../../infrastructure/providers/ColombiaHolidayProvider';
import { ApiResponse } from '../types/ApiResponse';

export class CalendarController {
  constructor(private readonly pool: Pool) {}

  public getExceptions = async (_req: Request, res: Response): Promise<void> => {
    try {
      const [rows] = await this.pool.query<RowDataPacket[]>(
        'SELECT fecha as date, tipo_dia as day_type FROM configuraciones_calendario ORDER BY fecha ASC'
      );
      res.status(200).json({ success: true, data: rows } as ApiResponse);
    } catch (error: any) {
      console.error(`[CalendarController] Error: ${error.message}`);
      res.status(200).json({ success: true, data: [] } as ApiResponse);
    }
  };

  public createException = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date, day_type } = req.body;
      if (!date || !day_type) {
        res.status(400).json({ success: false, error: 'date y day_type requeridos.' } as ApiResponse);
        return;
      }
      await this.pool.query<ResultSetHeader>(
        'INSERT INTO configuraciones_calendario (fecha, tipo_dia) VALUES (?, ?) ON DUPLICATE KEY UPDATE tipo_dia = ?',
        [date, day_type, day_type]
      );
      HolidayManager.inMemoryCalendarSettings.set(date, day_type);
      res.status(200).json({ success: true, message: 'Excepción guardada.' } as ApiResponse);
    } catch (error: any) {
      console.error(`[CalendarController] Error: ${error.message}`);
      res.status(500).json({ success: false, error: 'Error al guardar excepción.' } as ApiResponse);
    }
  };

  public deleteException = async (req: Request, res: Response): Promise<void> => {
    try {
      const dateStr = req.params.dateStr as string;
      await this.pool.query<ResultSetHeader>(
        'DELETE FROM configuraciones_calendario WHERE fecha = ?',
        [dateStr]
      );
      HolidayManager.inMemoryCalendarSettings.delete(dateStr);
      res.status(200).json({ success: true, message: 'Excepción eliminada.' } as ApiResponse);
    } catch (error: any) {
      console.error(`[CalendarController] Error: ${error.message}`);
      res.status(500).json({ success: false, error: 'Error al eliminar excepción.' } as ApiResponse);
    }
  };

  public syncColombia = async (_req: Request, res: Response): Promise<void> => {
    try {
      const provider = new ColombiaHolidayProvider();
      let syncedCount = 0;
      for (const year of [2024, 2025, 2026, 2027, 2028, 2029, 2030]) {
        const holidays = await provider.getHolidaysByYear(year);
        for (const h of holidays) {
          await this.pool.query<ResultSetHeader>(
            'INSERT INTO configuraciones_calendario (fecha, tipo_dia) VALUES (?, ?) ON DUPLICATE KEY UPDATE tipo_dia = ?',
            [h.date, 'HOLIDAY_NON_WORKABLE', 'HOLIDAY_NON_WORKABLE']
          );
          HolidayManager.inMemoryCalendarSettings.set(h.date, 'HOLIDAY_NON_WORKABLE');
          syncedCount++;
        }
      }
      res.status(200).json({ success: true, message: `${syncedCount} festivos sincronizados.` } as ApiResponse);
    } catch (error: any) {
      console.error(`[CalendarController] Error: ${error.message}`);
      res.status(500).json({ success: false, error: 'Error al sincronizar festivos.' } as ApiResponse);
    }
  };
}
