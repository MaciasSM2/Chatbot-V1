/**
 * @file BrandConfigSchema.ts
 * @description Validación Zod con soporte para entrada directa de horas y toggles de comportamiento.
 */
import { z } from 'zod';

export const tightConfigurationSchema = z.object({
  body: z.object({
    companyName: z.string().min(2).max(100),
    companySlogan: z.string().max(255).nullable(),
    companyLogoUrl: z.string().url().or(z.literal('')),
    institutionalLanguage: z.string().min(10).max(2000),
    // Control de horas directo por string estructurado (HH:MM)
    startWorkHour: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora debe ser HH:MM'),
    endWorkHour: z.string().regex(/^\d{2}:\d{2}$/, 'Formato de hora debe ser HH:MM'),
    // Switch de comportamiento de 3 opciones (0 = Apagado, 1 = Modo Demo, 2 = Producción)
    operationMode: z.number().min(0).max(2),
    themeAccent: z.string().refine((val) => {
      const isPreset = ['WHATSAPP_GREEN', 'BLUE', 'PURPLE', 'RED', 'CYAN', 'GOLD', 'SILVER', 'ORANGE', 'MEDITERRANEAN', 'FLORAL'].includes(val);
      const isHex = /^#([A-Fa-f0-9]{6})$/.test(val);
      return isPreset || isHex;
    }, {
      message: 'El acento visual debe ser un preset corporativo registrado o un color hexadecimal válido (Ej: #2DD6D6).'
    }).optional()
  })
});

export const updateBrandSchema = tightConfigurationSchema;
