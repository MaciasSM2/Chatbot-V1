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

  private mapClientResponse(item: any): IClient {
    return {
      id: item.id,
      phoneNumber: item.phoneNumber || item.phone_number,
      name: item.name,
      isRegistered: item.isRegistered !== undefined ? item.isRegistered : item.is_registered,
      metadata: item.metadata || {},
      state: item.state || null
    };
  }

  public async fetchAllProspects(): Promise<IClientCrmEntity[]> {
    try {
      const response: CrmApiResponse<IClientCrmEntity[]> = await executeSecureRequest(this.baseUrl);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (networkException) {
      console.error('❌ [ClientApiService Strict Error] Falló la descarga del CRM:', networkException);
      throw networkException;
    }
  }

  public async getClients(): Promise<IClient[]> {
    const result: any = await executeSecureRequest(this.baseUrl);
    const items = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : [];
    return items.map((item: any) => this.mapClientResponse(item));
  }

  public async updateClient(id: string, name: string | null, isRegistered: boolean, metadata?: Record<string, any>): Promise<IClient> {
    const result: any = await executeSecureRequest(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, isRegistered, metadata }),
    });
    return this.mapClientResponse(result.data || result);
  }

  public async createClient(phoneNumber: string, name: string | null, isRegistered: boolean, metadata?: Record<string, any>): Promise<IClient> {
    const id = crypto.randomUUID();
    const result: any = await executeSecureRequest(this.baseUrl, {
      method: 'POST',
      body: JSON.stringify({ id, phoneNumber, name, isRegistered, metadata }),
    });
    return this.mapClientResponse(result.data || result);
  }

  public async resetSession(phoneNumber: string): Promise<void> {
    await executeSecureRequest(`${getApiUrl()}/chats/${phoneNumber}/reset`, {
      method: 'DELETE',
    });
  }
}

export const clientService = new ClientApiService();
