/**
 * @file IdentityValidator.js
 * @description Valida si el número existe en la BD local y personaliza el saludo.
 */

import { ClientPersistenceService } from './ClientPersistenceService';

export const validateAndPersonalizeGreeting = (phoneNumber) => {
  // 1. Buscamos en nuestra "Base de Datos" local
  const allClients = ClientPersistenceService.getAll();
  const foundClient = allClients.find(c => c.phone === phoneNumber);

  // 2. Definimos nuestra plantilla de saludo
  const greetingTemplate = "[TEST-COLOMBIA] [WEEKDAY] ¡Hola {{Nombre}}! 👋 Te saludamos con gusto. Qué bueno verte de nuevo por aquí.";

  if (foundClient) {
    // 3. Si existe, reemplazamos el placeholder
    const personalizedMessage = greetingTemplate.replace('{{Nombre}}', foundClient.fullName);
    
    return {
      isIdentified: true,
      message: personalizedMessage,
      clientData: foundClient
    };
  }

  // 4. Fallback si el número no está registrado (Aunque se marcó como existente)
  return {
    isIdentified: false,
    message: greetingTemplate.replace('{{Nombre}}', '(Usuario no identificado)'),
    clientData: null
  };
};
