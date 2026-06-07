/**
 * @file MySQLConnection.ts
 * @description Pool de conexiones optimizado para MariaDB.
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const dbPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'bot_orchestrator',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'bot_secure_password',
  database: process.env.DB_NAME || 'chatbot_crm_db',
  waitForConnections: true,
  connectionLimit: 15, // Capacidad de concurrencia intermedia
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: 'utf8mb4'
});

// Manejador de errores para evitar caídas del proceso por pérdida de conexiones inactivas
(dbPool as any).on('error', (err: any) => {
  console.error('🚨 [MariaDB Pool Error] Error inesperado en conexión inactiva:', err);
});

// Autoverificación inmediata en el arranque del Backend
if (process.env.NODE_ENV !== 'test') {
  dbPool.getConnection()
    .then((connection) => {
      console.log('✅ [MariaDB Pool] Conexión establecida y mapeada con éxito en el puerto 3306.');
      connection.release();
    })
    .catch((error) => {
      console.error('❌ [MariaDB Pool Error] No se pudo conectar al contenedor de base de datos:', error.message);
    });
}

export const checkDatabaseConnection = async () => {
  try {
    const connection = await dbPool.getConnection();
    connection.release();
    return true;
  } catch (error) {
    return false;
  }
};
