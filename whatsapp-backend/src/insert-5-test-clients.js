const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function insertFiveClients() {
  console.log('⏳ Iniciando inserción de 5 clientes de prueba en MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'miprimerdolordecabeza',
    });

    const testClients = [
      {
        nombre: 'Carlos Mario Restrepo',
        telefono: '573104567890',
        identificacion: '1017123456',
        ciudad: 'Medellín',
        email: 'carlos.restrepo@example.com'
      },
      {
        nombre: 'María Camila Gómez',
        telefono: '573209876543',
        identificacion: '1036987654',
        ciudad: 'Bogotá',
        email: 'maria.gomez@example.com'
      },
      {
        nombre: 'Andrés Felipe Valencia',
        telefono: '573151112233',
        identificacion: '1037654321',
        ciudad: 'Envigado',
        email: 'andres.valencia@example.com'
      },
      {
        nombre: 'Diana Marcela Torres',
        telefono: '573007778899',
        identificacion: '1152444333',
        ciudad: 'Cali',
        email: 'diana.torres@example.com'
      },
      {
        nombre: 'Jorge Ignacio Morales',
        telefono: '573185556677',
        identificacion: '70222333',
        ciudad: 'Barranquilla',
        email: 'jorge.morales@example.com'
      }
    ];

    for (const client of testClients) {
      const id = uuidv4();
      const metadatos = JSON.stringify({
        email: client.email,
        ciudad: client.ciudad,
        identificacion: client.identificacion
      });

      await connection.query(
        'INSERT INTO clientes (id, numero_telefono, nombre, esta_registrado, metadatos) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), esta_registrado = VALUES(esta_registrado), metadatos = VALUES(metadatos)',
        [id, client.telefono, client.nombre, true, metadatos]
      );
      console.log(`✅ Cliente registrado: ${client.nombre} (${client.telefono})`);
    }

    await connection.end();
    console.log('🎉 Se completó la inserción de los 5 clientes de prueba.');
  } catch (error) {
    console.error('❌ Error registrando clientes de prueba:', error);
  }
}

insertFiveClients();
