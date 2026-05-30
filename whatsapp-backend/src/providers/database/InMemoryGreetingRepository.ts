import { DayType, GreetingTemplate, TimePeriod, GreetingCategory } from "../../core/entities/GreetingTemplate";
import { IGreetingRepository } from "../../core/interfaces/repositories/IGreetingRepository";

export class InMemoryGreetingRepository implements IGreetingRepository {
  private templates: GreetingTemplate[] = [
    // Plantillas de RESPUESTA (Premium)
    new GreetingTemplate(
      't1',
      'WEEKDAY',
      'MORNING',
      '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't2',
      'WEEKDAY',
      'AFTERNOON',
      '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't3',
      'WEEKDAY',
      'NIGHT',
      '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't4',
      'WEEKEND',
      'MORNING',
      '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't5',
      'WEEKEND',
      'AFTERNOON',
      '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't6',
      'WEEKEND',
      'NIGHT',
      '¡Hola{{name}}! Gracias por escribirnos. Es un gusto saludarte. 👋 He recibido tu mensaje y estoy aquí para ayudarte de la mejor manera posible. Por favor, cuéntame un poco más sobre tu consulta para darte la solución ideal.',
      'RESPONSE'
    ),
    // Plantillas de INICIACIÓN (Premium)
    new GreetingTemplate(
      't_init1',
      'WEEKDAY',
      'MORNING',
      '¡Hola{{name}}! Te escribe el equipo de atención. 🌟 Esperamos que estés teniendo un excelente día. Nos ponemos en contacto contigo para asistirte en lo que necesites o dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init2',
      'WEEKDAY',
      'AFTERNOON',
      '¡Hola{{name}}! Te escribe el equipo de atención. 🌟 Esperamos que estés teniendo un excelente día. Nos ponemos en contacto contigo para asistirte en lo que necesites o dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init3',
      'WEEKDAY',
      'NIGHT',
      '¡Hola{{name}}! Te escribe el equipo de atención. 🌟 Esperamos que estés teniendo un excelente día. Nos ponemos en contacto contigo para asistirte en lo que necesites o dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?',
      'INITIATION'
    ),
    // Plantillas de CONTINUIDAD (Premium)
    new GreetingTemplate(
      't_cont1',
      'WEEKDAY',
      'MORNING',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar antes de cerrar este espacio de atención. ¡Sigo atento a ti! 😊',
      'CONTINUITY'
    ),
    new GreetingTemplate(
      't_cont2',
      'WEEKDAY',
      'AFTERNOON',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar antes de cerrar este espacio de atención. ¡Sigo atento a ti! 😊',
      'CONTINUITY'
    ),
    new GreetingTemplate(
      't_cont3',
      'WEEKDAY',
      'NIGHT',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar antes de cerrar este espacio de atención. ¡Sigo atento a ti! 😊',
      'CONTINUITY'
    ),
    // Nuevos Saludos Onboarding para Clientes Nuevos
    new GreetingTemplate(
      't_init_new1',
      'WEEKDAY',
      'MORNING',
      '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init_new2',
      'WEEKDAY',
      'AFTERNOON',
      '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init_new3',
      'WEEKDAY',
      'NIGHT',
      '¡Hola! 👋 Te escribe el equipo de atención. Queremos brindarte la mejor experiencia, pero notamos que aún no estás en nuestros registros. Para empezar, ¿serías tan amable de indicarme tu nombre completo y tu número de identificación? Con esto podremos crear tu ficha de atención personalizada.',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_resp_new1',
      'WEEKDAY',
      'MORNING',
      '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_resp_new2',
      'WEEKDAY',
      'AFTERNOON',
      '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_resp_new3',
      'WEEKDAY',
      'NIGHT',
      '¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes. Antes de continuar con tu solicitud, por favor ayúdame con tu nombre y número de cédula (o ID) para registrarte en nuestro sistema y darte una atención oficial. ¡Es solo un momento!',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_absence_exist_we',
      'WEEKEND',
      'MORNING',
      '¡Hola{{name}}! 👋 Te saludamos con gusto. Te pedimos una sincera disculpa, pero hoy es un día no laborable en nuestro equipo. 🏠 Hemos recibido tu mensaje y, como ya eres parte de nuestra comunidad, le daremos prioridad a tu consulta el próximo día hábil a primera hora. ¡Gracias por tu comprensión!',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_absence_new_we',
      'WEEKEND',
      'MORNING',
      '¡Bienvenid[o/a]! 👋 Gracias por escribirnos. Nos disculpamos por no poder atenderte de inmediato, ya que hoy no nos encontramos laborando. Para que podamos ayudarte más rápido en nuestra apertura, ¿podrías indicarnos tu nombre y número de ID? Así te registraremos y serás de los primeros en ser contactado. 📋',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_absence_exist_hol',
      'HOLIDAY_NON_WORKABLE',
      'MORNING',
      '¡Hola{{name}}! 👋 Te saludamos con gusto. Te pedimos una sincera disculpa, pero hoy es un día no laborable en nuestro equipo. 🏠 Hemos recibido tu mensaje y, como ya eres parte de nuestra comunidad, le daremos prioridad a tu consulta el próximo día hábil a primera hora. ¡Gracias por tu comprensión!',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_absence_new_hol',
      'HOLIDAY_NON_WORKABLE',
      'MORNING',
      '¡Bienvenid[o/a]! 👋 Gracias por escribirnos. Nos disculpamos por no poder atenderte de inmediato, ya que hoy no nos encontramos laborando. Para que podamos ayudarte más rápido en nuestra apertura, ¿podrías indicarnos tu nombre y número de ID? Así te registraremos y serás de los primeros en ser contactado. 📋',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_absence_exist_sun',
      'SUNDAY_WORKABLE',
      'MORNING',
      '¡Hola{{name}}! Qué gusto saludarte en este domingo. 👋 He recibido tu mensaje y estoy listo para ayudarte de la mejor manera. ¿En qué puedo apoyarte hoy?',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_absence_new_sun',
      'SUNDAY_WORKABLE',
      'MORNING',
      '¡Bienvenid[o/a]! 👋 Qué alegría saludarte este domingo. Veo que es tu primera vez aquí. Por favor, indícanos tu nombre y número de identificación para registrarte y darte la mejor atención de inmediato.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_exist_sun_aft',
      'SUNDAY_WORKABLE',
      'AFTERNOON',
      '¡Hola{{name}}! Buenas tardes en este domingo. 👋 Estoy disponible para ayudarte con cualquier consulta. Cuéntame, ¿en qué te puedo apoyar?',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_new_sun_aft',
      'SUNDAY_WORKABLE',
      'AFTERNOON',
      '¡Bienvenid[o/a]! 👋 Buenas tardes de domingo. Es un placer saludarte. Por favor, compártenos tu nombre e identificación para crear tu perfil y atender tu caso.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_exist_sun_nit',
      'SUNDAY_WORKABLE',
      'NIGHT',
      '¡Hola{{name}}! Feliz noche de domingo. 👋 Gracias por escribirnos. Cuéntame en qué puedo colaborar antes de terminar el día.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_new_sun_nit',
      'SUNDAY_WORKABLE',
      'NIGHT',
      '¡Bienvenid[o/a]! 👋 Feliz noche de domingo. Para registrarte en nuestro sistema, por favor facilítanos tu nombre e ID. ¡Será un placer atenderte!',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_init_sun_morn',
      'SUNDAY_WORKABLE',
      'MORNING',
      '¡Hola{{name}}! Te escribe el equipo de atención en este domingo. 🌟 Esperamos que tengas un gran día. Nos ponemos en contacto contigo para dar seguimiento a tu solicitud. ¿En qué podemos apoyarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init_sun_aft',
      'SUNDAY_WORKABLE',
      'AFTERNOON',
      '¡Hola{{name}}! Te escribe el equipo de atención este domingo por la tarde. 🌟 Esperamos que estés muy bien. ¿En qué podemos colaborarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init_sun_nit',
      'SUNDAY_WORKABLE',
      'NIGHT',
      '¡Hola{{name}}! Te escribe el equipo de atención este domingo por la noche. 🌟 Esperamos que estés muy bien. ¿En qué podemos colaborarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_cont_sun_morn',
      'SUNDAY_WORKABLE',
      'MORNING',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este domingo y me gustaría saber si sigues ahí o si hay algo más en lo que pueda colaborar. ¡Sigo atento! 😊',
      'CONTINUITY'
    ),
    new GreetingTemplate(
      't_cont_sun_aft',
      'SUNDAY_WORKABLE',
      'AFTERNOON',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este domingo por la tarde y me gustaría saber si sigues ahí. ¡Sigo atento! 😊',
      'CONTINUITY'
    ),
    new GreetingTemplate(
      't_cont_sun_nit',
      'SUNDAY_WORKABLE',
      'NIGHT',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción esta noche de domingo y me gustaría saber si sigues ahí. ¡Sigo atento! 😊',
      'CONTINUITY'
    ),
    // SATURDAY_WORKABLE
    new GreetingTemplate(
      't_welcome_exist_sat_morn',
      'SATURDAY_WORKABLE',
      'MORNING',
      '¡Hola{{name}}! Feliz sábado por la mañana. 👋 He recibido tu mensaje y estoy listo para ayudarte. ¿En qué puedo colaborarte hoy?',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_new_sat_morn',
      'SATURDAY_WORKABLE',
      'MORNING',
      '¡Bienvenid[o/a]! 👋 Excelente sábado para ti. Veo que aún no estás registrado. Por favor, indícanos tu nombre y número de cédula o ID para registrarte y ayudarte de inmediato.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_exist_sat_aft',
      'SATURDAY_WORKABLE',
      'AFTERNOON',
      '¡Hola{{name}}! Buenas tardes de sábado. 👋 ¿Cómo va tu fin de semana? Cuéntame en qué puedo ayudarte hoy.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_new_sat_aft',
      'SATURDAY_WORKABLE',
      'AFTERNOON',
      '¡Bienvenid[o/a]! 👋 Qué gusto que nos escribas este sábado por la tarde. Ayúdanos con tu nombre e ID para registrarte y darte soporte.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_exist_sat_nit',
      'SATURDAY_WORKABLE',
      'NIGHT',
      '¡Hola{{name}}! Feliz noche de sábado. 👋 Espero que estés muy bien. Dime, ¿en qué te puedo asistir esta noche?',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_welcome_new_sat_nit',
      'SATURDAY_WORKABLE',
      'NIGHT',
      '¡Bienvenid[o/a]! 👋 Linda noche de sábado. Para darte la mejor atención, por favor regálanos tu nombre y número de ID para tu ficha.',
      'RESPONSE'
    ),
    new GreetingTemplate(
      't_init_sat_morn',
      'SATURDAY_WORKABLE',
      'MORNING',
      '¡Hola{{name}}! Te escribe el equipo de atención en este sábado. 🌟 Esperamos que tengas un gran fin de semana. ¿En qué podemos apoyarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init_sat_aft',
      'SATURDAY_WORKABLE',
      'AFTERNOON',
      '¡Hola{{name}}! Te escribe el equipo de atención este sábado por la tarde. 🌟 ¿En qué podemos colaborarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_init_sat_nit',
      'SATURDAY_WORKABLE',
      'NIGHT',
      '¡Hola{{name}}! Te escribe el equipo de atención este sábado por la noche. 🌟 ¿En qué podemos colaborarte hoy?',
      'INITIATION'
    ),
    new GreetingTemplate(
      't_cont_sat_morn',
      'SATURDAY_WORKABLE',
      'MORNING',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este sábado y me gustaría saber si sigues ahí. ¡Sigo atento! 😊',
      'CONTINUITY'
    ),
    new GreetingTemplate(
      't_cont_sat_aft',
      'SATURDAY_WORKABLE',
      'AFTERNOON',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción este sábado por la tarde y me gustaría saber si sigues ahí. ¡Sigo atento! 😊',
      'CONTINUITY'
    ),
    new GreetingTemplate(
      't_cont_sat_nit',
      'SATURDAY_WORKABLE',
      'NIGHT',
      'Hola de nuevo{{name}}. Noto que han pasado {{time}} desde nuestra última interacción esta noche de sábado y me gustaría saber si sigues ahí. ¡Sigo atento! 😊',
      'CONTINUITY'
    ),
  ];

  async getTemplates(dayType: DayType, timePeriod: TimePeriod, category: GreetingCategory = 'RESPONSE'): Promise<GreetingTemplate[]> {
    return this.templates.filter(t => t.dayType === dayType && t.timePeriod === timePeriod && t.category === category);
  }

  async getAll(): Promise<GreetingTemplate[]> {
    return [...this.templates];
  }

  async save(template: GreetingTemplate): Promise<void> {
    const idx = this.templates.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      this.templates[idx] = template;
    } else {
      this.templates.push(template);
    }
  }

  async delete(id: string): Promise<void> {
    this.templates = this.templates.filter(t => t.id !== id);
  }
}
