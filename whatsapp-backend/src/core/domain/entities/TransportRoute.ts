/**
 * @file TransportRoute.ts
 * @description Entidad de dominio que representa un tramo logístico regulado en Antioquia.
 */
export interface TransportRoute {
  originId: string;         // Ej: 'MEDELLIN'
  destinationId: string;    // Ej: 'RIONEGRO', 'LA_ESTRELLA', 'CALDAS'
  baseCost: number;         // Tarifa base SICE-TAC regulada
  costPerTon: number;       // Factor multiplicador por peso
  peajesCount: number;      // Número de peajes en la infraestructura vial
}
