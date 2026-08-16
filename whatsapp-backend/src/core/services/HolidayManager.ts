/**
 * @file HolidayManager.ts
 * @description Componente de dominio que orquesta las excepciones y la sincronización con MariaDB.
 */
import { DayType } from "../entities/GreetingTemplate";
import { IHolidayProvider } from '../../core/interfaces/providers/IHolidayProvider';
import { dbPool } from '../../infrastructure/database/MySQLConnection';

export type HolidayStatus = 'WORKABLE' | 'NON_WORKABLE';

export class HolidayManager {
  public static readonly inMemoryCalendarSettings = new Map<string, DayType>();
  private inMemoryHolidays: Set<string> = new Set();
  private holidayTypes: Map<string, 'HOLIDAY' | 'ADMIN_CLOSE' | 'WORKABLE_SPECIAL'> = new Map();

  private static readonly HOLIDAYS: Record<string, HolidayStatus> = {
    '2024-12-25': 'NON_WORKABLE',
    '2025-01-01': 'NON_WORKABLE',
    '2026-01-01': 'NON_WORKABLE',
    '2026-05-22': 'WORKABLE',
    '2026-12-25': 'NON_WORKABLE',
    '2027-01-01': 'NON_WORKABLE',
    '2027-12-25': 'NON_WORKABLE',
    '2028-01-01': 'NON_WORKABLE',
    '2028-12-25': 'NON_WORKABLE',
    '2029-01-01': 'NON_WORKABLE',
    '2029-12-25': 'NON_WORKABLE',
    '2030-01-01': 'NON_WORKABLE',
    '2030-12-25': 'NON_WORKABLE',
  };

  private readonly holidayProvider?: IHolidayProvider;
  private readonly localDbPool?: any;

  constructor(
    providerOrPool?: IHolidayProvider | any,
    localDbPool?: any
  ) {
    if (providerOrPool && (typeof providerOrPool.isHoliday === 'function' || typeof providerOrPool.getHolidaysByYear === 'function')) {
      this.holidayProvider = providerOrPool;
      this.localDbPool = localDbPool;
    } else {
      this.localDbPool = providerOrPool;
    }
  }

  /**
   * Carga los festivos en memoria para respuesta instantánea
   */
  async loadHolidays() {
    const activePool = this.localDbPool || dbPool;
    try {
      const [rows]: any = await activePool.query('SELECT exception_date, type FROM holiday_exceptions');
      this.inMemoryHolidays = new Set(rows.map((r: any) => {
        const d = new Date(r.exception_date);
        const formatted = d.toISOString().split('T')[0] || '';
        this.holidayTypes.set(formatted, r.type);
        return formatted;
      }));
      console.log(`📅 [HolidayManager] ${this.inMemoryHolidays.size} festivos cargados.`);
    } catch (err) {
      console.error('⚠️ [HolidayManager] Error al cargar festivos de DB:', err);
    }
  }

  /**
   * Sincroniza dinámicamente MariaDB y la caché para cualquier año en transición.
   */
  public async syncHolidaysForYear(year: number): Promise<void> {
    try {
      if (!this.holidayProvider || typeof this.holidayProvider.getHolidaysByYear !== 'function') {
        throw new Error('Holiday provider not configured or does not support yearly holiday list extraction');
      }
      const targetHolidays = await this.holidayProvider.getHolidaysByYear(year);

      const activePool = this.localDbPool || dbPool;
      for (const holiday of targetHolidays) {
        await activePool.query(
          `INSERT INTO holiday_exceptions (exception_date, label, type) 
           VALUES (?, ?, 'HOLIDAY') 
           ON DUPLICATE KEY UPDATE label = VALUES(label)`,
          [holiday.date, holiday.label]
        );
      }

      await this.loadHolidays();
      console.log(`✅ [HolidayManager] Sincronización exitosa. Caché actualizada con ${this.inMemoryHolidays.size} registros.`);
    } catch (error) {
      console.error('❌ [HolidayManager] Error catastrófico durante la sincronización:', error);
      throw error;
    }
  }

  /**
   * Verifica de forma síncrona si una fecha específica es festiva o no laborable
   */
  isHoliday(date: Date): boolean {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0] || '';
    
    // 1. Prioridad: Overrides en MariaDB exception table
    if (this.inMemoryHolidays.has(dateStr)) {
      const type = this.holidayTypes.get(dateStr);
      if (type === 'HOLIDAY' || type === 'ADMIN_CLOSE') return true;
      if (type === 'WORKABLE_SPECIAL') return false;
      return true;
    }

    // 2. Prioridad: Ajustes temporales en memoria
    const inMemType = HolidayManager.inMemoryCalendarSettings.get(dateStr);
    if (inMemType) {
      if (inMemType === 'HOLIDAY_NON_WORKABLE') return true;
      if (inMemType === 'HOLIDAY_WORKABLE') return false;
    }

    // 3. Prioridad: Algoritmo autónomo
    if (this.holidayProvider && typeof this.holidayProvider.isHolidaySync === 'function') {
      return this.holidayProvider.isHolidaySync(date);
    }

    return HolidayManager.HOLIDAYS[dateStr] === 'NON_WORKABLE';
  }

  /**
   * Returns 'WORKABLE', 'NON_WORKABLE', or null if the date is not a holiday.
   * @param date Date to check
   */
  public async getHolidayStatus(date: Date): Promise<HolidayStatus | null> {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    const formattedDate = localDate.toISOString().split('T')[0] || '';
    
    // 1. Prioridad 1: Configuración en holiday_exceptions (MariaDB)
    if (this.inMemoryHolidays.has(formattedDate)) {
      const dbType = this.holidayTypes.get(formattedDate);
      if (dbType === 'HOLIDAY' || dbType === 'ADMIN_CLOSE') return 'NON_WORKABLE';
      if (dbType === 'WORKABLE_SPECIAL') return 'WORKABLE';
    }

    // 2. Prioridad 2: Configuración en configuraciones_calendario (Anteriores)
    if (this.localDbPool) {
      try {
        const [rows]: any = await this.localDbPool.query(
          "SELECT tipo_dia as day_type FROM configuraciones_calendario WHERE fecha = ?",
          [formattedDate]
        );
        if (rows.length > 0) {
          const type = rows[0].day_type as DayType;
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

    // 3. Prioridad 3: En memoria (Modo Demo)
    const inMemType = HolidayManager.inMemoryCalendarSettings.get(formattedDate);
    if (inMemType) {
      if (inMemType === 'HOLIDAY_NON_WORKABLE') return 'NON_WORKABLE';
      if (inMemType === 'HOLIDAY_WORKABLE') return 'WORKABLE';
      if (inMemType === 'WEEKDAY' || inMemType === 'SATURDAY_WORKABLE' || inMemType === 'SUNDAY_WORKABLE') {
        return null; // Anula festivo o especifica día laborable
      }
    }

    // 4. Prioridad 4: Abstracción polimórfica (Algoritmo autónomo de festivos)
    if (this.holidayProvider) {
      const isProvHoliday = await this.holidayProvider.isHoliday(date);
      if (isProvHoliday) {
        return 'NON_WORKABLE';
      }
    }

    // 5. Fallback estático
    return HolidayManager.HOLIDAYS[formattedDate] || null;
  }
}
