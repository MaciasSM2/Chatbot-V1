import { Request, Response } from 'express';
import { ICorporateSettingsRepository } from '../../../core/interfaces/repositories/ICorporateSettingsRepository';
import { CorporateSettings } from '../../../core/entities/CorporateSettings';
import logger from '../../../infrastructure/logging/Logger';

export class CorporateSettingsController {
  constructor(private readonly corporateSettingsRepo: ICorporateSettingsRepository) {}

  public getBrand = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.corporateSettingsRepo.getSettings();
      res.status(200).json({
        companyName: settings.companyName,
        companySlogan: settings.companySlogan,
        institutionalLanguage: settings.institutionalLanguage,
        companyLogoUrl: settings.companyLogoUrl
      });
    } catch (err) {
      logger.error('Error in CorporateSettingsController.getBrand', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: 'Internal Server Error', message: 'No se pudo obtener la configuración corporativa.' });
    }
  };

  public updateBrand = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { companyName, companySlogan, institutionalLanguage, companyLogoUrl } = req.body;

      if (!companyName || companyName.trim() === '') {
        return res.status(400).json({ error: 'Bad Request', message: 'El nombre de la empresa es obligatorio.' });
      }

      const settings = new CorporateSettings(
        'default',
        companyName.trim(),
        (companySlogan || '').trim(),
        (institutionalLanguage || '').trim(),
        (companyLogoUrl || '').trim()
      );

      await this.corporateSettingsRepo.updateSettings(settings);
      res.status(200).json({ success: true, settings });
    } catch (err) {
      logger.error('Error in CorporateSettingsController.updateBrand', { error: err instanceof Error ? err.message : String(err) });
      res.status(500).json({ error: 'Internal Server Error', message: 'No se pudo guardar la configuración corporativa.' });
    }
  };
}
