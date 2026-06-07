/**
 * @file IBrandRepository.ts
 * @description Interfaz abstracta que define el comportamiento del repositorio de marca.
 */
import { BrandConfig } from '../../entities/BrandConfig';

export interface IBrandRepository {
  /**
   * Recupera la tupla única de configuración operativa de la marca de la empresa.
   */
  getConfig(): Promise<BrandConfig>;

  /**
   * Sobreescribe las variables de marca y comportamiento del asistente virtual.
   * @param config Entidad con las modificaciones de personalización simplificadas.
   */
  updateConfig(config: BrandConfig): Promise<boolean>;
}
