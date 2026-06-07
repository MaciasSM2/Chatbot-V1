import { dbPool } from '../../infrastructure/database/MySQLConnection';
import { DayType, GreetingTemplate, TimePeriod, GreetingCategory } from "../../core/entities/GreetingTemplate";
import { IGreetingRepository } from "../../core/interfaces/repositories/IGreetingRepository";
import logger from "../../infrastructure/logging/Logger";

export class MySQLGreetingRepository implements IGreetingRepository {
  constructor(private readonly legacyDbPool?: any) {}

  async getTemplates(dayType: DayType, timePeriod: TimePeriod, category: GreetingCategory = 'RESPONSE'): Promise<GreetingTemplate[]> {
    try {
      const activePool = this.legacyDbPool || dbPool;
      const [rows]: any = await activePool.query(
        'SELECT id, day_type, time_period, text, category FROM greeting_templates WHERE day_type = ? AND time_period = ? AND category = ?',
        [dayType, timePeriod, category]
      );
      return rows.map((row: any) => new GreetingTemplate(
        row.id, 
        row.day_type as DayType, 
        row.time_period as TimePeriod, 
        row.text,
        row.category as GreetingCategory
      ));
    } catch (err) {
      logger.warn("[DB] getTemplates falló (modo demo)", { error: (err as Error).message });
      return [];
    }
  }

  async getAll(): Promise<GreetingTemplate[]> {
    try {
      const activePool = this.legacyDbPool || dbPool;
      const [rows]: any = await activePool.query('SELECT id, day_type, time_period, text, category FROM greeting_templates');
      return rows.map((row: any) => new GreetingTemplate(
        row.id, 
        row.day_type as DayType, 
        row.time_period as TimePeriod, 
        row.text,
        row.category as GreetingCategory
      ));
    } catch (err) {
      logger.warn("[DB] getAll falló (modo demo)", { error: (err as Error).message });
      return [];
    }
  }

  async findByContext(dayType: string, period: string, category: string): Promise<any | null> {
    try {
      const activePool = this.legacyDbPool || dbPool;
      const [rows]: any = await activePool.query(
        'SELECT * FROM greeting_templates WHERE day_type = ? AND time_period = ? AND category = ?',
        [dayType, period, category]
      );
      return rows[0] || null;
    } catch (err) {
      return null;
    }
  }

  async save(template: GreetingTemplate): Promise<void> {
    try {
      const activePool = this.legacyDbPool || dbPool;
      await activePool.query(
        'INSERT INTO greeting_templates (id, day_type, time_period, text, category) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE day_type = VALUES(day_type), time_period = VALUES(time_period), text = VALUES(text), category = VALUES(category)',
        [template.id, template.dayType, template.timePeriod, template.text, template.category]
      );
    } catch (err) {
      logger.warn("[DB] save greeting falló (modo demo)", { error: (err as Error).message });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const activePool = this.legacyDbPool || dbPool;
      await activePool.query('DELETE FROM greeting_templates WHERE id = ?', [id]);
    } catch (err) {
      logger.warn("[DB] delete greeting falló (modo demo)", { error: (err as Error).message });
    }
  }
}
