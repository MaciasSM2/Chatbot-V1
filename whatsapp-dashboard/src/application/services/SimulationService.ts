/**
 * @file SimulationService.js
 * @description Genera el punto de entrada lógico basado en el escenario del Wizard.
 */

export const generateInitialFrame = (config: any) => {
  const now = new Date();
  const isNight = config.timeContext === 'night';
  const isHoliday = config.timeContext === 'holiday';
  
  let initialMessage = "";
  let fsmTarget = config.initialState;

  // 1. Lógica de Mensaje según Contexto Temporal
  if (isHoliday) {
    initialMessage = "¡Hola! 👋 Te saludamos de [Empresa]. Hoy es día festivo en Colombia 🇨🇴, por lo que nuestra respuesta podría tardar un poco más. ¡Cuéntanos en qué podemos ayudarte!";
  } else if (isNight) {
    initialMessage = "Hola, buenas noches. 🌙 En este momento nuestro equipo humano no está en línea, pero soy tu asistente virtual y puedo adelantarte información. ¿Qué necesitas?";
  } else {
    initialMessage = config.userType === 'new' 
      ? "¡Hola! Bienvenido. ✨ Veo que es tu primera vez por aquí. ¿Podrías indicarme tu nombre para empezar?"
      : "¡Hola de nuevo! 👋 Qué gusto saludarte otra vez. ¿Continuamos con tu solicitud anterior o necesitas algo nuevo?";
  }

  // 2. Ajuste forzado de FSM si el usuario es nuevo
  if (config.userType === 'new' && fsmTarget === 'GREETING') {
    fsmTarget = 'AWAITING_REGISTRATION';
  }

  return {
    id: `sim_bot_${Date.now()}`,
    text: initialMessage,
    state: fsmTarget,
    timestamp: now.toISOString(),
    sender: 'bot',
    status: 'read',
    metadata: {
      simulationMode: true,
      injectedError: config.apiStatus !== 'SUCCESS'
    }
  };
};
