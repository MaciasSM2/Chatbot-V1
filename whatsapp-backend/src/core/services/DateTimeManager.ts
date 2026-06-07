import { DayType, TimePeriod } from "../entities/GreetingTemplate";
import { HolidayManager } from "./HolidayManager";
import { MySQLTimeRepository, TimePeriodRow } from "../../providers/database/MySQLTimeRepository";

export class DateTimeManager {
  public static forcedHour: number | null = null;
  public static forcedDayType: DayType | undefined = undefined;
  public static forcedTimePeriod: TimePeriod | undefined = undefined;
  private timeRepo?: MySQLTimeRepository;
  public activePeriods: TimePeriodRow[] = [];

  constructor(
    private readonly holidayManager: HolidayManager,
    private readonly dbPool?: any
  ) {
    if (this.dbPool) {
      this.timeRepo = new MySQLTimeRepository(this.dbPool);
    }
    // Defaults en caso de que la BD falle
    this.activePeriods = [
      { id: 'EARLY_MORNING', label: 'Madrugada', startHour: 1, endHour: 6, color: '#6366f1' },
      { id: 'MORNING', label: 'Mañana', startHour: 6, endHour: 12, color: '#10b981' },
      { id: 'AFTERNOON', label: 'Tarde', startHour: 12, endHour: 19, color: '#f59e0b' },
      { id: 'NIGHT', label: 'Noche', startHour: 19, endHour: 1, color: '#1e293b' }
    ];
  }

  public async getDayType(date: Date): Promise<DayType> {
    if (DateTimeManager.forcedDayType) {
      return DateTimeManager.forcedDayType;
    }
    // En modo local, Node usa el reloj de tu PC sin desfases
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayOfMonth}`;

    // 1. Prioridad 1: Configuración específica en base de datos (configuraciones_calendario)
    if (this.dbPool) {
      try {
        const [rows]: any = await this.dbPool.query(
          "SELECT tipo_dia as day_type FROM configuraciones_calendario WHERE fecha = ?",
          [formattedDate]
        );
        if (rows.length > 0) {
          return rows[0].day_type as DayType;
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

  /**
   * Carga las franjas horarias dinámicas desde la base de datos a la caché en memoria.
   */
  public async loadTimePeriodsConfig(): Promise<void> {
    if (!this.timeRepo) return;
    try {
      const periods = await this.timeRepo.getActiveTimePeriods();
      if (periods.length > 0) {
        this.activePeriods = periods;
      }
    } catch (err) {
      // Fallback silencioso
    }
  }

  public async getTimePeriodsFromDb(): Promise<TimePeriodRow[]> {
    if (!this.timeRepo) return this.activePeriods;
    const periods = await this.timeRepo.getActiveTimePeriods();
    return periods.length > 0 ? periods : this.activePeriods;
  }

  public async updateTimePeriodInDb(id: string, start: number, end: number): Promise<void> {
    if (!this.timeRepo) return;
    await this.timeRepo.updateTimePeriod(id, start, end);
    await this.loadTimePeriodsConfig();
  }


  public getTimePeriod(date: Date): TimePeriod {
    if (DateTimeManager.forcedTimePeriod) {
      return DateTimeManager.forcedTimePeriod;
    }
    const currentHour = DateTimeManager.forcedHour !== null ? DateTimeManager.forcedHour : date.getHours();
    
    const period = this.activePeriods.find(p => {
      if (p.startHour > p.endHour) { // Cruza medianoche
        return currentHour >= p.startHour || currentHour < p.endHour;
      }
      return currentHour >= p.startHour && currentHour < p.endHour;
    });

    return (period?.id as TimePeriod) || 'NIGHT';
  }

  public async isWithinWorkingHours(date: Date): Promise<boolean> {
    let startStr = "08:00";
    let endStr = "18:00";
    let workingDays = [1, 2, 3, 4, 5]; // Lunes a Viernes por defecto

    if (this.dbPool) {
      try {
        const [rows]: any = await this.dbPool.query("SELECT valor as value FROM configuraciones_globales WHERE clave = 'schedule'");
        if (rows.length > 0) {
          const config = rows[0].value;
          startStr = config.work_hours_start ?? startStr;
          endStr = config.work_hours_end ?? endStr;
          workingDays = config.working_days ?? workingDays;
        }
      } catch (err) {
        // Fallback silencioso en caso de error de BD
      }
    }

    const dayOfWeek = date.getDay(); // 0 = Domingo, ..., 6 = Sábado
    
    if (!workingDays.includes(dayOfWeek)) {
      return false; // No laborable
    }

    const startParts = startStr.split(':').map(Number);
    const endParts = endStr.split(':').map(Number);
    const startHour = startParts[0] ?? 8;
    const startMin = startParts[1] ?? 0;
    const endHour = endParts[0] ?? 18;
    const endMin = endParts[1] ?? 0;

    const currentHour = DateTimeManager.forcedHour !== null ? DateTimeManager.forcedHour : date.getHours();
    const currentMin = date.getMinutes();

    const startMinutesTotal = startHour * 60 + startMin;
    const endMinutesTotal = endHour * 60 + endMin;
    const currentMinutesTotal = currentHour * 60 + currentMin;

    return currentMinutesTotal >= startMinutesTotal && currentMinutesTotal < endMinutesTotal;
  }

  /**
   * Obtiene la fecha y hora actual ajustada de forma nativa al huso horario de Colombia (Bogotá/Medellín).
   */
  public getColombiaCurrentDate(): Date {
    const targetTimeZone = 'America/Bogota';
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimeZone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    
    return new Date(formatter.format(new Date()));
  }

  /**
   * Valida si el mensaje entrante del chat se encuentra dentro del rango operativo de la empresa.
   * @param startHour String de hora de apertura en formato militar (Ej: "07:30")
   * @param endHour String de hora de cierre en formato militar (Ej: "19:00")
   * @returns Booleano indicando disponibilidad de atención directa.
   */
  public isWithinBusinessHours(startHour: string, endHour: string): boolean {
    const now = this.getColombiaCurrentDate();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Desestructuración y parseo rápido de strings directos (Condición 3)
    const [startH, startM] = startHour.split(':').map(Number);
    const [endH, endM] = endHour.split(':').map(Number);

    // Caída segura si el cliente final corrompió el string en la base de datos
    if (isNaN(startH!) || isNaN(startM!) || isNaN(endH!) || isNaN(endM!)) {
      console.error(`🚨 [DateTimeManager] Error de parsing en formato de horas: ${startHour} - ${endHour}. Forzando bypass true.`);
      return true; 
    }

    const startMinutes = startH! * 60 + startM!;
    const endMinutes = endH! * 60 + endM!;

    // Evaluación aritmética lineal instantánea
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}
