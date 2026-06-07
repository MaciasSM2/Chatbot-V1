/**
 * @file CustomFieldRepository.ts
 * @description Repositorio encargado de la gestión de esquemas dinámicos para marcas blancas.
 * Utiliza columnas JSON nativas de MariaDB para evitar alteraciones físicas en las tablas de producción.
 */
import { Pool, RowDataPacket } from 'mysql2/promise';
import logger from '../../infrastructure/logging/Logger';

export interface ICustomFieldSchema {
  key: string;       // Ej: 'bodega_despacho'
  label: string;     // Ej: 'Dirección de Bodega'
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN';
  isRequired: boolean;
}

export class CustomFieldRepository {
  private readonly CONFIG_ROW_KEY = 'client_crm_schema';

  constructor(private readonly mariadbPool: Pool) {}

  /**
   * Recupera la estructura inmutable del esquema dinámico desde la tabla de configuraciones.
   */
  public async getSchema(): Promise<ICustomFieldSchema[]> {
    try {
      const [rows] = await this.mariadbPool.query<RowDataPacket[]>(
        `SELECT valor as config_value FROM configuraciones_globales WHERE clave = ? LIMIT 1`,
        [this.CONFIG_ROW_KEY]
      );

      if (rows.length === 0) {
        return [];
      }

      const rawJson = rows[0]!.config_value;
      return typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

    } catch (error: any) {
      logger.error(`❌ [Schema Repository Error] Falló la lectura del esquema dinámico: ${error.message}`);
      return [];
    }
  }

  /**
   * Sobreescribe de forma atómica y transaccional la matriz de metadatos en MariaDB.
   */
  public async saveSchema(newSchemaMatrix: ICustomFieldSchema[]): Promise<boolean> {
    const serializedBlob = JSON.stringify(newSchemaMatrix);

    try {
      const [result] = await this.mariadbPool.query<any>(
        `INSERT INTO configuraciones_globales (clave, valor)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
        [this.CONFIG_ROW_KEY, serializedBlob]
      );

      logger.info('📝 [Schema System] Matriz de campos personalizados del CRM reconfigurada de forma exitosa.');
      return result.affectedRows > 0;
    } catch (saveError: any) {
      logger.error(`🚨 [Schema Save Collapse] Falló la persistencia del mapa JSON: ${saveError.message}`);
      return false;
    }
  }
}
