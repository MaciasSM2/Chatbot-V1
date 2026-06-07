/**
 * @file MySQLBrandRepository.ts
 * @description Adaptador físico de persistencia homologado para la configuración corporativa (White-Label).
 * Centralizado en el directorio cohesivo de base de datos bajo POO pura.
 */
import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { IBrandRepository } from '../../core/interfaces/repositories/IBrandRepository';
import { BrandConfig } from '../../core/entities/BrandConfig';

export class MySQLBrandRepository implements IBrandRepository {
  private readonly MASTER_ID = 'MAIN_CONFIG';

  constructor(private readonly mariaDb: Pool) {}

  /**
   * Recupera de forma relacional el registro único de configuración de la empresa de transporte.
   */
  public async getConfig(): Promise<BrandConfig> {
    const [rows] = await this.mariaDb.query<RowDataPacket[]>(
      `SELECT 
        id, company_name as companyName, company_slogan as companySlogan,
        company_logo_url as companyLogoUrl, institutional_language as institutionalLanguage,
        start_work_hour as startWorkHour, end_work_hour as endWorkHour,
        operation_mode as operationMode, theme_accent as themeAccent
       FROM company_brand_configs WHERE id = ?`,
      [this.MASTER_ID]
    );

    // Mecanismo Defensivo (Fallback de Contingencia): Auto-poblar datos si la semilla fue alterada
    if (rows.length === 0) {
      const defaultIdentity = new BrandConfig(
        this.MASTER_ID,
        'Transportes Logísticos de Colombia',
        'Eficiencia y seguridad en cada trayecto nacional',
        'Tono formal e institucional. Priorizar cotización guiada de fletes.',
        'https://cdn.logistica.com/assets/default-logo.png',
        '08:00',
        '18:00',
        1, // Modo Simulador por defecto
        'WHATSAPP_GREEN'
      );
      
      await this.saveDefaultFallback(defaultIdentity);
      return defaultIdentity;
    }

    const row = rows[0]!;
    return new BrandConfig(
      this.MASTER_ID,
      row.companyName,
      row.companySlogan || '',
      row.institutionalLanguage || '',
      row.companyLogoUrl || '',
      row.startWorkHour || '08:00',
      row.endWorkHour || '18:00',
      row.operationMode !== undefined ? Number(row.operationMode) : 1,
      row.themeAccent || 'WHATSAPP_GREEN'
    );
  }

  /**
   * Actualiza atómicamente la matriz de identidad visual y reglas horarias en MariaDB.
   */
  public async updateConfig(newIdentity: BrandConfig): Promise<boolean> {
    const [result] = await this.mariaDb.query<ResultSetHeader>(
      `UPDATE company_brand_configs SET
        company_name = ?, company_slogan = ?, company_logo_url = ?,
        institutional_language = ?, start_work_hour = ?, end_work_hour = ?,
        operation_mode = ?, theme_accent = ?
       WHERE id = ?`,
      [
        newIdentity.companyName, newIdentity.companySlogan, newIdentity.companyLogoUrl,
        newIdentity.institutionalLanguage, newIdentity.startWorkHour, newIdentity.endWorkHour,
        newIdentity.operationMode, newIdentity.themeAccent || 'WHATSAPP_GREEN', this.MASTER_ID
      ]
    );
    return result.affectedRows > 0;
  }

  /**
   * Guarda de forma transaction-safe el registro inicial en blanco si la tabla se encuentra vacía.
   */
  private async saveDefaultFallback(fallback: BrandConfig): Promise<void> {
    await this.mariaDb.query(
      `INSERT INTO company_brand_configs 
        (id, company_name, company_slogan, company_logo_url, institutional_language, start_work_hour, end_work_hour, operation_mode, theme_accent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        this.MASTER_ID, fallback.companyName, fallback.companySlogan, fallback.companyLogoUrl,
        fallback.institutionalLanguage, fallback.startWorkHour, fallback.endWorkHour, fallback.operationMode,
        fallback.themeAccent || 'WHATSAPP_GREEN'
      ]
    );
  }
}
