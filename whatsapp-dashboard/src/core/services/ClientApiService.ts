import { getApiUrl, executeSecureRequest } from "../apiClient";
import { IClientCrmEntity, CrmApiResponse } from '../interfaces/CrmNetworkContracts';

export interface IClient {
  id: string;
  phoneNumber: string;
  name: string | null;
  isRegistered: boolean;
  metadata?: Record<string, any>;
  state?: string | null;
}

export class ClientApiService {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = `${baseUrl || getApiUrl()}/admin/crm/clients`;
  }

  /**
   * Obtiene la colección completa de prospectos desde la central relacional de datos.
   */
  public async fetchAllProspects(): Promise<IClientCrmEntity[]> {
    try {
      // Consumir el cliente unificado inyectando los contratos de dominio estrictos
      const response: CrmApiResponse<IClientCrmEntity[]> = await executeSecureRequest(this.baseUrl);
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return [];
    } catch (networkException) {
      console.error('❌ [ClientApiService Strict Error] Falló la descarga del CRM:', networkException);
      throw networkException; // Lanza la excepción tipada para que la capture el Toast Notification Provider
    }
  }

  public async getClients(): Promise<IClient[]> {
    const result: any = await executeSecureRequest(this.baseUrl);
    return (result.data || result).map((item: any) => ({
      id: item.id,
      phoneNumber: item.phoneNumber || item.phone_number,
      name: item.name,
      isRegistered: item.isRegistered !== undefined ? item.isRegistered : item.is_registered,
      metadata: item.metadata || {},
      state: item.state || null
    }));
  }

  public async updateClient(id: string, name: string | null, isRegistered: boolean, metadata?: Record<string, any>): Promise<IClient> {
    const result: any = await executeSecureRequest(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, isRegistered, metadata }),
    });
    const data = result.data || result;
    return {
      id: data.id,
      phoneNumber: data.phoneNumber || data.phone_number,
      name: data.name,
      isRegistered: data.isRegistered !== undefined ? data.isRegistered : data.is_registered,
      metadata: data.metadata || {},
      state: data.state || null
    };
  }

  public async createClient(phoneNumber: string, name: string | null, isRegistered: boolean, metadata?: Record<string, any>): Promise<IClient> {
    const id = crypto.randomUUID();
    const result: any = await executeSecureRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({ id, phoneNumber, name, isRegistered, metadata }),
    });
    const data = result.data || result;
    return {
      id: data.id,
      phoneNumber: data.phoneNumber || data.phone_number,
      name: data.name,
      isRegistered: data.isRegistered !== undefined ? data.isRegistered : data.is_registered,
      metadata: data.metadata || {},
      state: data.state || null
    };
  }

  public async resetSession(phoneNumber: string): Promise<void> {
    await executeSecureRequest(`${getApiUrl()}/chats/${phoneNumber}/reset`, {
      method: 'DELETE',
    });
  }
}

export const clientService = new ClientApiService();
