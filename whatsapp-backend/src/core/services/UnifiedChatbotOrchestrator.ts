import { BotState } from '../fsm/enums/BotState';
import { HybridSessionRepository } from '../../providers/database/HybridSessionRepository';
import { PromptInjectionGuard } from './PromptInjectionGuard';
import { SiceTacLiquidationEngine } from './SiceTacLiquidationEngine';
import { WhatsAppOutboundService } from '../../infrastructure/services/WhatsAppOutboundService';
import { ChatSession } from '../entities/ChatSession';
import { EventBus } from '../domain/events/EventBus';
import logger from '../../infrastructure/logging/Logger';

export interface IMessageContext {
  clientPhone: string;
  messageText: string;
  isSimulation: boolean;
  operatorId?: string;
  correlationId: string;
}

export class UnifiedChatbotOrchestrator {
  private readonly injectionGuard: PromptInjectionGuard;

  constructor(
    private readonly sessionRepository: HybridSessionRepository,
    private readonly liquidationEngine: SiceTacLiquidationEngine,
    private readonly outboundService: WhatsAppOutboundService
  ) {
    this.injectionGuard = new PromptInjectionGuard();
  }

  public async processMessage(_currentStep: string, userId: string, message: string): Promise<{ nextStep: string; responseMessage: string }> {
    const ctx: IMessageContext = {
      clientPhone: userId,
      messageText: message,
      isSimulation: true,
      correlationId: `legacy-${Date.now()}`
    };
    const result = await this.handleMessage(ctx);
    return { nextStep: result.nextState, responseMessage: result.responseMessage };
  }

  public async handleMessage(context: IMessageContext): Promise<{ responseMessage: string; nextState: string }> {
    const { clientPhone, messageText, isSimulation, correlationId } = context;

    logger.info(`[UnifiedFSM] Procesando mensaje canal [${isSimulation ? 'SIMULATOR' : 'META_WAN'}]`, { correlationId });

    const safetyVerdict = this.injectionGuard.evaluatePayloadSafety(messageText);
    if (!safetyVerdict.isSafe) {
      return { responseMessage: safetyVerdict.sanitizedText, nextState: BotState.WELCOME };
    }

    let session = await this.sessionRepository.findByUserId(clientPhone);

    if (!session) {
      session = new ChatSession({
        userId: clientPhone,
        currentStep: BotState.WELCOME,
        updatedAt: new Date()
      });
    }

    const s = session as any;
    const currentBotState: BotState = (s.currentStep as BotState) || BotState.WELCOME;
    let responseText = '';
    let targetNextState: BotState = currentBotState;

    switch (currentBotState) {
      case BotState.WELCOME: {
        responseText = `Bienvenido al sistema de cotizacion SICE-TAC.\n\nPor favor, escribe *1* para Cotizar un Flete o *2* para hablar con un Asesor Humano.`;
        targetNextState = BotState.AWAITING_MENU_SELECTION;
        break;
      }

      case BotState.AWAITING_MENU_SELECTION: {
        const trimmed = messageText.trim();
        if (trimmed === '1') {
          responseText = 'Perfecto. Vamos a liquidar tu flete bajo las tablas de control SICE-TAC. Por favor, escribe la ciudad de *Origen*.';
          targetNextState = BotState.AWAITING_ORIGIN_CAPTURE;
        } else if (trimmed === '2') {
          responseText = 'Entendido. He pausado mi automatizacion. Un asesor logistico se conectara contigo de inmediato.';
          targetNextState = BotState.HUMAN_INTERCEPTION;
          EventBus.getInstance().publish({
            eventName: 'HUMAN_INTERCEPTION_REQUIRED',
            occurredAt: new Date(),
            correlationId,
            payload: { clientPhone, assignedOperatorId: context.operatorId || 'OPERATOR_POOL' }
          });
        } else {
          responseText = 'Opcion no valida. Por favor, marca *1* (Cotizar) o *2* (Asesor).';
        }
        break;
      }

      case BotState.AWAITING_ORIGIN_CAPTURE: {
        s.metadata = { ...s.metadata, origin: messageText.trim() };
        responseText = `Origen guardado: *${s.metadata.origin}*. Ahora ingresa la ciudad de *Destino*.`;
        targetNextState = BotState.AWAITING_DESTINATION_CAPTURE;
        break;
      }

      case BotState.AWAITING_DESTINATION_CAPTURE: {
        s.metadata = { ...s.metadata, destination: messageText.trim() };
        responseText = `Destino guardado: *${s.metadata.destination}*. Ingresa el peso de la carga en *Toneladas*.`;
        targetNextState = BotState.AWAITING_WEIGHT_CAPTURE;
        break;
      }

      case BotState.AWAITING_WEIGHT_CAPTURE: {
        const parsedWeight = parseFloat(messageText.trim());
        if (isNaN(parsedWeight) || parsedWeight <= 0) {
          responseText = 'El peso debe ser un numero positivo valido. Intentelo de nuevo:';
        } else {
          s.metadata = { ...s.metadata, weight: parsedWeight };
          responseText = 'Peso registrado. Selecciona tipologia del vehiculo:\n*TURBO*\n*SENCILLO*\n*MINIVAN*';
          targetNextState = BotState.AWAITING_VEHICLE_TYPE_SELECTION;
        }
        break;
      }

      case BotState.AWAITING_VEHICLE_TYPE_SELECTION: {
        const vehicleType = messageText.trim().toUpperCase();
        if (!['TURBO', 'SENCILLO', 'MINIVAN'].includes(vehicleType)) {
          responseText = 'Tipologia no valida. Escribe *TURBO*, *SENCILLO* o *MINIVAN*:';
        } else {
          s.metadata = { ...s.metadata, vehicleType };
          try {
            const finalFreightCost = await this.liquidationEngine.calculateFreight(
              s.metadata.origin,
              s.metadata.destination,
              s.metadata.weight,
              s.metadata.vehicleType
            );
            responseText =
              `LIQUIDACION COMPLETA SICE-TAC\n\n` +
              `Ruta: ${s.metadata.origin} \u2794 ${s.metadata.destination}\n` +
              `Vehiculo: ${s.metadata.vehicleType} (${s.metadata.weight} Tons)\n` +
              `Costo Flete Sugerido: $${finalFreightCost.toLocaleString('es-CO')} COP\n\n` +
              `Deseas realizar otra cotizacion? Escribe *HOLA* para reiniciar.`;
            targetNextState = BotState.WELCOME;
          } catch (err: any) {
            responseText = `Error de ruta: ${err.message}. Escribe *HOLA* para reintentar.`;
            targetNextState = BotState.WELCOME;
          }
        }
        break;
      }

      case BotState.HUMAN_INTERCEPTION:
        return { responseMessage: 'CONTROL_HUMANO_ACTIVO', nextState: BotState.HUMAN_INTERCEPTION };

      default:
        responseText = 'Bienvenido de vuelta. Escribe *HOLA* para comenzar.';
        targetNextState = BotState.WELCOME;
    }

    s.currentStep = targetNextState;
    await this.sessionRepository.save(s);

    if (!isSimulation) {
      await this.outboundService.sendMessage(clientPhone, responseText);
    }

    return { responseMessage: responseText, nextState: targetNextState };
  }
}
