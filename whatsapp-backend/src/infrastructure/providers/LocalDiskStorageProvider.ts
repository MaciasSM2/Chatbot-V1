import { IStorageProvider } from '../../core/interfaces/providers/IStorageProvider';
import fs from 'fs/promises';
import path from 'path';

export class LocalDiskStorageProvider implements IStorageProvider {
  private readonly uploadDirectory: string;

  constructor() {
    // Almacenamiento persistente local en el servidor
    this.uploadDirectory = path.resolve(__dirname, '../../../../storage/ruts');
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDirectory, { recursive: true });
    } catch (error) {
      console.error('Error creando el directorio de carga local:', error);
    }
  }

  public async saveFile(fileBuffer: Buffer, fileName: string): Promise<string> {
    const safeFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const fullPath = path.join(this.uploadDirectory, safeFileName);
    
    // Escritura asíncrona no bloqueante en disco
    await fs.writeFile(fullPath, fileBuffer);
    
    // Retornamos la ruta relativa para persistencia en MariaDB
    return `/storage/ruts/${safeFileName}`;
  }
}
