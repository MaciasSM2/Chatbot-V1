import mysql from 'mysql2/promise';

async function testConnection() {
  console.log('📡 Probando conexión a MySQL (127.0.0.1:3306, usuario: root, sin contraseña)...');
  try {
    // Intentar conectar sin especificar base de datos inicialmente
    const connection: any = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
    });

    console.log('✅ Conexión básica exitosa.');

    // Crear la base de datos si no existe
    await connection.query('CREATE DATABASE IF NOT EXISTS chatbot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;');
    console.log('✅ Base de datos "chatbot_db" verificada/creada.');

    await connection.end();

    // Intentar conectar directamente a la base de datos
    const dbConnection: any = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'chatbot_db',
    });
    console.log('✅ Conexión a "chatbot_db" establecida con éxito.');
    await dbConnection.end();

    console.log('🎉 ¡Todas las pruebas de conexión a MySQL fueron exitosas!');
  } catch (error) {
    console.error('❌ Error de conexión a MySQL:', error);
  }
}

testConnection();
