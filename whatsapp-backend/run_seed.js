const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://postgres:postgrespassword@localhost:5432/whatsapp_bot'
});

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../seed_dawn.sql'), 'utf-8');
    await pool.query(sql);
    console.log('Semillas insertadas correctamente.');
  } catch (err) {
    console.error('Error insertando semillas:', err);
  } finally {
    await pool.end();
  }
}

run();
