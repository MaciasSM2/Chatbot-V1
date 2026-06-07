/**
 * @file IndexedDbClientRepository.ts
 * @description Repositorio en Frontend basado en la API nativa IndexedDB de la W3C.
 * Resuelve el hallazgo B13 introduciendo persistencia no bloqueante y sincronización con marcas de tiempo.
 */
import { IClientCrmEntity } from '../../core/interfaces/CrmNetworkContracts';
import { executeSecureRequest, getApiUrl } from '../../core/apiClient';

export interface IOfflinePayload extends IClientCrmEntity {
  sync_status: 'PENDING' | 'SYNCHRONIZED';
  local_mutation_timestamp: number;
}

export class IndexedDbClientRepository {
  private readonly DB_NAME = 'ProChat_Offline_Mesh';
  private readonly STORE_NAME = 'prospects_cache';
  private readonly DB_VERSION = 1;
  private dbInstance: IDBDatabase | null = null;

  /**
   * Inicializa y abre de forma asíncrona la conexión con el motor relacional del navegador.
   */
  public initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const dbRequest = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      dbRequest.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(this.STORE_NAME)) {
          const objectStore = database.createObjectStore(this.STORE_NAME, { keyPath: 'phone_number' });
          objectStore.createIndex('idx_sync_status', 'sync_status', { unique: false });
        }
      };

      dbRequest.onsuccess = (event: Event) => {
        this.dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      dbRequest.onerror = () => {
        reject(new Error('IndexedDB: Denegado el acceso al almacenamiento físico del navegador.'));
      };
    });
  }

  /**
   * Escribe o actualiza un cliente localmente marcándolo en estado pendiente si no hay red activa.
   */
  public saveLocally(client: IClientCrmEntity, isOnline: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.dbInstance) return reject(new Error('Almacén IndexedDB no inicializado.'));

      const transaction = this.dbInstance.transaction([this.STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(this.STORE_NAME);

      const offlinePayload: IOfflinePayload = {
        ...client,
        sync_status: isOnline ? 'SYNCHRONIZED' : 'PENDING',
        local_mutation_timestamp: Date.now()
      };

      const putRequest = objectStore.put(offlinePayload);

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(new Error('IndexedDB: Error en la escritura del bloque.'));
    });
  }

  /**
   * Recupera la totalidad de los prospectos desde la memoria intermedia del navegador para mitigar demoras de red.
   */
  public getAllCachedProspects(): Promise<IOfflinePayload[]> {
    return new Promise((resolve, reject) => {
      if (!this.dbInstance) return resolve([]);

      const transaction = this.dbInstance.transaction([this.STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(this.STORE_NAME);
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
      getAllRequest.onerror = () => reject(new Error('IndexedDB: Error leyendo registros.'));
    });
  }

  /**
   * Motor de Reconciliación: Extrae las mutaciones offline y las vuelca de forma atómica hacia MariaDB.
   */
  public async flushOfflineQueueToServer(): Promise<void> {
    if (!this.dbInstance || !navigator.onLine) return;

    const transaction = this.dbInstance.transaction([this.STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(this.STORE_NAME);
    const syncIndex = objectStore.index('idx_sync_status');

    const pendingRecordsRequest = syncIndex.getAll(IDBKeyRange.only('PENDING'));

    pendingRecordsRequest.onsuccess = async () => {
      const pendingCollection: IOfflinePayload[] = pendingRecordsRequest.result || [];
      if (pendingCollection.length === 0) return;

      console.log(`🔄 [Offline Engine] Detectados ${pendingCollection.length} cambios rezagados. Reconciliando...`);

      for (const localNode of pendingCollection) {
        try {
          const result = await executeSecureRequest(`${getApiUrl()}/admin/crm/clients/sync`, {
            method: 'POST',
            body: JSON.stringify(localNode)
          });

          if (result.success) {
            const readTransaction = this.dbInstance!.transaction([this.STORE_NAME], 'readwrite');
            const updateStore = readTransaction.objectStore(this.STORE_NAME);
            
            localNode.sync_status = 'SYNCHRONIZED';
            updateStore.put(localNode);
          }
        } catch (netErr) {
          console.error(`[Sync Loop Fail] Servidor no asimiló la ficha ${localNode.phone_number}:`, netErr);
          break; 
        }
      }
    };
  }
}
