/**
 * @file WhatsAppMediaStorageGateway.ts
 * @description Pasarela de red encargada de interactuar con el repositorio multimedia de Facebook Graph.
 * Descarga y almacena de forma inmutable los archivos adjuntos enviados por los usuarios.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import logger from '../logging/Logger';

export class WhatsAppMediaStorageGateway {
  private readonly META_BASE_URL = 'https://graph.facebook.com/v21.0';
  private readonly BEARER_ACCESS_TOKEN: string;
  private readonly LOCAL_STORAGE_DIR = path.join(process.cwd(), 'storage', 'attachments');

  constructor() {
    this.BEARER_ACCESS_TOKEN = process.env.WA_ACCESS_TOKEN || 'fallback_secure_token';
    
    if (!fs.existsSync(this.LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(this.LOCAL_STORAGE_DIR, { recursive: true });
    }
  }

  /**
   * Extrae un archivo desde los servidores de Meta y lo deposita de forma segura en el almacenamiento en frío del servidor.
   * @returns La ruta relativa del archivo guardado para su posterior renderizado en Next.js
   */
  public async downloadAndPersistMetaMedia(mediaId: string, expectedMimeType: string): Promise<string | null> {
    logger.info(`📥 [Media Gateway] Iniciando pipeline de rescate para el adjunto Meta ID: ${mediaId}`);
    
    const abortNetworkController = new AbortController();
    const timeoutId = setTimeout(() => abortNetworkController.abort(), 12000); // Límite estricto: 12 segundos

    try {
      const metaMetadataResponse = await fetch(`${this.META_BASE_URL}/${mediaId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.BEARER_ACCESS_TOKEN}` },
        signal: abortNetworkController.signal
      });

      if (!metaMetadataResponse.ok) {
        throw new Error(`Meta Graph rechazó la consulta del recurso con estado: ${metaMetadataResponse.status}`);
      }

      const mediaJsonBody = await metaMetadataResponse.json() as any;
      const secureDownloadUrl = mediaJsonBody.url;

      if (!secureDownloadUrl) {
        throw new Error('La respuesta de Meta Graph no incorporó una URL de descarga válida.');
      }

      const binaryDownloadResponse = await fetch(secureDownloadUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.BEARER_ACCESS_TOKEN}` },
        signal: abortNetworkController.signal
      });

      clearTimeout(timeoutId);

      if (!binaryDownloadResponse.ok) {
        throw new Error(`La CDN de Meta rechazó el vaciado de bytes con estado: ${binaryDownloadResponse.status}`);
      }

      const mediaBlobBuffer = Buffer.from(await binaryDownloadResponse.arrayBuffer());

      const fileExtension = expectedMimeType.includes('pdf') ? 'pdf' : expectedMimeType.includes('png') ? 'png' : 'jpg';
      const fileHashName = crypto.createHash('sha256').update(`${mediaId}-${Date.now()}`).digest('hex');
      const uniqueFileName = `ATTACH-${fileHashName}.${fileExtension}`;
      const absoluteDiskPath = path.join(this.LOCAL_STORAGE_DIR, uniqueFileName);

      await fs.promises.writeFile(absoluteDiskPath, mediaBlobBuffer);
      
      const relativeWebPath = `/storage/attachments/${uniqueFileName}`;
      logger.info(`✅ [Media Gateway Success] Archivo consolidado físicamente en disco: ${relativeWebPath}`);
      
      return relativeWebPath;

    } catch (mediaException: any) {
      clearTimeout(timeoutId);
      logger.error(`❌ [Media Gateway Failure] Colapsó la extracción del adjunto multimedia de WhatsApp: ${mediaException.message}`);
      return null;
    }
  }
}
