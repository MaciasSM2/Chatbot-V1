/**
 * @file ClientPersistenceService.js
 * @description Maneja el almacenamiento de clientes registrados en LocalStorage (soporta llaves unificadas).
 */

export const ClientPersistenceService = {
  // Obtener todos los clientes (Historial)
  getAll: () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('simulator_clients_db') || localStorage.getItem('registered_users');
    return data ? JSON.parse(data) : [];
  },

  // Guardar o actualizar un cliente
  save: (clientData, source) => {
    if (typeof window === 'undefined') return null;
    const clients = ClientPersistenceService.getAll();
    
    const newClient = {
      id: clientData.id || Date.now().toString(),
      phone: clientData.phone || '',
      fullName: clientData.fullName || 'Sin Nombre',
      identification: clientData.identification || 'N/A',
      gender: clientData.gender || 'No especificado',
      registrationDate: new Date().toISOString(),
      source: source || 'wizard'
    };

    // Evitar duplicados por teléfono
    const filteredClients = clients.filter(c => c.phone !== newClient.phone);
    const updatedClients = [newClient, ...filteredClients];

    // Persistir en ambas llaves para compatibilidad total con FSM y vistas de historial
    localStorage.setItem('simulator_clients_db', JSON.stringify(updatedClients));
    localStorage.setItem('registered_users', JSON.stringify(updatedClients));
    return newClient;
  }
};
