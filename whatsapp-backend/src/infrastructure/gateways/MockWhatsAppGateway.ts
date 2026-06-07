/**
 * @file MockWhatsAppGateway.ts
 * @description Implementación de pruebas capaz de simular escenarios de degradación de red,
 * límites de cuota (429) y caídas del servidor de Meta.
 */

import { IWhatsAppGateway, IWhatsAppResponse } from '../../core/interfaces/IWhatsAppGateway';

export type MockErrorScenario = 'SUCCESS' | 'RATE_LIMIT_429' | 'TOKEN_EXPIRED_401' | 'SERVER_ERROR_500' | 'NETWORK_TIMEOUT';

export class MockWhatsAppGateway implements IWhatsAppGateway {
  private currentScenario: MockErrorScenario = 'SUCCESS';

  /**
   * Cambia dinámicamente el escenario de error para las pruebas automatizadas.
   */
  public setScenario(scenario: MockErrorScenario): void {
    this.currentScenario = scenario;
  }

  public async sendMessage(_to: string, _text: string): Promise<IWhatsAppResponse> {
    // Simulación de la latencia mínima inherente a una petición HTTP de red
    await new Promise(resolve => setTimeout(resolve, 600));

    switch (this.currentScenario) {
      case 'RATE_LIMIT_429':
        throw new Error('Meta API Error: HTTP 429 Too Many Requests. Rate limit exceeded for this phone number.');

      case 'TOKEN_EXPIRED_401':
        throw new Error('Meta API Error: HTTP 401 Unauthorized. The Cloud API Access Token has expired.');

      case 'SERVER_ERROR_500':
        throw new Error('Meta API Error: HTTP 500 Internal Server Error. Meta Meta-servers are experiencing downtime.');

      case 'NETWORK_TIMEOUT':
        throw new Error('Gateway Timeout: External connection to graph.facebook.com dropped.');

      case 'SUCCESS':
      default:
        return {
          messageId: `mock_meta_id_${Math.random().toString(36).substring(2, 11)}`,
          providerTimestamp: new Date(),
          status: 'sent'
        };
    }
  }
}
