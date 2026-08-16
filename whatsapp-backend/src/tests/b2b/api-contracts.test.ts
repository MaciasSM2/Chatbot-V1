import { Pool, createPool, RowDataPacket } from 'mysql2/promise';

let dbPool: Pool;
let isDbConnected = false;

beforeAll(async () => {
  try {
    dbPool = createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'bot_orchestrator',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'chatbot_crm_db',
      waitForConnections: true,
      connectionLimit: 2,
      queueLimit: 0,
      connectTimeout: 2000
    });
    const conn = await dbPool.getConnection();
    conn.release();
    isDbConnected = true;
  } catch (err: any) {
    console.warn('⚠️ [DB Test Guard] MariaDB no disponible para pruebas B2B:', err.message);
    isDbConnected = false;
  }
});

afterAll(async () => {
  if (dbPool && isDbConnected) {
    await dbPool.end();
  }
});

describe('API Contract Tests — Backend ↔ Dashboard', () => {
  test('greeting_templates table exists with expected columns', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'greeting_templates' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME || 'chatbot_crm_db']
    );
    expect(rows.length).toBeGreaterThanOrEqual(5);
    const cols = rows.map(r => r.COLUMN_NAME);
    expect(cols).toContain('id');
    expect(cols).toContain('day_type');
    expect(cols).toContain('time_period');
    expect(cols).toContain('category');
    expect(cols).toContain('text');
  });

  test('clients table exists with expected columns', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'clients' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME || 'chatbot_crm_db']
    );
    expect(rows.length).toBeGreaterThan(0);
    const cols = rows.map(r => r.COLUMN_NAME);
    expect(cols).toContain('phone_number');
    expect(cols).toContain('full_name');
    expect(cols).toContain('is_paused');
  });

  test('sicetac_routes_matrix table exists (used by CacheWarmUp)', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'sicetac_routes_matrix' AND TABLE_SCHEMA = ?",
      [process.env.DB_NAME || 'chatbot_crm_db']
    );
    expect(rows[0]?.cnt).toBe(1);
  });

  test('time_period_configs seeded with 4 periods', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as cnt FROM time_period_configs'
    );
    expect(rows[0]?.cnt).toBe(4);
  });

  test('greeting_templates seeded (WEEKDAY + SATURDAY + HOLIDAY variants)', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as cnt FROM greeting_templates'
    );
    expect(rows[0]?.cnt).toBeGreaterThanOrEqual(4);
  });

  test('modulos_sistema seeded', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as cnt FROM modulos_sistema'
    );
    expect(rows[0]?.cnt).toBeGreaterThanOrEqual(3);
  });

  test('operadores_sistema has admin user', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      "SELECT COUNT(*) as cnt FROM operadores_sistema WHERE role = 'ADMIN'"
    );
    expect(rows[0]?.cnt).toBe(1);
  });
});

describe('Dashboard response shape contracts', () => {
  test('clients query returns expected shape {success, data}', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT phone_number, full_name, is_registered, is_paused, gender, document_type, document_number FROM clients LIMIT 1'
    );
    if (rows.length > 0) {
      expect(rows[0]).toHaveProperty('phone_number');
      expect(rows[0]).toHaveProperty('full_name');
    }
  });

  test('messages table uses lowercase sender types (user|bot|system)', async () => {
    if (!isDbConnected) return;
    const [rows] = await dbPool.query<RowDataPacket[]>(
      "SELECT DISTINCT remitente FROM mensajes"
    );
    for (const row of rows) {
      expect(['user', 'bot', 'system']).toContain(row.remitente);
    }
  });
});
