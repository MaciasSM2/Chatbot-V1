/**
 * @file UpdateMetadataTask.ts
 * @description Comando concreto encargado de normalizar las columnas JSON de los clientes unificados.
 * Elimina la deuda técnica del script huérfano 'update-clients-metadata.js'.
 */
import { BaseCliTask } from './BaseCliTask';
import { ResultSetHeader } from 'mysql2/promise';

export class UpdateMetadataTask extends BaseCliTask {
  
  public async execute(): Promise<void> {
    console.log('⏳ [CLI Task] Iniciando normalización atómica de metadatos en la tabla clients...');
    
    try {
      // Consulta SQL adaptada estrictamente al nuevo esquema relacional unificado
      const [result] = await this.contextPool.query<ResultSetHeader>(`
        UPDATE clients 
        SET metadata = JSON_MERGE_PATCH(IFNULL(metadata, '{}'), '{"sync_origin": "CLI_CORE_TASK_2026"}')
        WHERE is_registered = 0
      `);

      console.log(`✅ [CLI Task] Proceso finalizado. Registros actualizados en MariaDB: ${result.affectedRows}`);
    } catch (error: any) {
      console.error('🚨 [CLI Task Error] La migración por consola colapsó:', error.message);
      throw error;
    }
  }
}
