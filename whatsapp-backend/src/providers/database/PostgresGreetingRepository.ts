import { Pool } from "pg";
import { DayType, GreetingTemplate, TimePeriod, GreetingCategory } from "../../core/entities/GreetingTemplate";
import { IGreetingRepository } from "../../core/interfaces/repositories/IGreetingRepository";
import logger from "../../infrastructure/logging/Logger";

export class PostgresGreetingRepository implements IGreetingRepository {
  constructor(private readonly dbPool: Pool) {}

  async getTemplates(dayType: DayType, timePeriod: TimePeriod, category: GreetingCategory = 'RESPONSE'): Promise<GreetingTemplate[]> {
    try {
      const res = await this.dbPool.query(
        'SELECT id, day_type, time_period, text, category FROM greeting_templates WHERE day_type = $1 AND time_period = $2 AND category = $3',
        [dayType, timePeriod, category]
      );
      return res.rows.map(row => new GreetingTemplate(
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
      const res = await this.dbPool.query('SELECT id, day_type, time_period, text, category FROM greeting_templates');
      return res.rows.map(row => new GreetingTemplate(
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

  async save(template: GreetingTemplate): Promise<void> {
    try {
      await this.dbPool.query(
        'INSERT INTO greeting_templates (id, day_type, time_period, text, category) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET day_type = $2, time_period = $3, text = $4, category = $5',
        [template.id, template.dayType, template.timePeriod, template.text, template.category]
      );
    } catch (err) {
      logger.warn("[DB] save greeting falló (modo demo)", { error: (err as Error).message });
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.dbPool.query('DELETE FROM greeting_templates WHERE id = $1', [id]);
    } catch (err) {
      logger.warn("[DB] delete greeting falló (modo demo)", { error: (err as Error).message });
    }
  }
}

