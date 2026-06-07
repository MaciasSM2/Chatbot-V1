import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

async function importDatabase() {
  console.log('🚀 Iniciando importación de base_datos_espanol.sql a MySQL...');
  try {
    const connection: any = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'chatbot_db',
      multipleStatements: true, // Permitir múltiples statements
    });

    const sqlPath = path.join(__dirname, '../base_datos_espanol.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo SQL en: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // MySQL no soporta JSONB, lo reemplazamos por JSON
    // MySQL no soporta gen_random_uuid(), usamos UUID() o un helper de trigger.
    // Pero para simplificar la compatibilidad del tipo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    // en MySQL podemos usar VARCHAR(36) y generar UUIDs en la aplicación, o usar un default alternativo.
    // Vamos a ajustar el contenido del SQL para MySQL.
    let mysqlCompatibleSql = sqlContent
      .replace(/JSONB/g, 'JSON')
      .replace(/DEFAULT gen_random_uuid\(\)/g, '')
      .replace(/UUID PRIMARY KEY/g, 'VARCHAR(36) PRIMARY KEY');

    await connection.query(mysqlCompatibleSql);
    console.log('✅ Importación exitosa de todas las tablas y datos semilla a MySQL!');
    await connection.end();
  } catch (error) {
    console.error('❌ Error importando SQL a MySQL:', error);
  }
}

importDatabase();
