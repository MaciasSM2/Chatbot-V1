import { Pool } from "pg";
import { DayType, TimePeriod } from "../entities/GreetingTemplate";
import { HolidayManager } from "./HolidayManager";

export class DateTimeManager {
  constructor(
    private readonly holidayManager: HolidayManager,
    private readonly dbPool?: Pool
  ) {}

  public async getDayType(date: Date): Promise<DayType> {
    // Obtenemos la fecha en formato local YYYY-MM-DD restando el offset de zona horaria
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const formattedDate = localDate.toISOString().split('T')[0] || '';

    // 1. Prioridad 1: Configuración específica en base de datos (calendar_settings)
    if (this.dbPool) {
      try {
        const res = await this.dbPool.query(
          "SELECT day_type FROM calendar_settings WHERE date = $1",
          [formattedDate]
        );
        if (res.rows.length > 0) {
          return res.rows[0].day_type as DayType;
        }
      } catch (err) {
        // Fallback silencioso a comportamiento por defecto en caso de error
      }
    }

    // 1.5. Prioridad 1.5: Configuración en memoria (Modo Demo)
    const inMemType = HolidayManager.inMemoryCalendarSettings.get(formattedDate);
    if (inMemType) {
      return inMemType;
    }

    // 2. Prioridad 2: Motor de Festivos (HolidayManager)
    const holidayStatus = await this.holidayManager.getHolidayStatus(date);
    if (holidayStatus === 'WORKABLE') {
      return 'HOLIDAY_WORKABLE';
    } else if (holidayStatus === 'NON_WORKABLE') {
      return 'HOLIDAY_NON_WORKABLE';
    }

    // 3. Prioridad 3: Configuración por defecto para fines de semana
    const day = date.getDay();
    if (day === 6) {
      return 'SATURDAY_WORKABLE';
    }
    if (day === 0) {
      return 'SUNDAY_WORKABLE';
    }

    return 'WEEKDAY';
  }

  public getTimePeriod(date: Date): TimePeriod {
    const hour = date.getHours();
    if (hour >= 6 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 19) return 'AFTERNOON';
    return 'NIGHT';
  }

  public async isWithinWorkingHours(date: Date): Promise<boolean> {
    let startStr = "08:00";
    let endStr = "18:00";
    let workingDays = [1, 2, 3, 4, 5]; // Lunes a Viernes por defecto

    if (this.dbPool) {
      try {
        const res = await this.dbPool.query("SELECT value FROM global_settings WHERE key = 'schedule'");
        if (res.rows.length > 0) {
          const config = res.rows[0].value;
          startStr = config.work_hours_start ?? startStr;
          endStr = config.work_hours_end ?? endStr;
          workingDays = config.working_days ?? workingDays;
        }
      } catch (err) {
        // Fallback silencioso en caso de error de BD
      }
    }

    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    if (!workingDays.includes(dayOfWeek)) {
      return false; // No laborable
    }

    const startParts = startStr.split(':').map(Number);
    const endParts = endStr.split(':').map(Number);
    const startHour = startParts[0] ?? 8;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 18;
    const endMin = endParts[1] ?? 0;

    const currentHour = date.getHours();
    const currentMin = date.getMinutes();

    const startMinutesTotal = startHour * 60 + startMin;
    const endMinutesTotal = endHour * 60 + endMin;
    const currentMinutesTotal = currentHour * 60 + currentMin;

    return currentMinutesTotal >= startMinutesTotal && currentMinutesTotal < endMinutesTotal;
  }
}


