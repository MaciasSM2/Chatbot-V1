const mysql = require('mysql2/promise');

async function updateClientsMetadata() {
  console.log('⏳ Actualizando metadatos de clientes existentes en MySQL...');
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'miprimerdolordecabeza',
    });

    const [rows] = await connection.query('SELECT id, nombre, metadatos FROM clientes');
    
    for (const row of rows) {
      let metadata = {};
      try {
        metadata = typeof row.metadatos === 'string' ? JSON.parse(row.metadatos) : (row.metadatos || {});
      } catch (e) {
        metadata = {};
      }

      // Si no tiene document_type asignado, ponerle uno por defecto
      if (!metadata.document_type) {
        metadata.document_type = "Cédula de Ciudadanía";
      }

      // Si no tiene document_number, usar la identificación o generar uno coherente
      if (!metadata.document_number) {
        metadata.document_number = metadata.identificacion || Math.floor(1000000000 + Math.random() * 900000000).toString();
      }

      const updatedMetadatos = JSON.stringify(metadata);

      await connection.query(
        'UPDATE clientes SET metadatos = ? WHERE id = ?',
        [updatedMetadatos, row.id]
      );
      console.log(`✅ Metadatos actualizados para cliente ID ${row.id}:`, updatedMetadatos);
    }

    await connection.end();
    console.log('🎉 Actualización de metadatos completada exitosamente.');
  } catch (error) {
    console.error('❌ Error actualizando metadatos:', error);
  }
}

updateClientsMetadata();
