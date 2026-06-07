/**
 * @file IHolidayProvider.ts
 * @description Contrato abstracto para los proveedores de cálculo de calendarios civiles.
 * Aplica el principio de Segregación de Interfaces (SOLID - I).
 */
export interface HolidayDetails {
  date: string; // Formato YYYY-MM-DD
  label: string;
}

export interface IHolidayProvider {
  /**
   * Determina de forma abstracta si una fecha específica corresponde a un día no hábil regulado.
   * @param date Objeto Date a evaluar.
   * @returns Promesa con un booleano indicador de festivo.
   */
  isHoliday(date: Date): Promise<boolean>;

  /**
   * Determina de forma síncrona si una fecha específica corresponde a un festivo.
   */
  isHolidaySync?(date: Date): boolean;

  /**
   * Obtiene la lista consolidada de festivos para un año específico.
   * @param year Año a evaluar
   */
  getHolidaysByYear(year: number): Promise<HolidayDetails[]>;
}
