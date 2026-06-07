import { DayType, IGreeting, TimePeriod } from "../models/Greeting";
import { getApiUrl, executeSecureRequest } from "../apiClient";

export class GreetingApiService {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    const normalizedBaseUrl = (baseUrl || getApiUrl()).replace(/\/api$/, '');
    this.baseUrl = `${normalizedBaseUrl}/api/greetings`;
  }

  public async getGreetings(day?: DayType, time?: TimePeriod): Promise<IGreeting[]> {
    const query = (day && time) ? `?day=${day}&time=${time}` : '';
    const url = `${this.baseUrl}${query}`;

    const result: any = await executeSecureRequest(url);
    return result.data || result;
  }

  public async saveGreeting(greeting: IGreeting): Promise<void> {
    const isNew = greeting.id.startsWith('temp-');
    const method = isNew ? 'POST' : 'PUT';
    const payload = { ...greeting, id: isNew ? `greet-${Date.now()}` : greeting.id };

    await executeSecureRequest(isNew ? this.baseUrl : `${this.baseUrl}/${greeting.id}`, {
      method,
      body: JSON.stringify(payload),
    });
  }

  public async deleteGreeting(id: string): Promise<void> {
    await executeSecureRequest(`${this.baseUrl}/${id}`, { method: 'DELETE' });
  }
}

export const greetingService = new GreetingApiService();
