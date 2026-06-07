import mysql from 'mysql2/promise';

async function checkClients() {
  console.log('--- INSPECCIÓN DE CLIENTES ---');

  // Verificar en MySQL (Tablas en español / English)
  try {
    const connection: any = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'chatbot_db',
    });

    // Probar si existe tabla 'clientes'
    try {
      const [rows]: any = await connection.query('SELECT * FROM clientes LIMIT 5;');
      console.log(`✅ MySQL (clientes): Encontrados ${rows.length} clientes.`);
      console.log(rows);
    } catch (err: any) {
      console.log('⚠️ MySQL (clientes) no tiene tabla o datos:', err.message);
    }

    // Probar si existe tabla 'clients'
    try {
      const [rows]: any = await connection.query('SELECT * FROM clients LIMIT 5;');
      console.log(`✅ MySQL (clients): Encontrados ${rows.length} clientes.`);
      console.log(rows);
    } catch (err: any) {
      console.log('⚠️ MySQL (clients) no tiene tabla o datos:', err.message);
    }

    await connection.end();
  } catch (err: any) {
    console.log('❌ Error o no hay conexión a MySQL:', err.message);
  }
}

checkClients();
