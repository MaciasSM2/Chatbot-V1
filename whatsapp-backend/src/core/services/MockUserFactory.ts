/**
 * @file MockUserFactory.ts
 * @description Generador e inyector de usuarios pre-configurados para escenarios de prueba (Andrés Valencia).
 */

import { Client } from "../entities/Client";
import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { PostgresClientRepository } from "../../providers/database/PostgresClientRepository";
import { Pool } from "pg";

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
export const injectMockUser = async (clientRepository: IClientRepository, dbPool?: Pool) => {
  // 1. Guardar en memoria local
  PostgresClientRepository.inMemoryClients.set("TEST_BOT_DEBUG", MOCK_EXISTING_USER);
  
  // 2. Guardar en base de datos Postgres si está disponible
  if (dbPool) {
    try {
      await dbPool.query(
        `INSERT INTO clients (id, phone_number, name, is_registered, metadata) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (phone_number) 
         DO UPDATE SET name = $3, is_registered = $4, metadata = $5`,
        [
          MOCK_EXISTING_USER.id, 
          MOCK_EXISTING_USER.phoneNumber, 
          MOCK_EXISTING_USER.name, 
          MOCK_EXISTING_USER.isRegistered, 
          JSON.stringify(MOCK_EXISTING_USER.metadata)
        ]
      );
      console.log("✅ Andrés Felipe Valencia guardado exitosamente en Postgres.");
    } catch (err) {
      console.log("⚠️ No se pudo guardar Andrés Valencia en Postgres (operando en memoria fallback)");
    }
  }
  console.log("✅ Usuario de prueba 'Andrés' inyectado en InMemoryRepository");
};

/**
 * Limpia el usuario de prueba de los repositorios
 */
export const clearMockUser = async (clientRepository: IClientRepository, dbPool?: Pool) => {
  PostgresClientRepository.inMemoryClients.delete("TEST_BOT_DEBUG");
  if (dbPool) {
    try {
      await dbPool.query("DELETE FROM clients WHERE phone_number = $1", ["TEST_BOT_DEBUG"]);
    } catch (e) {}
  }
  console.log("🗑️ Usuario de prueba 'TEST_BOT_DEBUG' limpiado.");
};
