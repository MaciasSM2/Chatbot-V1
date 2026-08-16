/**
 * @file SimulationInitializer.js
 * @description Prepara el entorno local para iniciar la conversación simulada.
 */

import { generateInitialFrame } from './SimulationService';

export const initializeSimulation = async (config: any) => {
  console.log("🛠️ Inicializando motor de simulación local...");

  // 1. Generamos el estado inicial (Frame)
  const firstFrame = generateInitialFrame(config);

  // 2. Preparamos el perfil del usuario local de pruebas
  const userId = "test_user_local";

  // 3. Si se inyectó un error de API, lo registramos en el sistema de logs
  if (config.apiStatus !== 'SUCCESS') {
    console.warn(`[Simulador] ⚠️ Alerta: Se ha inyectado un estado de red: ${config.apiStatus}`);
  }

  // Retornamos el estado inicial para que React lo pinte
  return {
    userId,
    firstFrame,
    ready: true
  };
};
