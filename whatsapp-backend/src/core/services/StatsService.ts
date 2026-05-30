/**
 * @file StatsService.ts
 * @description Ejecuta consultas de agregación para el panel de control.
 */

export class StatsService {
  constructor(private readonly db: any) {}

  public async getSummary() {
    // 1. Mensajes enviados por día (últimos 7 días)
    const messagesByDay = await this.db.query(`
      SELECT TO_CHAR(timestamp, 'DD/MM') as date, 
             COUNT(*) FILTER (WHERE sender = 'bot') as bot_msgs,
             COUNT(*) FILTER (WHERE sender = 'user') as user_msgs
      FROM messages
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY date ORDER BY date ASC;
    `);

    // 2. Tasa de éxito de la API de Meta (para detectar errores inyectados)
    const errorRate = await this.db.query(`
      SELECT status, COUNT(*) as count
      FROM messages
      WHERE sender = 'bot' AND timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY status;
    `);

    // 3. Clientes nuevos vs existentes
    const clientSummary = await this.db.query(`
      SELECT is_registered, COUNT(*) as count
      FROM clients GROUP BY is_registered;
    `);

    return {
      history: messagesByDay.rows,
      errors: errorRate.rows,
      clients: clientSummary.rows
    };
  }
}
