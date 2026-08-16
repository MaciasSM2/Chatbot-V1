import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let isMockMode = false;
const inMemoryTables: Record<string, any[]> = {
  greeting_templates: [
    { id: 't1', day_type: 'WEEKDAY', time_period: 'MORNING', text: '¡Hola! Buenos días.', category: 'RESPONSE' },
    { id: 't2', day_type: 'WEEKDAY', time_period: 'AFTERNOON', text: '¡Hola! Buenas tardes.', category: 'RESPONSE' },
    { id: 't3', day_type: 'WEEKDAY', time_period: 'NIGHT', text: '¡Hola! Buenas noches.', category: 'RESPONSE' }
  ],
  modulos_sistema: [
    { id: 'dashboard_home', nombre: 'Área de Inicio (Gráficas)', activo: 1 },
    { id: 'module_clients', nombre: 'Gestión de Clientes', activo: 1 },
    { id: 'module_greetings', nombre: 'Motor de Saludos Dinámicos', activo: 1 }
  ],
  configuraciones_globales: [
    { clave: 'schedule', valor: '{"work_hours_start": "08:00", "work_hours_end": "18:00", "working_days": [1, 2, 3, 4, 5], "timezone": "America/Bogota"}' }
  ]
};

const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'chatbot_crm_db';

const realPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: dbUser,
  password: dbPass,
  database: dbName,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
});

// Autoverificación de base de datos
if (process.env.NODE_ENV !== 'test') {
  realPool.getConnection()
    .then((conn) => {
      console.log('✅ [MariaDB Pool] Conectado con éxito.');
      conn.release();
    })
    .catch((err) => {
      console.warn('⚠️ [MariaDB Pool] No se pudo conectar. Activando MODO IN-MEMORIA de respaldo:', err.message);
      isMockMode = true;
    });
} else {
  isMockMode = true;
}

// Mock connection object
const mockConnection = {
  release: () => {},
  beginTransaction: async () => {},
  commit: async () => {},
  rollback: async () => {},
  query: async (sql: string, _params?: any[]) => {
    return mockQuery(sql);
  },
  execute: async (sql: string, _params?: any[]) => {
    return mockQuery(sql);
  }
};

const mockQuery = (sql: string): [any[], any] => {
  const normalizedSql = sql.toLowerCase();
  
  if (normalizedSql.includes('greeting_templates') || normalizedSql.includes('plantillas_saludos')) {
    return [inMemoryTables.greeting_templates || [], null];
  }
  if (normalizedSql.includes('modulos_sistema')) {
    return [inMemoryTables.modulos_sistema || [], null];
  }
  if (normalizedSql.includes('configuraciones_globales')) {
    const val = inMemoryTables.configuraciones_globales ? inMemoryTables.configuraciones_globales[0] : null;
    return [val ? [val] : [], null];
  }
  
  return [[], null];
};

export const dbPool: any = new Proxy(realPool, {
  get(target, prop) {
    if (isMockMode) {
      if (prop === 'query' || prop === 'execute') {
        return async (sql: string, _params?: any[]) => {
          return mockQuery(sql);
        };
      }
      if (prop === 'getConnection') {
        return async () => mockConnection;
      }
    }
    return (target as any)[prop];
  }
});

export const checkDatabaseConnection = async () => {
  if (isMockMode) return true;
  try {
    const connection = await realPool.getConnection();
    connection.release();
    return true;
  } catch {
    return false;
  }
};
