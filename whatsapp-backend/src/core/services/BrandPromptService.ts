/**
 * @file BrandPromptService.ts
 * @description Inyector psicométrico de prompts que compila la identidad White-Label de la empresa.
 */
import { IBrandRepository } from '../interfaces/repositories/IBrandRepository';
import { ICircuitBreaker } from '../interfaces/resilience/ICircuitBreaker';
import { BrandConfig } from '../entities/BrandConfig';

export class BrandPromptService {
  private readonly MASTER_SYSTEM_TEMPLATE: string = `
Eres el agente virtual inteligente oficial de la organización: "{{COMPANY_NAME}}".
Eslogan institucional: "{{COMPANY_SLOGAN}}".

[LINEAMIENTOS OBLIGATORIOS DE COMPORTAMIENTO Y PSICOLINGÜÍSTICA]
{{INSTITUTIONAL_LANGUAGE}}

[INSTRUCCIÓN DE CONTROL HORARIO]
Nuestra ventana oficial de atención despachada está comprendida desde las {{START_HOUR}} hasta las {{END_HOUR}}.
Si el cliente interactúa fuera de este horario, mantén una postura servicial, toma sus datos para el CRM, pero aclárale sutilmente que su solicitud será procesada a primera hora del siguiente día laboral.
`.trim();

  constructor(
    private readonly brandRepository: IBrandRepository,
    private readonly circuitBreaker: ICircuitBreaker
  ) {}

  /**
   * Construye el System Prompt dinámico absorbiendo las configuraciones personalizadas del cliente.
   */
  public async buildCustomSystemPrompt(): Promise<string> {
    // Definición de la acción principal protegida (Consulta relacional a MariaDB)
    const dbAction = async () => {
      return await this.brandRepository.getConfig();
    };

    // Estrategia de Fallback en Memoria instantánea por si la DB entra en mantenimiento (Condición 1)
    const memoryFallback = async (): Promise<BrandConfig> => {
      console.warn('ℹ️ [BrandPromptService] Servidor utilizando plantilla de contingencia local en memoria.');
      return {
        id: 'FALLBACK_LOCAL',
        companyName: 'Central de Transportes',
        companySlogan: 'Logística Segura',
        companyLogoUrl: '',
        institutionalLanguage: 'Saluda con extrema cortesía. Tono corporativo, directo y transparente. Ofrece cotizar rutas de inmediato.',
        startWorkHour: '08:00',
        endWorkHour: '18:00',
        operationMode: 1,
        themeAccent: 'WHATSAPP_GREEN'
      };
    };

    // Resolver la configuración activa a través del interceptor de resiliencia
    const activeConfig = await this.circuitBreaker.execute<BrandConfig>(dbAction, memoryFallback);

    // Compilación atómica de tokens semánticos en memoria
    return this.MASTER_SYSTEM_TEMPLATE
      .replace('{{COMPANY_NAME}}', activeConfig.companyName)
      .replace('{{COMPANY_SLOGAN}}', activeConfig.companySlogan || 'Despachos Nacionales')
      .replace('{{INSTITUTIONAL_LANGUAGE}}', activeConfig.institutionalLanguage)
      .replace('{{START_HOUR}}', activeConfig.startWorkHour)
      .replace('{{END_HOUR}}', activeConfig.endWorkHour);
  }

  /**
   * Obtiene la configuración cruda para el Dashboard, protegida contra bloqueos.
   */
  public async getRawConfig(): Promise<BrandConfig | null> {
    return this.circuitBreaker.execute(
      () => this.brandRepository.getConfig(),
      async () => ({
        companyName: 'Libros Medellín (Modo de Contingencia)',
        companySlogan: 'Servicio en mantenimiento',
        institutionalLanguage: 'El sistema administrativo está operando con datos locales debido a intermitencia en la base de datos.',
        companyLogoUrl: '',
        startWorkHour: '08:00',
        endWorkHour: '18:00',
        operationMode: 1,
        themeAccent: 'WHATSAPP_GREEN'
      } as any)
    );
  }

  /**
   * Actualiza los datos de identidad corporativa.
   */
  public async updateBrandIdentity(data: Partial<Omit<BrandConfig, 'id'>>): Promise<boolean> {
    const config = new BrandConfig(
      'MAIN_CONFIG',
      data.companyName || '',
      data.companySlogan || '',
      data.institutionalLanguage || '',
      data.companyLogoUrl || '',
      data.startWorkHour || '08:00',
      data.endWorkHour || '18:00',
      data.operationMode !== undefined ? data.operationMode : 1,
      data.themeAccent || 'WHATSAPP_GREEN'
    );
    return await this.brandRepository.updateConfig(config);
  }
}
