const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importDatabase() {
  console.log('🚀 Iniciando importación de base_datos_espanol.sql a MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      multipleStatements: true,
    });

    // Crear la base de datos si no existe
    await connection.query('CREATE DATABASE IF NOT EXISTS miprimerdolordecabeza CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;');
    await connection.query('USE miprimerdolordecabeza;');

    const sqlPath = path.join(__dirname, '../base_datos_espanol.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`No se encontró el archivo SQL en: ${sqlPath}`);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Convertir de Postgres a MySQL simple
    let mysqlCompatibleSql = sqlContent
      .replace(/JSONB/g, 'JSON')
      .replace(/DEFAULT gen_random_uuid\(\)/g, '')
      .replace(/UUID PRIMARY KEY/g, 'VARCHAR(36) PRIMARY KEY')
      .replace(/ON CONFLICT \(id\) DO NOTHING/gi, 'ON DUPLICATE KEY UPDATE id=id')
      .replace(/ON CONFLICT \(fecha\) DO NOTHING/gi, 'ON DUPLICATE KEY UPDATE fecha=fecha')
      .replace(/ON CONFLICT \(clave\) DO NOTHING/gi, 'ON DUPLICATE KEY UPDATE clave=clave')
      .replace(/ON CONFLICT \(id\) DO UPDATE SET\s+hora_inicio\s+=\s+EXCLUDED\.hora_inicio,\s+hora_fin\s+=\s+EXCLUDED\.hora_fin/gi, 'ON DUPLICATE KEY UPDATE hora_inicio = VALUES(hora_inicio), hora_fin = VALUES(hora_fin)');

    await connection.query(mysqlCompatibleSql);
    console.log('✅ Importación exitosa de todas las tablas y datos semilla a MySQL!');
    await connection.end();
  } catch (error) {
    console.error('❌ Error importando SQL a MySQL:', error);
  }
}

importDatabase();
