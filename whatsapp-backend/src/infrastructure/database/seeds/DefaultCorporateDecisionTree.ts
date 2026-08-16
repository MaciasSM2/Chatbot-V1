/**
 * @file DefaultCorporateDecisionTree.ts
 * @description Plantilla estandarizada de 20 reglas deterministas para atención corporativa.
 * Diseñada para soportar el Chat 1 (Full JS) y el Fast-Path del Chat 2 (Híbrido).
 */

import { IDecisionNode } from '../../../core/domain/entities/DecisionTreeRule';

export const CORPORATE_DECISION_TREE_20: readonly IDecisionNode[] = [
  // 1. SALUDO E INICIO DE CONVERSACIÓN
  {
    id: 'node-01-greeting',
    category: 'FLOW',
    triggers: ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'inicio', 'empezar', 'menu'],
    responseText: 
      '👋 ¡Hola! Bienvenido al centro de atención al cliente de **ProChat Enterprise**.\n\n' +
      'Por favor, selecciona una opción para ayudarte:\n' +
      '1️⃣ Información corporativa y servicios\n' +
      '2️⃣ Agendar o consultar una cita / servicio\n' +
      '3️⃣ Métodos de pago y facturación\n' +
      '4️⃣ Estado de una solicitud o pedido\n' +
      '5️⃣ Hablar directamente con un asesor humano',
    actionType: 'MESSAGE_ONLY',
    nextExpectedState: 'AWAITING_MAIN_MENU_OPTION',
  },

  // 2. INFORMACIÓN GENERAL DE LA EMPRESA
  {
    id: 'node-02-company-info',
    category: 'CORPORATE',
    triggers: ['quienes son', 'empresa', 'informacion de la empresa', 'mision', 'a que se dedican', '1'],
    responseText: 
      '🏢 **Sobre ProChat Enterprise**:\n' +
      'Somos líderes en soluciones de software de automatización y orquestación de comunicaciones corporativas. ' +
      'Ofrecemos plataformas SaaS modulares, soporte logístico y asistentes inteligentes para empresas de alto volumen.',
    actionType: 'MESSAGE_ONLY',
  },

  // 3. HORARIOS DE ATENCIÓN Y UBICACIÓN
  {
    id: 'node-03-location-hours',
    category: 'CORPORATE',
    triggers: ['horario', 'donde estan ubicados', 'direccion', 'oficina', 'donde quedan', 'atencion'],
    responseText: 
      '📍 **Ubicación y Horarios de Atención**:\n\n' +
      '• **Oficina Principal**: Calle 10 # 40-20, Centro Empresarial, Medellín, Colombia.\n' +
      '• **Horario Presencial y Telefónico**: Lunes a Viernes de 8:00 AM a 6:00 PM.\n' +
      '• **Atención Bot WhatsApp**: 24/7 activo.',
    actionType: 'MESSAGE_ONLY',
  },

  // 4. CATÁLOGO DE SERVICIOS
  {
    id: 'node-04-services-menu',
    category: 'CORPORATE',
    triggers: ['servicios', 'catalogo', 'portafolio', 'que ofrecen', 'planes'],
    responseText: 
      '🛠️ **Nuestro Portafolio de Servicios**:\n\n' +
      '1. **Chatbots Multimotor**: Full JS, Híbrido e IA Generativa.\n' +
      '2. **Integración CRM / ERP**: Conexión con sistemas de gestión empresarial.\n' +
      '3. **Motor Logístico SICE-TAC**: Liquidación automática de fletes de transporte.\n\n' +
      'Si deseas cotizar o agendar un servicio, escribe **"Cotizar"**.',
    actionType: 'MESSAGE_ONLY',
  },

  // 5. INICIO DE PROCESO / REGISTRO
  {
    id: 'node-05-quote-appointment-start',
    category: 'DATA_CAPTURE',
    triggers: ['cotizar', 'cita', 'agendar', 'solicitar servicio', '2'],
    responseText: 
      '📝 ¡Excelente! Para iniciar tu proceso de agenda o cotización, necesitamos unos datos básicos.\n\n' +
      'Por favor, escribe tu **Nombre y Apellido completo**:',
    actionType: 'CAPTURE_NAME',
    nextExpectedState: 'AWAITING_NAME_INPUT',
  },

  // 6. CAPTURA DE NOMBRE Y SOLICITUD DE DOCUMENTO
  {
    id: 'node-06-capture-name',
    category: 'DATA_CAPTURE',
    triggers: ['mi nombre es', 'me llamo'],
    responseText: 
      '👍 Gracias. Ahora, por favor ingresa tu **Número de Cédula o NIT** (sin puntos ni guiones) para validarte en el sistema:',
    actionType: 'CAPTURE_DOCUMENT',
    nextExpectedState: 'AWAITING_DOCUMENT_INPUT',
  },

  // 7. CAPTURA DE DOCUMENTO Y SOLICITUD DE CONTACTO
  {
    id: 'node-07-capture-document',
    category: 'DATA_CAPTURE',
    triggers: ['cedula', 'nit', 'documento'],
    responseText: 
      '✅ Documento registrado correctamente.\n\n' +
      'Por favor, facilítanos tu **Correo Electrónico** de contacto para enviarte la confirmación:',
    actionType: 'CAPTURE_CONTACT',
    nextExpectedState: 'AWAITING_CONTACT_INPUT',
  },

  // 8. SOLICITUD DE FECHA Y HORA DE CITA
  {
    id: 'node-08-schedule-date',
    category: 'DATA_CAPTURE',
    triggers: ['correo', 'email', 'telefono'],
    responseText: 
      '📅 Por favor, indica la **Fecha y Hora de preferencia** para tu cita o atención (Ej: Mañana a las 10 AM, o 15 de Agosto 2:00 PM):',
    actionType: 'SCHEDULE_DATE',
    nextExpectedState: 'AWAITING_DATE_INPUT',
  },

  // 9. CONFIRMACIÓN Y REGISTRO DE CITA
  {
    id: 'node-09-confirm-appointment',
    category: 'FLOW',
    triggers: ['confirmar fecha', 'fecha seleccionada'],
    responseText: 
      '🎉 ¡Tu solicitud de cita ha sido pre-registrada con éxito!\n\n' +
      'Un resumen de los detalles ha sido guardado. Recibirás un correo de confirmación a la brevedad.',
    actionType: 'MESSAGE_ONLY',
  },

  // 10. MÉTODOS DE PAGO Y FACTURACIÓN
  {
    id: 'node-10-payment-billing',
    category: 'CORPORATE',
    triggers: ['pagos', 'pagar', 'factura', 'cuenta bancaria', 'tarjeta', 'pse', '3'],
    responseText: 
      '💳 **Información de Pagos y Facturación**:\n\n' +
      '• **Transferencias Bancarias**: Bancolombia / Davivienda Ahorros.\n' +
      '• **Pagos En Línea**: Aceptamos tarjetas de crédito y PSE.\n' +
      '• **Facturación Electrónica**: Se genera automáticamente tras la validación de tu pago.',
    actionType: 'MESSAGE_ONLY',
  },

  // 11. CONSULTA DE ESTADO DE PEDIDO / TICKET
  {
    id: 'node-11-order-status',
    category: 'FLOW',
    triggers: ['estado', 'mi pedido', 'seguimiento', 'rastreo', 'ticket', '4'],
    responseText: 
      '🔍 Para consultar el estado de tu ticket o servicio activo, por favor escribe tu **Número de Radicado o Cédula**:',
    actionType: 'MESSAGE_ONLY',
  },

  // 12. SOPORTE TÉCNICO Y RECLAMACIONES
  {
    id: 'node-12-claims-support',
    category: 'SUPPORT',
    triggers: ['queja', 'reclamo', 'soporte', 'falla', 'malo', 'garantia', 'problema'],
    responseText: 
      '⚠️ Lementamos los inconvenientes. Tu satisfacción es nuestra prioridad.\n\n' +
      'Hemos derivado tu caso al área de **Garantía y Soporte Especializado**. ' +
      'Un agente revisará tu caso en un tiempo máximo de 15 minutos.',
    actionType: 'HUMAN_HANDOFF',
    requiresHumanEscalation: true,
  },

  // 13. SOLICITUD DIRECTA DE ASESOR HUMANO
  {
    id: 'node-13-human-handoff',
    category: 'SUPPORT',
    triggers: ['asesor', 'humano', 'persona', 'agente', 'hablar con alguien', '5'],
    responseText: 
      '👨💼 Entendido. Te estamos transfiriendo en este momento con un **Asesor Humano** de nuestro equipo.\n\n' +
      '⏱️ *Tiempo estimado de espera*: 2 minutos. Por favor no cierres la ventana.',
    actionType: 'HUMAN_HANDOFF',
    requiresHumanEscalation: true,
  },

  // 14. PRIMER AVISO POR INACTIVIDAD EN CHAT
  {
    id: 'node-14-inactivity-warning',
    category: 'SYSTEM',
    triggers: ['_SYSTEM_INACTIVITY_WARN_'],
    responseText: 
      '⏳ ¿Sigues allí? Notamos que no has respondido en los últimos minutos.\n\n' +
      'Si deseas continuar con la atención, responde a este mensaje o selecciona una opción del menú.',
    actionType: 'INACTIVITY_WARN',
  },

  // 15. CIERRE DE SESIÓN POR INACTIVIDAD PROLONGADA
  {
    id: 'node-15-inactivity-timeout',
    category: 'SYSTEM',
    triggers: ['_SYSTEM_INACTIVITY_CLOSE_'],
    responseText: 
      '🔒 Por motivos de seguridad y para liberar nuestros canales, hemos finalizado la sesión por inactividad.\n\n' +
      'Escribe **"Hola"** en cualquier momento si deseas iniciar una nueva conversación. ¡Que tengas un excelente día!',
    actionType: 'INACTIVITY_CLOSE',
  },

  // 16. CANCELACIÓN VOLUNTARIA DE PROCESO
  {
    id: 'node-16-process-cancel',
    category: 'FLOW',
    triggers: ['cancelar', 'salir', 'reiniciar', 'abortar', 'borrar'],
    responseText: 
      '🚫 Hemos cancelado el proceso actual y limpiado la información temporal.\n\n' +
      'Escribe **"Menú"** para regresar al inicio cuando lo desees.',
    actionType: 'CANCEL_PROCESS',
  },

  // 17. VERIFICACIÓN DE CONTINUIDAD
  {
    id: 'node-17-anything-else',
    category: 'FLOW',
    triggers: ['gracias', 'listo', 'entendido', 'resuelto', 'ok'],
    responseText: 
      '👍 ¡Con mucho gusto! ¿Existe alguna otra duda o consulta en la que pueda ayudarte el día de hoy?\n\n' +
      '• Responde **"Si"** para volver al Menú Principal.\n' +
      '• Responde **"No"** para finalizar la atención.',
    actionType: 'MESSAGE_ONLY',
  },

  // 18. ATENCIÓN FUERA DE HORARIO LABORAL
  {
    id: 'node-18-off-hours-notice',
    category: 'SYSTEM',
    triggers: ['_SYSTEM_OFF_HOURS_'],
    responseText: 
      '🌙 Actualmente nuestro equipo humano se encuentra fuera del horario laboral (Lunes a Viernes 8 AM - 6 PM).\n\n' +
      'Sin embargo, puedes realizar consultas automáticas con nuestro bot o dejar tu mensaje grabado para ser contactado a primera hora de la mañana.',
    actionType: 'MESSAGE_ONLY',
  },

  // 19. RESPUESTA NO RECONOCIDA / FALLBACK LOCAL
  {
    id: 'node-19-fallback-unknown',
    category: 'SYSTEM',
    triggers: ['_SYSTEM_UNKNOWN_FALLBACK_'],
    responseText: 
      '🤖 No he logrado comprender tu solicitud con exactitud.\n\n' +
      'Por favor, selecciona una de las siguientes opciones:\n' +
      '• Escribe **"Menú"** para ver las opciones automáticas.\n' +
      '• Escribe **"Asesor"** para hablar con un agente humano.',
    actionType: 'MESSAGE_ONLY',
    requiresHumanEscalation: false,
  },

  // 20. DESPEDIDA CORDIAL
  {
    id: 'node-20-farewell',
    category: 'FLOW',
    triggers: ['chao', 'adios', 'hasta luego', 'no gracias', 'nos vemos', 'finalizar'],
    responseText: 
      '🌟 Muchas gracias por comunicarte con **ProChat Enterprise**.\n' +
      'Fue un placer atenderte. ¡Te deseamos un feliz y productivo día! 👋',
    actionType: 'MESSAGE_ONLY',
  },
];
