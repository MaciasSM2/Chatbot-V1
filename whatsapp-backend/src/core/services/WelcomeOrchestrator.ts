import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { IGreetingRepository } from "../interfaces/repositories/IGreetingRepository";
import { DateTimeManager } from "./DateTimeManager";
import { HumanDelayService } from "./HumanDelayService";
import { GreetingCategory } from "../entities/GreetingTemplate";
import { IdentityValidator } from "./IdentityValidator";
import { ModuleSettingsService } from "./ModuleSettingsService";

export class WelcomeOrchestrator {
  public static readonly sessionGenders = new Map<string, 'M' | 'F'>();
  private readonly identityValidator: IdentityValidator;

  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly greetingRepository: IGreetingRepository,
    private readonly dateTimeManager: DateTimeManager,
    private readonly delayService: HumanDelayService,
    identityValidator?: IdentityValidator,
    private readonly moduleService?: ModuleSettingsService
  ) {
    this.identityValidator = identityValidator || new IdentityValidator(clientRepository);
  }

  private async getAbsenceGreeting(isNew: boolean, nameSuffix: string, dayType: string): Promise<string> {
    const templates = await this.greetingRepository.getAll();
    const absenceTemplates = templates.filter(t => 
      t.dayType === dayType && 
      (isNew ? t.id.includes('absence_new') : t.id.includes('absence_exist'))
    );

    let text = "";
    const firstMatch = absenceTemplates[0];
    if (firstMatch) {
      text = firstMatch.text;
    } else {
      if (isNew) {
        text = "¡Bienvenid[o/a]! 👋 Gracias por escribirnos. Nos disculpamos por no poder atenderte de inmediato, ya que hoy no nos encontramos laborando. Para que podamos ayudarte más rápido en nuestra apertura, ¿podrías indicarnos tu nombre y número de ID? Así te registraremos y serás de los primeros en ser contactado. 📋";
      } else {
        text = "¡Hola{{name}}! 👋 Te saludamos con gusto. Te pedimos una sincera disculpa, pero hoy es un día no laborable en nuestro equipo. 🏠 Hemos recibido tu mensaje y, como ya eres parte de nuestra comunidad, le daremos prioridad a tu consulta el próximo día hábil a primera hora. ¡Gracias por tu comprensión!";
      }
    }

    return text.replace("{{name}}", nameSuffix);
  }

  public async handleIncomingWelcome(phoneNumber: string, category: GreetingCategory = 'RESPONSE', minutes?: number, isNewClient?: boolean): Promise<{ message: string; expectsDataInput: boolean }> {
    if (this.moduleService) {
      const isGreetingEnabled = await this.moduleService.isEnabled('module_greetings');
      if (!isGreetingEnabled) {
        return { message: "Servicio de saludos temporalmente inactivo.", expectsDataInput: false };
      }
    }

    if (phoneNumber === 'TEST_BOT_DEBUG') {
      const forcedGreeting = await this.getForcedGreeting(category, minutes, isNewClient);
      return { 
        message: forcedGreeting, 
        expectsDataInput: isNewClient ?? false 
      };
    }

    const now = new Date();
    
    const dayType = await this.dateTimeManager.getDayType(now);
    const isHolidayNonWorkable = dayType === 'HOLIDAY_NON_WORKABLE';
    const isWithinHours = await this.dateTimeManager.isWithinWorkingHours(now);
    const isNonWorkable = isHolidayNonWorkable || !isWithinHours;

    if (isNonWorkable) {
      const client = await this.clientRepository.findByPhoneNumber(phoneNumber);
      const isClientNew = isNewClient !== undefined ? isNewClient : (!client || !client.isRegistered || !client.name);
      const nameSuffix = isClientNew ? "" : `, ${client?.name || 'Usuario'}`;
      
      const isWeekend = now.getDay() === 0 || now.getDay() === 6 || dayType === 'WEEKEND' || dayType.includes('SATURDAY') || dayType.includes('SUNDAY');
      const absenceDayType = isHolidayNonWorkable ? 'HOLIDAY_NON_WORKABLE' : (isWeekend ? 'WEEKEND' : 'WEEKDAY');
      const absenceText = await this.getAbsenceGreeting(isClientNew, nameSuffix, absenceDayType);

      await this.delayService.execute(3, 5);

      return {
        message: absenceText,
        expectsDataInput: isClientNew
      };
    }

    const timePeriod = this.dateTimeManager.getTimePeriod(now);

    const [client, templates] = await Promise.all([
      this.clientRepository.findByPhoneNumber(phoneNumber),
      this.greetingRepository.getTemplates(dayType, timePeriod, category)
    ]);

    if (!templates || templates.length === 0) {
      throw new Error(`Configuración de saludos ausente para: ${dayType} - ${timePeriod} (categoría: ${category})`);
    }

    const randomIndex = Math.floor(Math.random() * templates.length);
    const template = templates[randomIndex];
    if (!template) {
      throw new Error(`Configuración de saludos ausente para: ${dayType} - ${timePeriod} (categoría: ${category})`);
    }
    let selectedTemplate = template.text;

    // Si es continuidad, inyectamos el tiempo transcurrido
    if (category === 'CONTINUITY') {
      const minutesStr = minutes ? `${minutes} minutos` : "5 minutos";
      selectedTemplate = selectedTemplate.replace("{{time}}", minutesStr);
    }

    const isClientNew = isNewClient !== undefined ? isNewClient : (!client || !client.isRegistered || !client.name);
    let finalMessage = "";
    let expectsDataInput = false;

    if (isClientNew) {
      expectsDataInput = true;
      if (category === 'INITIATION' || category === 'RESPONSE') {
        const onboardingTemplates = templates.filter(t => t.id.includes('_new') || !t.text.includes('{{name}}'));
        if (onboardingTemplates.length > 0) {
          const onboardingRandomIndex = Math.floor(Math.random() * onboardingTemplates.length);
          finalMessage = onboardingTemplates[onboardingRandomIndex]?.text || "";
        } else {
          if (category === 'INITIATION') {
            finalMessage = "¡Hola! 👋 Te saluda el equipo de atención. Notamos que no estás en nuestros registros. ¿Ya te encuentras registrado?";
          } else {
            finalMessage = "¡Hola! Bienvenido. 👋 Veo que es la primera vez que nos escribes. ¿Ya te encuentras registrado?";
          }
        }
      } else {
        finalMessage = selectedTemplate.replace("{{name}}", "");
      }
    } else {
      finalMessage = selectedTemplate.replace("{{name}}", `, ${client?.name || 'Usuario'}`);
    }

    await this.delayService.execute(3, 5);

    return {
      message: finalMessage,
      expectsDataInput
    };
  }

  public async handleContinuity(phoneNumber: string, minutes: number): Promise<{ message: string }> {
    const { greeting } = await this.validateAndGreet(phoneNumber, 'M', 'CONTINUITY', minutes);
    return { message: greeting };
  }

  /**
   * Nuevo método para forzar categorías en el simulador ignorando fecha/hora pero reflejando el contexto de Colombia hoy
   */
  public async getForcedGreeting(
    category: GreetingCategory,
    minutes?: number,
    isNewClient?: boolean,
    dayTypeOverride?: string,
    timePeriodOverride?: string
  ): Promise<string> {
    const now = new Date();
    // Obtener el tipo de día para hoy en Colombia (WEEKDAY, HOLIDAY_NON_WORKABLE, etc.) o usar override
    const dayType = dayTypeOverride || await this.dateTimeManager.getDayType(now);
    const timePeriod = timePeriodOverride || this.dateTimeManager.getTimePeriod(now);

    // Calcular isNonWorkable de forma dinámica para Colombia según el dayType y timePeriod
    let isNonWorkable = false;
    if (dayType === 'HOLIDAY_NON_WORKABLE' || dayType === 'WEEKEND') {
      isNonWorkable = true;
    } else if (dayType === 'SATURDAY_WORKABLE') {
      // Sábado laborable es solo durante la mañana
      isNonWorkable = timePeriod !== 'MORNING';
    } else if (dayType === 'WEEKDAY') {
      // Día de semana laborable es mañana y tarde, noche es no laborable
      isNonWorkable = timePeriod === 'NIGHT';
    }

    if (isNonWorkable) {
      const nameSuffix = isNewClient ? "" : " (USUARIO TEST)";
      const absenceDayType = (dayType === 'HOLIDAY_NON_WORKABLE' || dayType === 'WEEKEND' || dayType === 'SATURDAY_WORKABLE')
        ? dayType
        : 'WEEKDAY';
      const absenceText = await this.getAbsenceGreeting(isNewClient ?? false, nameSuffix, absenceDayType);
      return `[TEST-COLOMBIA] [${dayType}] ${absenceText}`;
    }
    
    const templates = await this.greetingRepository.getAll();
    
    // 1. Filtrar primero por la categoría solicitada
    let filtered = templates.filter(t => t.category === category);
    
    // 2. Intentar filtrar también por el tipo de día para reflejar el contexto
    const dayTypeFiltered = filtered.filter(t => t.dayType === dayType);
    if (dayTypeFiltered.length > 0) {
      filtered = dayTypeFiltered;
    }

    // 3. Intentar filtrar también por el periodo de tiempo
    const timePeriodFiltered = filtered.filter(t => t.timePeriod === timePeriod);
    if (timePeriodFiltered.length > 0) {
      filtered = timePeriodFiltered;
    }
    
    if (filtered.length === 0) {
      return `[TEST-COLOMBIA] [${dayType}] ⚠️ No hay plantillas configuradas para la categoría: ${category}`;
    }

    // Si isNewClient es true, servimos plantillas de onboarding para INITIATION/RESPONSE
    if (isNewClient && (category === 'INITIATION' || category === 'RESPONSE')) {
      const onboarding = filtered.filter(t => t.id.includes('_new') || !t.text.includes('{{name}}'));
      const text = onboarding.length > 0 
        ? (onboarding[Math.floor(Math.random() * onboarding.length)]?.text || "")
        : (category === 'INITIATION'
            ? "¡Hola! 👋 Te saluda el equipo de atención. Notamos que no estás en nuestros registros. ¿Ya te encuentras registrado?"
            : "¡Hola! Bienvenido. 👋 Veo que es la primera vez que nos escribes. ¿Ya te encuentras registrado?");
      return `[TEST-COLOMBIA] [${dayType}] ${text}`;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    const template = filtered[randomIndex];
    if (!template) {
      return `[TEST-COLOMBIA] [${dayType}] ⚠️ No hay plantillas configuradas para la categoría: ${category}`;
    }
    
    let text = template.text;

    // Si es continuidad, inyectamos el tiempo transcurrido
    if (category === 'CONTINUITY') {
      const minutesStr = minutes ? `${minutes} minutos` : "5 minutos";
      text = text.replace("{{time}}", minutesStr);
    }

    if (isNewClient) {
      text = text.replace("{{name}}", "");
    } else {
      const client = await this.clientRepository.findByPhoneNumber("TEST_BOT_DEBUG");
      const clientName = client ? `, ${client.name.split(' ')[0]}` : " (USUARIO TEST)";
      text = text.replace("{{name}}", clientName);
    }
    return `[TEST-COLOMBIA] [${dayType}] ${text}`;
  }

  public applyGender(text: string, gender: 'M' | 'F'): string {
    if (gender === 'F') {
      return text
        .replace(/\[o\/a\]/g, 'a')
        .replace(/\[O\/A\]/g, 'A')
        .replace(/\[el\/la\]/g, 'la')
        .replace(/\[El\/La\]/g, 'La');
    } else {
      return text
        .replace(/\[o\/a\]/g, 'o')
        .replace(/\[O\/A\]/g, 'O')
        .replace(/\[el\/la\]/g, 'el')
        .replace(/\[El\/La\]/g, 'El');
    }
  }

  public async validateAndGreet(
    phoneNumber: string,
    gender: 'M' | 'F' = 'M',
    category: GreetingCategory = 'RESPONSE',
    minutes?: number,
    dayTypeOverride?: string,
    timePeriodOverride?: string,
    isNewClientOverride?: boolean
  ): Promise<{ status: 'VALIDATED' | 'ANONYMOUS'; token: string; name: string; greeting: string; dayType: string; isNonWorkable: boolean }> {
    const validationToken = `TK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    WelcomeOrchestrator.sessionGenders.set(phoneNumber, gender);

    const identity = await this.identityValidator.validatePhoneNumber(phoneNumber);

    const isNewClient = isNewClientOverride !== undefined ? isNewClientOverride : !identity.isRegistered;

    const greetingText = await this.getForcedGreeting(category, minutes, isNewClient, dayTypeOverride, timePeriodOverride);

    const genderedGreeting = this.applyGender(greetingText, gender);

    const now = new Date();
    const dayType = dayTypeOverride || await this.dateTimeManager.getDayType(now);
    const timePeriod = timePeriodOverride || this.dateTimeManager.getTimePeriod(now);
    
    let isNonWorkable = false;
    if (dayType === 'HOLIDAY_NON_WORKABLE' || dayType === 'WEEKEND') {
      isNonWorkable = true;
    } else if (dayType === 'SATURDAY_WORKABLE') {
      isNonWorkable = timePeriod !== 'MORNING';
    } else if (dayType === 'WEEKDAY') {
      isNonWorkable = timePeriod === 'NIGHT';
    }

    if (!isNewClient) {
      return {
        status: 'VALIDATED',
        token: validationToken,
        name: identity.name || 'Sebastian Macias (Ejemplo)',
        greeting: genderedGreeting,
        dayType,
        isNonWorkable
      };
    }

    return {
      status: 'ANONYMOUS',
      token: validationToken,
      name: 'Invitado',
      greeting: genderedGreeting,
      dayType,
      isNonWorkable
    };
  }
}
