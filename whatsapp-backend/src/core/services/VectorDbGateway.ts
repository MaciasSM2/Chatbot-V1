/**
 * @file VectorDbGateway.ts
 * @description Pasarela de comunicación REST hacia Qdrant Vector Database.
 * Permite indexar fragmentos y realizar búsquedas por similitud coseno con tolerancia a fallos.
 */

import logger from '../../infrastructure/logging/Logger';

export interface IIndexedChunk {
  id: string;
  vector: number[];
  payload: {
    tenantId: string;
    chatType: string;
    content: string;
  };
}

export interface ISearchResult {
  id: string | number;
  score: number;
  payload: {
    tenantId: string;
    chatType: string;
    content: string;
  };
}

export class VectorDbGateway {
  private readonly qdrantUrl: string;
  private static inMemoryVectorStore = new Map<string, IIndexedChunk[]>();

  constructor() {
    const host = process.env.QDRANT_HOST || '127.0.0.1';
    const port = process.env.QDRANT_PORT || '6333';
    this.qdrantUrl = `http://${host}:${port}`;
  }

  /**
   * Inicializa la colección en Qdrant si no existe.
   */
  public async ensureCollection(collectionName: string): Promise<void> {
    if (process.env.NODE_ENV === 'test') return;

    try {
      const res = await fetch(`${this.qdrantUrl}/collections/${collectionName}`);
      if (res.ok) return; // Colección ya existe

      // Crear colección con 1536 dimensiones (OpenAI standard) y distancia Coseno
      await fetch(`${this.qdrantUrl}/collections/${collectionName}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vectors: {
            size: 1536,
            distance: 'Cosine',
          },
        }),
      });
    } catch {
      logger.warn('[VectorDb] Qdrant no disponible. Usando almacenamiento en memoria.');
    }
  }

  /**
   * Registra o actualiza puntos vectoriales en la colección de Qdrant.
   */
  public async upsertPoints(collectionName: string, points: IIndexedChunk[]): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      const current = VectorDbGateway.inMemoryVectorStore.get(collectionName) || [];
      // Filtrar y reemplazar duplicados
      const next = current.filter(c => !points.some(p => p.id === c.id)).concat(points);
      VectorDbGateway.inMemoryVectorStore.set(collectionName, next);
      return;
    }

    try {
      await this.ensureCollection(collectionName);

      const batch = points.map(p => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      }));

      await fetch(`${this.qdrantUrl}/collections/${collectionName}/points?wait=true`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: batch }),
      });
    } catch {
      logger.warn('[VectorDb] upsertPoints falló. Almacenando en memoria.');
      const current = VectorDbGateway.inMemoryVectorStore.get(collectionName) || [];
      const next = current.filter(c => !points.some(p => p.id === c.id)).concat(points);
      VectorDbGateway.inMemoryVectorStore.set(collectionName, next);
    }
  }

  /**
   * Realiza la búsqueda por similitud del vector consultante en la colección del Tenant.
   */
  public async searchNearest(
    collectionName: string,
    queryVector: number[],
    tenantId: string,
    chatType: string,
    topK = 2
  ): Promise<ISearchResult[]> {
    // Si estamos en test o Qdrant ya cayó a fallback, usar memoria
    if (process.env.NODE_ENV === 'test' || VectorDbGateway.inMemoryVectorStore.has(collectionName)) {
      return this.searchInMemory(collectionName, queryVector, tenantId, chatType, topK);
    }

    try {
      const response = await fetch(`${this.qdrantUrl}/collections/${collectionName}/points/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: queryVector,
          limit: topK,
          filter: {
            must: [
              { key: 'tenantId', match: { value: tenantId } },
              { key: 'chatType', match: { value: chatType } },
            ],
          },
          with_payload: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Fallo en la consulta HTTP de Qdrant');
      }

      const json = (await response.json()) as any;
      const results = json.result || [];
      
      return results.map((r: any) => ({
        id: r.id,
        score: r.score,
        payload: r.payload,
      }));
    } catch {
      logger.warn('[VectorDb] searchNearest falló. Usando búsqueda en memoria.');
      return this.searchInMemory(collectionName, queryVector, tenantId, chatType, topK);
    }
  }

  /**
   * Algoritmo de similitud coseno fallback en memoria.
   */
  private searchInMemory(
    collectionName: string,
    queryVector: number[],
    tenantId: string,
    chatType: string,
    topK: number
  ): ISearchResult[] {
    const chunks = VectorDbGateway.inMemoryVectorStore.get(collectionName) || [];
    
    // Filtrar por Tenant y Tipo de Chat
    const filtered = chunks.filter(
      c => c.payload.tenantId === tenantId && c.payload.chatType === chatType
    );

    const scored = filtered.map(c => {
      // Similitud coseno: dot product de vectores unitarios normalizados
      let dotProduct = 0;
      for (let i = 0; i < queryVector.length; i++) {
        dotProduct += (queryVector[i] || 0) * (c.vector[i] || 0);
      }
      return {
        id: c.id,
        score: dotProduct,
        payload: c.payload,
      };
    });

    // Ordenar de mayor a menor puntuación
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}
