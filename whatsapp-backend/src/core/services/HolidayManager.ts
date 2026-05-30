import { Pool } from "pg";
import { DayType } from "../entities/GreetingTemplate";

export type HolidayStatus = 'WORKABLE' | 'NON_WORKABLE';

export class HolidayManager {
  public static readonly inMemoryCalendarSettings = new Map<string, DayType>();

  private static readonly HOLIDAYS: Record<string, HolidayStatus> = {
    '2024-12-25': 'NON_WORKABLE',
    '2025-01-01': 'NON_WORKABLE',
    '2026-01-01': 'NON_WORKABLE',
    '2026-05-22': 'WORKABLE', // Useful for testing as it matches today's date in local time
    '2026-12-25': 'NON_WORKABLE',
    '2027-01-01': 'NON_WORKABLE',
  };

  constructor(private readonly dbPool?: Pool) {}

  /**
   * Returns 'WORKABLE', 'NON_WORKABLE', or null if the date is not a holiday.
   * @param date Date to check
   */
  public async getHolidayStatus(date: Date): Promise<HolidayStatus | null> {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const formattedDate = localDate.toISOString().split('T')[0] || '';
    
    // 1. Prioridad 1: Configuración en PostgreSQL
    if (this.dbPool) {
      try {
        const res = await this.dbPool.query(
          "SELECT day_type FROM calendar_settings WHERE date = $1",
          [formattedDate]
        );
        if (res.rows.length > 0) {
          const type = res.rows[0].day_type as DayType;
          if (type === 'HOLIDAY_NON_WORKABLE') return 'NON_WORKABLE';
          if (type === 'HOLIDAY_WORKABLE') return 'WORKABLE';
          if (type === 'WEEKDAY' || type === 'SATURDAY_WORKABLE' || type === 'SUNDAY_WORKABLE') {
            return null; // Anula festivo o especifica día laborable
          }
        }
      } catch (err) {
        // Fallback silencioso en caso de error
      }
    }

    // 2. Prioridad 2: En memoria (Modo Demo)
    const inMemType = HolidayManager.inMemoryCalendarSettings.get(formattedDate);
    if (inMemType) {
      if (inMemType === 'HOLIDAY_NON_WORKABLE') return 'NON_WORKABLE';
      if (inMemType === 'HOLIDAY_WORKABLE') return 'WORKABLE';
      if (inMemType === 'WEEKDAY' || inMemType === 'SATURDAY_WORKABLE' || inMemType === 'SUNDAY_WORKABLE') {
        return null; // Anula festivo o especifica día laborable
      }
    }

    // 3. Fallback estático
    return HolidayManager.HOLIDAYS[formattedDate] || null;
  }
}

