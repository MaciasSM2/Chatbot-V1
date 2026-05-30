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

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api') {
    this.baseUrl = `${baseUrl}/clients`;
  }

  public async getClients(): Promise<IClient[]> {
    const response = await fetch(this.baseUrl);
    if (!response.ok) throw new Error('Error al obtener la lista de clientes');
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      phoneNumber: item.phoneNumber || item.phone_number,
      name: item.name,
      isRegistered: item.isRegistered !== undefined ? item.isRegistered : item.is_registered,
      metadata: item.metadata || {},
      state: item.state || null
    }));
  }

  public async updateClient(id: string, name: string | null, isRegistered: boolean, metadata?: Record<string, any>): Promise<IClient> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, isRegistered, metadata }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al actualizar el cliente');
    }

    const data = await response.json();
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
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, phoneNumber, name, isRegistered, metadata }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al crear el cliente');
    }

    const data = await response.json();
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
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/chats/${phoneNumber}/reset`;
    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Error al reiniciar la sesión del cliente');
    }
  }
}

export const clientService = new ClientApiService();

