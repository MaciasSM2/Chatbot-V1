/**
 * @file MetaMockController.ts
 * @description Endpoint administrativo que permite al panel de configuración del Dashboard
 * alternar el comportamiento del simulador de Meta en tiempo real.
 */

import { Request, Response } from 'express';
import { MockWhatsAppGateway, MockErrorScenario } from '../../infrastructure/gateways/MockWhatsAppGateway';

export class MetaMockController {
  constructor(private readonly mockGateway: MockWhatsAppGateway) {}

  /**
   * PATCH /api/test/meta-scenario
   * Altera el tipo de falla que el gateway inyectará en la siguiente petición.
   */
  public configureScenario = async (req: Request, res: Response): Promise<Response> => {
    const { scenario } = req.body;

    const validScenarios: MockErrorScenario[] = ['SUCCESS', 'RATE_LIMIT_429', 'TOKEN_EXPIRED_401', 'SERVER_ERROR_500', 'NETWORK_TIMEOUT'];

    if (!validScenarios.includes(scenario)) {
      return res.status(400).json({ 
        error: `Escenario inválido. Debe ser uno de los siguientes: ${validScenarios.join(', ')}` 
      });
    }

    // Mutación del estado del Singleton del Gateway de pruebas
    this.mockGateway.setScenario(scenario as MockErrorScenario);

    return res.json({
      status: 'OK',
      message: `Gateway de Meta configurado en modo: ${scenario}`
    });
  };
}
