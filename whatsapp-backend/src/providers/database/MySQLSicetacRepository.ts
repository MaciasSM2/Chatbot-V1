import { Pool, RowDataPacket } from 'mysql2/promise';
import { ISicetacRepository, SicetacRoute } from '../../core/interfaces/repositories/ISicetacRepository';

export class MySQLSicetacRepository implements ISicetacRepository {
  constructor(private readonly pool: Pool) {}

  async getRouteCost(origin: string, destination: string): Promise<SicetacRoute | null> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT id, origin, destination, base_cost as baseCost, estimated_hours as estimatedHours 
       FROM sicetac_routes_matrix 
       WHERE UPPER(origin) = UPPER(?) AND UPPER(destination) = UPPER(?)`,
      [origin.trim(), destination.trim()]
    );

    return (rows[0] as SicetacRoute) || null;
  }
}
