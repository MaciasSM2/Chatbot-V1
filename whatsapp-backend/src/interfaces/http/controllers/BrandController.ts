/**
 * @file BrandController.ts
 * @description Controlador HTTP para exponer la gestión de marca al Dashboard.
 */
import { Request, Response } from 'express';
import { BrandPromptService } from '../../../core/services/BrandPromptService';

export class BrandController {
  constructor(private readonly brandService: BrandPromptService) {}

  public async getBrandSettings(_req: Request, res: Response): Promise<Response> {
    try {
      const config = await this.brandService.getRawConfig();
      if (!config) {
        return res.status(404).json({ success: false, error: 'Configuración base no encontrada.' });
      }

      // NORMALIZACIÓN DE CONTRATO: Evita desajustes de propiedades en el parsing del Frontend
      const synchronizedPayload = {
        companyName: config.companyName,
        companySlogan: config.companySlogan,
        companyLogoUrl: config.companyLogoUrl,
        institutionalLanguage: config.institutionalLanguage,
        startWorkHour: config.startWorkHour,
        endWorkHour: config.endWorkHour,
        operationMode: Number(config.operationMode),
        themeAccent: config.themeAccent || 'WHATSAPP_GREEN'
      };

      return res.status(200).json({
        success: true,
        data: synchronizedPayload
      });
    } catch (error: any) {
      console.error('X [BrandController Error] Falló la resolución del contrato:', error.message);
      return res.status(500).json({
        success: false,
        error: 'Error de infraestructura al recuperar la configuración corporativa.'
      });
    }
  }

  /**
   * Actualiza las casillas de identación corporativa.
   */
  public async updateBrandSettings(req: Request, res: Response): Promise<Response> {
    try {
      const { companyName, companySlogan, institutionalLanguage, companyLogoUrl, startWorkHour, endWorkHour, operationMode, themeAccent } = req.body;

      // Validación estricta en el adaptador de entrada
      if (!companyName || companyName.trim() === '') {
        return res.status(400).json({ success: false, error: 'El nombre de la empresa es un campo obligatorio.' });
      }

      const isUpdated = await this.brandService.updateBrandIdentity({
        companyName,
        companySlogan,
        institutionalLanguage,
        companyLogoUrl,
        startWorkHour,
        endWorkHour,
        operationMode,
        themeAccent
      });

      if (!isUpdated) {
        return res.status(404).json({ success: false, error: 'No se encontró la configuración de marca base para actualizar.' });
      }

      return res.status(200).json({ success: true, message: 'Identidad corporativa actualizada y sincronizada en el motor de IA.' });
    } catch (error: any) {
      console.error(`[BrandController][updateBrandSettings] Error: ${error.message}`);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }

  /**
   * Actualiza el perfil de tono de habla de la empresa (sincronizado con operationMode).
   */
  public async updateBrandTone(req: Request, res: Response): Promise<Response> {
    try {
      const { toneProfile } = req.body;
      if (toneProfile !== 1 && toneProfile !== 2) {
        return res.status(400).json({ success: false, error: 'Perfil de tono de habla inválido.' });
      }

      const config = await this.brandService.getRawConfig();
      if (!config) {
        return res.status(404).json({ success: false, error: 'Configuración base no encontrada.' });
      }

      const isUpdated = await this.brandService.updateBrandIdentity({
        companyName: config.companyName,
        companySlogan: config.companySlogan,
        institutionalLanguage: config.institutionalLanguage,
        companyLogoUrl: config.companyLogoUrl,
        startWorkHour: config.startWorkHour,
        endWorkHour: config.endWorkHour,
        operationMode: toneProfile // Mapeado al switch simplificado
      });

      if (!isUpdated) {
        return res.status(500).json({ success: false, error: 'Fallo al sincronizar el tono en base de datos.' });
      }

      return res.status(200).json({ success: true, message: 'Perfil semántico de tono de habla actualizado.' });
    } catch (error: any) {
      console.error(`[BrandController][updateBrandTone] Error: ${error.message}`);
      return res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  }
}
