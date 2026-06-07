/**
 * @file ColombiaHolidayProvider.ts
 * @description Implementación matemática autónoma para el cálculo de festivos en Colombia.
 * Encapsula el Algoritmo de Gauss para Pascua y las reglas operativas de la Ley Emiliani.
 */
import { IHolidayProvider, HolidayDetails } from '../../core/interfaces/providers/IHolidayProvider';

export class ColombiaHolidayProvider implements IHolidayProvider {
  
  // Lista inmutable de festivos fijos en Colombia (Mes - Día)
  private readonly FIXED_HOLIDAYS = [
    { month: 0, day: 1, label: 'Año Nuevo' },              // Año Nuevo (1 de Enero)
    { month: 4, day: 1, label: 'Día del Trabajo' },         // Día del Trabajo (1 de Mayo)
    { month: 6, day: 20, label: 'Grito de Independencia' }, // Grito de Independencia (20 de Julio)
    { month: 7, day: 7, label: 'Batalla de Boyacá' },       // Batalla de Boyacá (7 de Agosto)
    { month: 11, day: 8, label: 'Inmaculada Concepción' },  // Inmaculada Concepción (8 de Diciembre)
    { month: 11, day: 25, label: 'Navidad' },               // Navidad (25 de Diciembre)
  ];

  // Festivos que se trasladan al siguiente lunes bajo la Ley Emiliani (Mes - Día)
  private readonly MOVABLE_HOLIDAYS = [
    { month: 0, day: 6, label: 'Reyes Magos' },                  // Reyes Magos (6 de Enero)
    { month: 2, day: 19, label: 'San José' },                   // San José (19 de Marzo)
    { month: 5, day: 29, label: 'San Pedro y San Pablo' },       // San Pedro y San Pablo (29 de Junio)
    { month: 7, day: 15, label: 'Asunción de la Virgen' },       // Asunción de la Virgen (15 de Agosto)
    { month: 9, day: 12, label: 'Día de la Raza' },              // Día de la Raza (12 de Octubre)
    { month: 10, day: 1, label: 'Todos los Santos' },            // Todos los Santos (1 de Noviembre)
    { month: 10, day: 11, label: 'Independencia de Cartagena' }, // Independencia de Cartagena (11 de Noviembre)
  ];

  /**
   * Determina de forma síncrona si la fecha es festiva.
   */
  public isHolidaySync(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // 1. Validar si coincide con un festivo de fecha fija nacional
    const isFixed = this.FIXED_HOLIDAYS.some(h => h.month === month && h.day === day);
    if (isFixed) return true;

    // 2. Calcular las fechas móviles de la Semana Santa del año en curso (Algoritmo de Gauss)
    const easterDate = this.calculateEaster(year);
    
    if (this.isEasterHoliday(date, easterDate)) return true;

    // 3. Validar si coincide con un festivo sujeto a la Ley Emiliani
    return this.isMovableHoliday(year, month, day);
  }

  /**
   * Determina de forma asíncrona si una fecha específica corresponde a un festivo.
   */
  public async isHoliday(date: Date): Promise<boolean> {
    return this.isHolidaySync(date);
  }

  /**
   * Obtiene la lista consolidada de festivos para un año específico.
   * @param year Año a evaluar
   */
  public async getHolidaysByYear(year: number): Promise<HolidayDetails[]> {
    const holidays: HolidayDetails[] = [];
    const easter = this.calculateEaster(year);

    // --- FESTIVOS FIJOS ---
    this.FIXED_HOLIDAYS.forEach(h => {
      const monthStr = String(h.month + 1).padStart(2, '0');
      const dayStr = String(h.day).padStart(2, '0');
      holidays.push({ date: `${year}-${monthStr}-${dayStr}`, label: h.label });
    });

    // --- FESTIVOS LEY EMILIANI ---
    this.MOVABLE_HOLIDAYS.forEach(h => {
      const calculated = this.moveToNextMonday(new Date(year, h.month, h.day));
      holidays.push({ date: this.formatDate(calculated), label: h.label });
    });

    // --- FESTIVOS MÓVILES RESPECTO A PASCUA ---
    // Jueves Santo (Pascua - 3 días)
    const juevesSanto = new Date(easter.getTime());
    juevesSanto.setDate(easter.getDate() - 3);
    holidays.push({ date: this.formatDate(juevesSanto), label: 'Jueves Santo' });

    // Viernes Santo (Pascua - 2 días)
    const viernesSanto = new Date(easter.getTime());
    viernesSanto.setDate(easter.getDate() - 2);
    holidays.push({ date: this.formatDate(viernesSanto), label: 'Viernes Santo' });

    // Festivos móviles eclesiásticos trasladados al siguiente lunes por Ley Emiliani
    const ascension = this.moveToNextMonday(this.addDays(easter, 39));
    const corpusChristi = this.moveToNextMonday(this.addDays(easter, 60));
    const sagradoCorazon = this.moveToNextMonday(this.addDays(easter, 68));

    holidays.push({ date: this.formatDate(ascension), label: 'Ascensión del Señor' });
    holidays.push({ date: this.formatDate(corpusChristi), label: 'Corpus Christi' });
    holidays.push({ date: this.formatDate(sagradoCorazon), label: 'Sagrado Corazón de Jesús' });

    return holidays;
  }

  /**
   * Implementación pura del Algoritmo de Gauss para calcular el Domingo de Resurrección.
   */
  private calculateEaster(year: number): Date {
    const a = year % 19;
    const b = year % 4;
    const c = year % 7;
    const d = (19 * a + 24) % 30;
    const e = (2 * b + 4 * c + 6 * d + 5) % 7;
    const day = 22 + d + e;

    if (day > 31) {
      const aprilDay = day - 31;
      // Casos especiales del algoritmo
      if (aprilDay === 26) return new Date(year, 3, 19);
      if (aprilDay === 25 && d === 28 && a > 10) return new Date(year, 3, 18);
      return new Date(year, 3, aprilDay);
    }
    return new Date(year, 2, day);
  }

  private isEasterHoliday(target: Date, easter: Date): boolean {
    const targetTime = new Date(target).setHours(0,0,0,0);

    // Fechas eclesiásticas exactas desplazadas en días con respecto a Pascua
    const juevesSanto = new Date(easter.getTime()); juevesSanto.setDate(easter.getDate() - 3);
    const viernesSanto = new Date(easter.getTime()); viernesSanto.setDate(easter.getDate() - 2);
    
    // Festivos móviles eclesiásticos trasladados al siguiente lunes por Ley Emiliani
    const ascension = this.moveToNextMonday(this.addDays(easter, 39));
    const corpusChristi = this.moveToNextMonday(this.addDays(easter, 60));
    const sagradoCorazon = this.moveToNextMonday(this.addDays(easter, 68));

    const holidaysTimeline = [
      juevesSanto.setHours(0,0,0,0),
      viernesSanto.setHours(0,0,0,0),
      ascension.setHours(0,0,0,0),
      corpusChristi.setHours(0,0,0,0),
      sagradoCorazon.setHours(0,0,0,0)
    ];

    return holidaysTimeline.includes(targetTime);
  }

  private isMovableHoliday(year: number, month: number, day: number): boolean {
    for (const holiday of this.MOVABLE_HOLIDAYS) {
      const originalDate = new Date(year, holiday.month, holiday.day);
      const computedMonday = this.moveToNextMonday(originalDate);

      if (computedMonday.getMonth() === month && computedMonday.getDate() === day) {
        return true;
      }
    }
    return false;
  }

  private moveToNextMonday(date: Date): Date {
    const dayOfWeek = date.getDay(); // 0 = Domingo, 1 = Lunes...
    const result = new Date(date.getTime());
    
    if (dayOfWeek === 0) {
      result.setDate(date.getDate() + 1); // Pasa al lunes
    } else if (dayOfWeek > 1) {
      result.setDate(date.getDate() + (8 - dayOfWeek)); // Pasa al lunes de la semana siguiente
    }
    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
