/**
 * @file TimePeriodsController.ts
 * @description Adaptador HTTP para gestionar franjas horarias (EARLY_MORNING, MORNING, AFTERNOON, NIGHT).
 */
import { Request, Response } from 'express';
import { DateTimeManager } from '../../../core/services/DateTimeManager';
import logger from '../../../infrastructure/logging/Logger';

export class TimePeriodsController {
  constructor(private readonly dateTimeManager: DateTimeManager) {}

  /**
   * GET /api/settings/time-periods
   * Lista todas las franjas horarias activas configuradas.
   */
  public getPeriods = async (_req: Request, res: Response): Promise<void> => {
    try {
      const periods = await this.dateTimeManager.getTimePeriodsFromDb();
      res.status(200).json({ success: true, data: periods });
    } catch (err: any) {
      logger.error(`[TimePeriodsController][getPeriods] ${err.message}`);
      res.status(500).json({ success: false, error: 'Error consultando franjas horarias.' });
    }
  };

  /**
   * PUT /api/admin/settings/time-periods/:id
   * Actualiza la hora de inicio/fin de una franja horaria.
   * Body: { startHour: number, endHour: number }
   */
  public updatePeriod = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { startHour, endHour } = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: 'ID de franja obligatorio.' });
        return;
      }
      if (typeof startHour !== 'number' || typeof endHour !== 'number') {
        res.status(400).json({ success: false, error: 'startHour y endHour deben ser numéricos.' });
        return;
      }
      if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
        res.status(400).json({ success: false, error: 'Horas fuera de rango 0-23.' });
        return;
      }

      await this.dateTimeManager.updateTimePeriodInDb(id, startHour, endHour);
      res.status(200).json({ success: true, message: 'Franja horaria actualizada.' });
    } catch (err: any) {
      logger.error(`[TimePeriodsController][updatePeriod] ${err.message}`);
      res.status(500).json({ success: false, error: 'Error actualizando franja horaria.' });
    }
  };
}
