import { ICorporateSettingsRepository } from '../../core/interfaces/repositories/ICorporateSettingsRepository';
import { CorporateSettings } from '../../core/entities/CorporateSettings';
import logger from '../../infrastructure/logging/Logger';

export class MySQLCorporateSettingsRepository implements ICorporateSettingsRepository {
  constructor(private readonly dbPool: any) {}

  public async getSettings(): Promise<CorporateSettings> {
    try {
      const [rows]: any = await this.dbPool.query(
        'SELECT id, company_name, company_slogan, institutional_language, company_logo_url FROM corporate_settings LIMIT 1'
      );
      if (rows.length > 0) {
        const row = rows[0];
        return new CorporateSettings(
          row.id,
          row.company_name || 'Libros Medellín',
          row.company_slogan || '',
          row.institutional_language || '',
          row.company_logo_url || ''
        );
      }
    } catch (err) {
      logger.error('Error fetching corporate settings from MySQL', { error: err instanceof Error ? err.message : String(err) });
    }
    return new CorporateSettings('default', 'Libros Medellín', '', '', '');
  }

  public async updateSettings(settings: CorporateSettings): Promise<void> {
    try {
      await this.dbPool.query(
        `INSERT INTO corporate_settings (id, company_name, company_slogan, institutional_language, company_logo_url)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           company_name = VALUES(company_name),
           company_slogan = VALUES(company_slogan),
           institutional_language = VALUES(institutional_language),
           company_logo_url = VALUES(company_logo_url)`,
        ['default', settings.companyName, settings.companySlogan, settings.institutionalLanguage, settings.companyLogoUrl]
      );
    } catch (err) {
      logger.error('Error updating corporate settings in MySQL', { error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  }
}
