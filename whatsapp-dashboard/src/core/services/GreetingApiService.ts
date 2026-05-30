import { DayType, IGreeting, TimePeriod } from "../models/Greeting";

export class GreetingApiService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api') {
    // Normalizar la URL base para asegurar que termine con /api de forma resiliente
    const normalizedBaseUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    this.baseUrl = `${normalizedBaseUrl}/greetings`;
  }

  public async getGreetings(day?: DayType, time?: TimePeriod): Promise<IGreeting[]> {
    // Si day o time vienen undefined, la URL podría malformarse
    const query = (day && time) ? `?day=${day}&time=${time}` : '';
    const url = `${this.baseUrl}${query}`;
    
    console.log("Petición a:", url); // Revisa esto en la consola del navegador

    const response = await fetch(url);
    
    // PROTECCIÓN: Si no es JSON, no intentes parsearlo
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("El servidor no devolvió JSON. Posible error de ruta o backend caído.");
    }

    return await response.json();
  }

  public async saveGreeting(greeting: IGreeting): Promise<void> {
    const isNew = greeting.id.startsWith('temp-');
    const method = isNew ? 'POST' : 'PUT';
    const payload = { ...greeting, id: isNew ? `greet-${Date.now()}` : greeting.id };
    
    const response = await fetch(isNew ? this.baseUrl : `${this.baseUrl}/${greeting.id}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al guardar el saludo');
    }
  }

  public async deleteGreeting(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al eliminar el saludo');
    }
  }
}

export const greetingService = new GreetingApiService();
