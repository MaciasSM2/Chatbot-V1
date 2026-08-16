/**
 * @file LightweightRagService.ts
 * @description Sistema de Retrieval-Augmented Generation (RAG) liviano basado en búsqueda de relevancias.
 * Soporta coincidencia léxica clásica y similitud vectorial densa (Qdrant + OpenAI Embeddings).
 */

import { OpenAiEmbeddingService } from './OpenAiEmbeddingService';
import { VectorDbGateway } from './VectorDbGateway';

export interface IRagChunk {
  id: string;
  content: string;
  score: number;
}

export class LightweightRagService {
  private readonly embeddingService: OpenAiEmbeddingService;
  private readonly vectorDb: VectorDbGateway;
  private static indexedCollections = new Set<string>();

  constructor() {
    this.embeddingService = new OpenAiEmbeddingService();
    this.vectorDb = new VectorDbGateway();
  }

  /**
   * Búsqueda semántica densa utilizando Qdrant y Embeddings de OpenAI.
   */
  public async extractRelevantContextVector(
    rawDocumentText: string,
    queryConsulta: string,
    tenantId: string,
    chatType: string,
    apiKey?: string,
    topK = 2
  ): Promise<string> {
    if (!rawDocumentText || rawDocumentText.trim().length === 0) {
      return 'No hay información documental configurada.';
    }

    // 1. Fragmentación en párrafos/bloques (Chunking)
    const chunksText = rawDocumentText
      .split(/\n\s*\n/)
      .filter((chunk) => chunk.trim().length > 30);

    if (chunksText.length === 0) {
      return rawDocumentText.substring(0, 1000);
    }

    const collectionName = `tenant_${tenantId}_collection`.toLowerCase().replace(/[^a-z0-9_]/g, '');

    // 2. Indexación bajo demanda (Lazy indexing) con embeddings paralelos
    if (!LightweightRagService.indexedCollections.has(collectionName)) {
      const embeddingResults = await Promise.allSettled(
        chunksText.map((text, i) =>
          this.embeddingService.getEmbedding(text, apiKey).then(vector => ({
            id: `chunk-${tenantId}-${chatType}-${i}`,
            vector,
            payload: { tenantId, chatType, content: text },
          }))
        )
      );

      const pointsToUpsert: any[] = [];
      for (const result of embeddingResults) {
        if (result.status === 'fulfilled') {
          pointsToUpsert.push(result.value);
        }
      }

      if (pointsToUpsert.length > 0) {
        await this.vectorDb.upsertPoints(collectionName, pointsToUpsert);
        LightweightRagService.indexedCollections.add(collectionName);
      }
    }

    // 3. Generar vector para la consulta del usuario
    const queryVector = await this.embeddingService.getEmbedding(queryConsulta, apiKey);

    // 4. Buscar vecinos más cercanos (Cosine Similarity)
    const nearest = await this.vectorDb.searchNearest(
      collectionName,
      queryVector,
      tenantId,
      chatType,
      topK
    );

    if (nearest.length === 0) {
      return this.extractRelevantContext(rawDocumentText, queryConsulta, topK); // Fallback lexical
    }

    return nearest.map(n => n.payload.content).join('\n---\n');
  }

  /**
   * Fragmenta el documento en bloques de texto y selecciona los K fragmentos con mayor coincidencia temática (Léxica).
   */
  public extractRelevantContext(rawDocumentText: string, queryConsulta: string, topK = 2): string {
    if (!rawDocumentText || rawDocumentText.trim().length === 0) {
      return 'No hay información documental configurada.';
    }

    const chunks = rawDocumentText
      .split(/\n\s*\n/)
      .filter((chunk) => chunk.trim().length > 30);

    if (chunks.length === 0) {
      return rawDocumentText.substring(0, 1000); // Fallback a recorte simple
    }

    const queryTerms = new Set(
      queryConsulta
        .toLowerCase()
        .replace(/[^a-z0-9áéíóúñ\s]/g, '')
        .split(/\s+/)
        .filter((word) => word.length > 3)
    );

    const scoredChunks: IRagChunk[] = chunks.map((content, index) => {
      const chunkWords = content.toLowerCase().split(/\s+/);
      let matches = 0;

      for (const word of chunkWords) {
        if (queryTerms.has(word)) {
          matches += 1;
        }
      }

      return {
        id: `chunk-${index}`,
        content: content.trim(),
        score: matches,
      };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const selectedChunks = scoredChunks.slice(0, topK).map((c) => c.content);

    return selectedChunks.join('\n---\n');
  }
}
