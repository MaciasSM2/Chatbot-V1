/**
 * @file RutUploadMiddleware.ts
 * @description Middleware perimetral de carga de flujos seguro.
 * Protege al servidor de desbordamientos de RAM recolectando bytes mediante streams.
 */
import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export class RutUploadMiddleware {
  private readonly TARGET_DIR = path.join(process.cwd(), 'storage', 'rut');
  private readonly MAX_SIZE_BYTES = 5 * 1024 * 1024; // Límite estricto: 5 Megabytes

  constructor() {
    // Asegurar la existencia física del directorio de almacenamiento seguro en frío
    if (!fs.existsSync(this.TARGET_DIR)) {
      fs.mkdirSync(this.TARGET_DIR, { recursive: true });
    }
  }

  /**
   * Intercepta la solicitud HTTP POST de carga recolectando y validando los chunks de red.
   */
  public interceptBinaryStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      res.status(400).json({ success: false, error: 'Protocolo de carga incorrecto. Se requiere multipart/form-data.' });
      return;
    }

    let byteCounter = 0;
    const fileChunks: Buffer[] = [];
    const clientPhone = req.headers['x-client-phone'] as string;

    if (!clientPhone) {
      res.status(400).json({ success: false, error: 'Identificador x-client-phone mandatorio en la cabecera.' });
      return;
    }

    let limitExceeded = false;

    // Escuchar la transmisión reactiva de chunks binarios provenientes de la red WAN
    req.on('data', (chunk: Buffer) => {
      byteCounter += chunk.length;
      
      // BARRERA 1: Cortar la conexión si el payload intenta colapsar el almacenamiento
      if (byteCounter > this.MAX_SIZE_BYTES && !limitExceeded) {
        limitExceeded = true;
        req.destroy(); // Destrucción física inmediata del socket de red
        if (!res.headersSent) {
          res.status(413).json({ success: false, error: 'Exceso de peso: El archivo RUT supera el límite de 5MB.' });
        }
        return;
      }
      
      if (!limitExceeded) {
        fileChunks.push(chunk);
      }
    });

    req.on('end', async () => {
      try {
        const fullBuffer = Buffer.concat(fileChunks);
        if (fullBuffer.length === 0) {
          res.status(400).json({ success: false, error: 'Archivo vacío detectado en el stream.' });
          return;
        }

        // BARRERA 2: Validación técnica del Magic Number (Firma Real de PDF)
        // Los primeros 4 bytes de un PDF legítimo corresponden invariablemente a hexadecimal: 25 50 44 46 (%PDF)
        const fileSignature = fullBuffer.subarray(0, 4).toString('hex');
        if (fileSignature !== '25504446') {
          res.status(415).json({ success: false, error: 'Falsificación de tipo: El archivo binario no corresponde a un PDF legítimo.' });
          return;
        }

        // BARRERA 3: Sanitización e Inmutabilidad de Nombres
        const fileHash = crypto.createHash('sha256').update(`${clientPhone}-${Date.now()}`).digest('hex');
        const secureFileName = `RUT-${fileHash}.pdf`;
        const absoluteDiskPath = path.join(this.TARGET_DIR, secureFileName);

        // Volcar el buffer purificado de la memoria RAM de forma síncrona al disco duro
        await fs.promises.writeFile(absoluteDiskPath, fullBuffer);

        // Inyectar la ruta relativa sanitizada dentro del objeto Request para consumo del controlador
        (req as any).sanitizedUploadedFilePath = `/storage/rut/${secureFileName}`;
        
        return next();
      } catch (exception: any) {
        res.status(500).json({ success: false, error: `Fallo interno del colector de flujos: ${exception.message}` });
      }
    });

    req.on('error', (err) => {
      res.status(500).json({ success: false, error: `Error en la tubería de red de datos: ${err.message}` });
    });
  };
}
