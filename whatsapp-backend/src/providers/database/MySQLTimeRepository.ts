import { dbPool } from '../../infrastructure/database/MySQLConnection';
import logger from "../../infrastructure/logging/Logger";

export interface TimePeriodRow {
    id: string;
    label: string;
    startHour: number;
    endHour: number;
    color: string;
}

export class MySQLTimeRepository {
    constructor(private readonly legacyPool?: any) {}

    public async getActiveTimePeriods(): Promise<TimePeriodRow[]> {
        try {
            const activePool = this.legacyPool || dbPool;
            const query = `
                SELECT id, label, start_hour as startHour, end_hour as endHour, color 
                FROM time_period_configs 
                ORDER BY start_hour ASC
            `;
            const [rows]: any = await activePool.query(query);
            return rows;
        } catch (err) {
            logger.error("[DB] Error en getActiveTimePeriods", { error: err instanceof Error ? err.message : String(err) });
            return [];
        }
    }

    public async updateTimePeriod(id: string, start: number, end: number): Promise<void> {
        try {
            const activePool = this.legacyPool || dbPool;
            const query = `
                UPDATE time_period_configs 
                SET start_hour = ?, end_hour = ? 
                WHERE id = ?
            `;
            await activePool.query(query, [start, end, id]);
        } catch (err) {
            logger.error(`[DB] Error en updateTimePeriod para ${id}`, { error: err instanceof Error ? err.message : String(err) });
            throw err;
        }
    }
}
