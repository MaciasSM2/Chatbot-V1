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
    console.warn('⚠️ [DB Test Guard] MariaDB no disponible para pruebas webhook-flow:', err.message);
    isDbConnected = false;
  }
});

afterAll(async () => {
  if (dbPool && isDbConnected) {
    await dbPool.end();
  }
});

describe('Webhook Flow — End-to-End Data Path', () => {
  test('messages table accepts incoming webhook payload shape', async () => {
    if (!isDbConnected) return;
    const testId = `wh-test-${Date.now()}`;
    const testPhone = `57300${Date.now()}`;

    await dbPool.query(
      `INSERT INTO mensajes (id, usuario_id, remitente, texto, estado) VALUES (?, ?, 'user', ?, 'sent')`,
      [testId, testPhone, 'Mensaje de prueba webhook']
    );

    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT * FROM mensajes WHERE id = ?',
      [testId]
    );
    expect(rows.length).toBe(1);
    expect(rows[0]?.remitente).toBe('user');
    expect(rows[0]?.texto).toBe('Mensaje de prueba webhook');

    await dbPool.query('DELETE FROM mensajes WHERE id = ?', [testId]);
  });

  test('sesiones_chat table tracks conversation state (FSM)', async () => {
    if (!isDbConnected) return;
    const testUser = `fsm-${Date.now()}`;

    await dbPool.query(
      `INSERT INTO sesiones_chat (usuario_id, paso_actual) VALUES (?, 'WELCOME')`,
      [testUser]
    );

    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT * FROM sesiones_chat WHERE usuario_id = ?',
      [testUser]
    );
    expect(rows.length).toBe(1);
    expect(rows[0]?.paso_actual).toBe('WELCOME');

    await dbPool.query('DELETE FROM sesiones_chat WHERE usuario_id = ?', [testUser]);
  });

  test('undelivered_meta_messages stores failed outbound', async () => {
    if (!isDbConnected) return;
    const testId = `undel-${Date.now()}`;

    await dbPool.query(
      `INSERT INTO undelivered_meta_messages (id, recipient_phone, message_text, retry_count, is_sent) VALUES (?, '573001234567', 'test fallback', 0, 0)`,
      [testId]
    );

    const [rows] = await dbPool.query<RowDataPacket[]>(
      'SELECT is_sent FROM undelivered_meta_messages WHERE id = ?',
      [testId]
    );
    expect(rows[0]?.is_sent).toBe(0);

    await dbPool.query('DELETE FROM undelivered_meta_messages WHERE id = ?', [testId]);
  });
});
