/**
 * @file OpenAiEmbeddingService.ts
 * @description Servicio encargado de generar vectores de embeddings densos (1536 dimensiones) usando OpenAI.
 */

import OpenAI from 'openai';

export class OpenAiEmbeddingService {
  /**
   * Genera el vector de embeddings para el texto provisto.
   * Si no se provee API Key (modo desarrollo/demo), genera un vector determinista simulado de 1536 dimensiones.
   * 
   * @param text Texto a vectorizar.
   * @param apiKey Opcional API Key de OpenAI.
   */
  public async getEmbedding(text: string, apiKey?: string): Promise<number[]> {
    if (!apiKey) {
      // Modo Demo/Pruebas: Generar vector determinista simulado basado en el contenido del texto
      const dims = 1536;
      const embedding: number[] = new Array(dims).fill(0);
      
      // Sembrar generador determinista básico usando los caracteres del texto
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
      }

      for (let j = 0; j < dims; j++) {
        const seed = Math.sin(hash + j) * 10000;
        embedding[j] = seed - Math.floor(seed);
      }

      // Normalización básica L2 para similitud de coseno directa
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / (magnitude || 1));
    }

    try {
      const openai = new OpenAI({ apiKey });
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });

      const vector = response.data[0]?.embedding;
      if (!vector) {
        throw new Error('No se recibió el vector de embeddings del modelo de OpenAI.');
      }

      return vector;
    } catch (err: any) {
      throw new Error(`[OpenAiEmbeddingService Error] Falló la creación del embedding: ${err.message}`);
    }
  }
}
