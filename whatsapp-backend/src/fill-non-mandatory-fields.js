const mysql = require('mysql2/promise');

async function fillFields() {
  console.log('⏳ Completando campos no obligatorios en metadatos de clientes...');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'miprimerdolordecabeza',
    });

    const [rows] = await connection.query('SELECT id, nombre, metadatos FROM clientes');
    const cities = ['Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Bucaramanga', 'Cartagena', 'Pereira'];

    for (const row of rows) {
      let metadata = {};
      try {
        metadata = typeof row.metadatos === 'string' ? JSON.parse(row.metadatos) : (row.metadatos || {});
      } catch (e) {
        metadata = {};
      }

      const nameLower = (row.nombre || '').toLowerCase();

      // 1. Inventar Género
      if (!metadata.gender) {
        if (nameLower.includes('maria') || nameLower.includes('diana') || nameLower.includes('camila') || nameLower.endsWith('a')) {
          metadata.gender = 'F';
        } else {
          metadata.gender = 'M';
        }
      }

      // 2. Inventar Email
      if (!metadata.email) {
        const cleanName = (row.nombre || 'cliente').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.');
        metadata.email = `${cleanName}@example.com`;
      }

      // 3. Inventar Ciudad
      if (!metadata.ciudad) {
        metadata.ciudad = cities[Math.floor(Math.random() * cities.length)];
      }

      const updatedMetadatos = JSON.stringify(metadata);

      await connection.query(
        'UPDATE clientes SET metadatos = ? WHERE id = ?',
        [updatedMetadatos, row.id]
      );
      console.log(`✅ Campos completados para ${row.nombre}:`, updatedMetadatos);
    }

    await connection.end();
    console.log('🎉 Finalización de actualización de campos no obligatorios.');
  } catch (error) {
    console.error('❌ Error actualizando campos no obligatorios:', error);
  }
}

fillFields();
