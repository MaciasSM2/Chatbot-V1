/**
 * @file ILiquidationEngine.ts
 * @description Contrato abstracto para el cálculo financiero de fletes pesados.
 */
export interface ILiquidationEngine {
  calculateFreight(
    origin: string,
    destination: string,
    weightTons: number,
    vehicleType: 'TURBO' | 'SENCILLO' | 'MINI_VANS'
  ): Promise<number>;
}
