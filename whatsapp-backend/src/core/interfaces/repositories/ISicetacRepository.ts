export interface SicetacRoute {
  id: number;
  origin: string;
  destination: string;
  baseCost: number;
  estimatedHours: number;
}

export interface ISicetacRepository {
  /**
   * Busca un trayecto específico en la matriz del Ministerio de Transporte.
   */
  getRouteCost(origin: string, destination: string): Promise<SicetacRoute | null>;
}
