/**
 * @file SimulationController.ts
 * @description Controlador dedicado a procesar los escenarios avanzados del asistente del simulador UI.
 * Permite interceptar y sobreescribir las variables físicas de fecha, hora y marca blanca.
 */
import { Request, Response } from 'express';
import { UnifiedChatbotOrchestrator, IMessageContext } from '../../../core/services/UnifiedChatbotOrchestrator';
import { MySQLClientRepository } from '../../../providers/database/MySQLClientRepository';
import logger from '../../../infrastructure/logging/Logger';

export class SimulationController {
  constructor(
    private readonly fsmOrchestrator: UnifiedChatbotOrchestrator,
    private readonly clientRepository: MySQLClientRepository
  ) {}

  /**
   * POST /api/simulator/message
   * Endpoint unificado para mensajes del simulador frontend.
   * Usa el mismo UnifiedChatbotOrchestrator que el webhook de Meta — elimina dualidad de FSM.
   */
  public handleSimulatorMessage = async (req: Request, res: Response): Promise<void> => {
    const { phone, text } = req.body;

    if (!phone || !text) {
      res.status(400).json({ success: false, error: 'phone y text son obligatorios.' });
      return;
    }

    try {
      const ctx: IMessageContext = {
        clientPhone: phone,
        messageText: text,
        isSimulation: true,
        correlationId: `SIM-MSG-${Date.now()}`
      };
      const result = await this.fsmOrchestrator.handleMessage(ctx);

      res.status(200).json({
        success: true,
        data: {
          responseMessage: result.responseMessage,
          nextState: result.nextState
        }
      });
    } catch (err: any) {
      logger.error('[SimulatorMessage] Error procesando mensaje del simulador:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

  /**
   * POST /api/simulator/scenario
   * Ejecuta el despacho de un mensaje simulado aplicando anulaciones de variables físicas del entorno.
   */
  public executeMockScenario = async (req: Request, res: Response): Promise<void> => {
    const { phone, text, forcedDayType, forcedTimePeriod, forcedGender } = req.body;

    if (!phone || !text) {
      res.status(400).json({ success: false, error: 'Identificador de teléfono y texto de entrada mandatorios.' });
      return;
    }

    try {
      logger.info(`🔥 [Simulation Engine] Iniciando inyección de escenario para: ${phone} | Texto: ${text}`);

      let clientProfile = await this.clientRepository.findByPhoneNumber(phone);
      
      if (!clientProfile) {
        // Registrar silenciosamente o crear cliente
        await this.clientRepository.silentRegister(phone);
        const newClient = await this.clientRepository.findByPhoneNumber(phone);
        if (newClient && forcedGender) {
          const genderVal = forcedGender === 'Dama' || forcedGender === 'F' ? 'F' : (forcedGender === 'Caballero' || forcedGender === 'M' ? 'M' : 'N');
          const updatedClient = {
            ...newClient,
            metadata: {
              ...newClient.metadata,
              gender: genderVal
            }
          } as any;
          await this.clientRepository.save(updatedClient);
        }
      } else if (forcedGender) {
        const genderVal = forcedGender === 'Dama' || forcedGender === 'F' ? 'F' : (forcedGender === 'Caballero' || forcedGender === 'M' ? 'M' : 'N');
        const updatedClient = {
          ...clientProfile,
          metadata: {
            ...clientProfile.metadata,
            gender: genderVal
          }
        } as any;
        await this.clientRepository.save(updatedClient);
      }

      const simulationContextOverrides = {
        isSimulationActive: true,
        overrideDayType: forcedDayType || null,
        overrideTimePeriod: forcedTimePeriod || null,
        correlationId: (req as any).correlationId || `SIM-${Date.now()}`
      };

      const result = await this.fsmOrchestrator.handleMessage({
        ...simulationContextOverrides,
        clientPhone: phone,
        messageText: text,
        isSimulation: true
      });

      logger.info(`✅ [Simulation Engine] Transición completada con éxito. Próximo estado: ${result.nextState}`);

      res.status(200).json({
        success: true,
        data: {
          responseMessage: result.responseMessage,
          nextState: result.nextState,
          timestamp: new Date().toISOString()
        }
      });

    } catch (simulationException: any) {
      logger.error('🚨 [Simulation Controller Collapse] Error fatal en el inyector de escenarios:', simulationException);
      res.status(500).json({ 
        success: false, 
        error: `Fallo crítico del simulador de hilos: ${simulationException.message}` 
      });
    }
  };
}
