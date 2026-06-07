/**
 * @file IStorageProvider.ts
 * @description Contrato abstracto para el sistema de almacenamiento de archivos de la plataforma.
 */
export interface IStorageProvider {
  /**
   * Almacena un archivo binario en la infraestructura configurada.
   * @param fileBuffer Buffer de datos del archivo.
   * @param fileName Nombre único asignado al archivo.
   * @returns Ruta de acceso pública o local mapeada.
   */
  saveFile(fileBuffer: Buffer, fileName: string): Promise<string>;
}
