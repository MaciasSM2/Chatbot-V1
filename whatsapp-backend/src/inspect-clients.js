const { Pool } = require('pg');
const mysql = require('mysql2/promise');

async function checkClients() {
  console.log('--- INSPECCIÓN DE CLIENTES ---');

  // 1. Verificar en PostgreSQL
  try {
    const pgPool = new Pool({
      connectionString: 'postgresql://postgres:postgrespassword@localhost:5432/chatbot_db',
    });
    const pgRes = await pgPool.query('SELECT * FROM clients LIMIT 5;');
    console.log(`✅ PostgreSQL (clients): Encontrados ${pgRes.rows.length} clientes.`);
    console.log(pgRes.rows);
    await pgPool.end();
  } catch (err) {
    console.log('❌ Error o no hay conexión a PostgreSQL:', err.message);
  }

  // 2. Verificar en MySQL (Tablas en español / English)
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'miprimerdolordecabeza',
    });

    // Probar si existe tabla 'clientes'
    try {
      const [rows] = await connection.query('SELECT * FROM clientes LIMIT 5;');
      console.log(`✅ MySQL (clientes): Encontrados ${rows.length} clientes.`);
      console.log(rows);
    } catch (err) {
      console.log('⚠️ MySQL (clientes) no tiene tabla o datos:', err.message);
    }

    // Probar si existe tabla 'clients'
    try {
      const [rows] = await connection.query('SELECT * FROM clients LIMIT 5;');
      console.log(`✅ MySQL (clients): Encontrados ${rows.length} clientes.`);
      console.log(rows);
    } catch (err) {
      console.log('⚠️ MySQL (clients) no tiene tabla o datos:', err.message);
    }

    await connection.end();
  } catch (err) {
    console.log('❌ Error o no hay conexión a MySQL:', err.message);
  }
}

checkClients();
