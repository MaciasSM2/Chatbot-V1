/**
 * @file MockUserFactory.ts
 * @description Generador e inyector de usuarios pre-configurados para escenarios de prueba (Andrés Valencia).
 */

import { Client } from "../entities/Client";
import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { MySQLClientRepository } from "../../providers/database/MySQLClientRepository";

export const MOCK_EXISTING_USER = new Client(
  "mock-andres-uuid",
  "TEST_BOT_DEBUG",
  "Andrés Felipe Valencia",
  true,
  {
    isVip: true,
    lastPurchaseDate: "2024-05-15",
    activeSubscription: "Premium",
    totalSpent: 450000,
    loyaltyPoints: 1250,
    preferredCategory: "Electrónica",
    tags: ["recurrente", "buen_pagador", "beta_tester"],
    city: "Medellín",
    identification: "1037654321",
    gender: "Masculino"
  }
);

/**
 * Inyecta al usuario maestro Andrés Valencia en los repositorios de persistencia
 */
export const injectMockUser = async (clientRepository: IClientRepository, _dbPool?: any) => {
  // 1. Guardar en memoria local
  MySQLClientRepository.inMemoryClients.set("TEST_BOT_DEBUG", MOCK_EXISTING_USER);
  
  // 2. Guardar en base de datos MySQL/MariaDB si está disponible
  try {
    await clientRepository.save(MOCK_EXISTING_USER);
    console.log("✅ Andrés Felipe Valencia guardado exitosamente.");
  } catch (err: any) {
    console.log("⚠️ No se pudo guardar Andrés Valencia (operando en memoria fallback)", err.message);
  }
  console.log("✅ Usuario de prueba 'Andrés' inyectado en InMemoryRepository");
};

/**
 * Limpia el usuario de prueba de los repositorios
 */
export const clearMockUser = async (_clientRepository: IClientRepository, dbPool?: any) => {
  MySQLClientRepository.inMemoryClients.delete("TEST_BOT_DEBUG");
  if (dbPool) {
    try {
      await dbPool.query("DELETE FROM clients WHERE phone_number = ?", ["TEST_BOT_DEBUG"]);
    } catch (e) {}
  }
  console.log("🗑️ Usuario de prueba 'TEST_BOT_DEBUG' limpiado.");
};
