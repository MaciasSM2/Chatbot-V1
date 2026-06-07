/**
 * @file BrandToneEngine.ts
 * @description Motor determinista de sustitución de plantillas según el perfil corporativo.
 */
export enum ToneProfile {
  FORMAL_CORPORATIVO = 1,
  CERCANO_COMERCIAL = 2
}

interface ToneMatrix {
  welcomeNew: string;
  welcomeExisting: string;
  outOfScope: string;
  outsideHours: string;
}

export class BrandToneEngine {
  // Matriz de respuestas estáticas e inmutables controladas por código puro
  private readonly MATRICES: Record<ToneProfile, ToneMatrix> = {
    [ToneProfile.FORMAL_CORPORATIVO]: {
      welcomeNew: 'Cordial saludo. Bienvenido al canal oficial de atención de {{COMPANY}}. ¿En qué podemos servirle el día de hoy?',
      welcomeExisting: 'Estimado/a {{NAME}}, es un placer saludarle nuevamente en {{COMPANY}}. Monitoreamos su estado actual de atención.',
      outOfScope: 'Agradecemos su consulta. Para garantizar la precisión de su solicitud de transporte, le sugerimos seguir las opciones del menú principal o aguardar un momento a que un asesor de nuestra central verifique su requerimiento.',
      outsideHours: 'Le informamos que nuestro horario de atención actual es de {{START}} a {{END}}. Su mensaje ha quedado registrado con prioridad en nuestro sistema.'
    },
    [ToneProfile.CERCANO_COMERCIAL]: {
      welcomeNew: '¡Hola! Qué gusto saludarte. Bienvenido a {{COMPANY}}. 🚚 ¿Cómo te podemos ayudar hoy con tu carga o viaje?',
      welcomeExisting: '¡Hola de nuevo, {{NAME}}! Qué bueno tenerte de vuelta en {{COMPANY}}. Cuéntanos cómo va todo.',
      outOfScope: '¡Súper! Tomamos nota de lo que nos cuentas. Para ayudarte de la forma más rápida posible con tu logística, elijamos una de las opciones del menú de aquí abajo o danos un momento para pasarte con el equipo de soporte. ¡Gracias por tu paciencia!',
      outsideHours: '¡Hola! En este momento nuestro equipo está descansando (Horario: {{START}} a {{END}}). Pero no te preocupes, guardamos tu mensaje en primera fila para responderte apenas abramos.'
    }
  };

  /**
   * Resuelve y compila un mensaje determinista basado en el perfil de la base de datos.
   */
  public renderResponse(profile: number, key: keyof ToneMatrix, tokens: Record<string, string> = {}): string {
    const activeProfile = (profile === 2) ? ToneProfile.CERCANO_COMERCIAL : ToneProfile.FORMAL_CORPORATIVO;
    let template = this.MATRICES[activeProfile][key];

    // Reemplazo atómico de variables
    Object.entries(tokens).forEach(([tokenKey, tokenValue]) => {
      template = template.replace(new RegExp(`{{${tokenKey}}}`, 'g'), tokenValue);
    });

    return template;
  }
}
