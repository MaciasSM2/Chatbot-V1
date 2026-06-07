const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function insertTestClient() {
  console.log('⏳ Insertando cliente de prueba en MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'miprimerdolordecabeza',
    });

    const id = uuidv4();
    const numero_telefono = '573001234567';
    const nombre = 'Juan Pérez';
    const esta_registrado = true;
    const metadatos = JSON.stringify({
      email: 'juan.perez@example.com',
      ciudad: 'Bogotá',
    });

    await connection.query(
      'INSERT INTO clientes (id, numero_telefono, nombre, esta_registrado, metadatos) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), esta_registrado = VALUES(esta_registrado), metadatos = VALUES(metadatos)',
      [id, numero_telefono, nombre, esta_registrado, metadatos]
    );

    console.log(`✅ Cliente de prueba insertado con éxito:`);
    console.log(`- ID: ${id}`);
    console.log(`- Nombre: ${nombre}`);
    console.log(`- Teléfono: ${numero_telefono}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Error al insertar cliente de prueba:', error);
  }
}

insertTestClient();
