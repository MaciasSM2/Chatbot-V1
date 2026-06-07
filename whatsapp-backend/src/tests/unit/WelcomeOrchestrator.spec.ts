/**
 * @file WelcomeOrchestrator.spec.ts
 * @description Suite de pruebas unitarias para certificar la precisión del motor de saludos corporativos.
 * Utiliza Mocks Orientados a Objetos para aislar las dependencias de persistencia física.
 */
import { WelcomeOrchestrator } from '../../core/services/WelcomeOrchestrator';
import { IClientRepository } from '../../core/interfaces/repositories/IClientRepository';
import { IGreetingRepository } from '../../core/interfaces/repositories/IGreetingRepository';
import { DateTimeManager } from '../../core/services/DateTimeManager';
import { HumanDelayService } from '../../core/services/HumanDelayService';
import { Client } from '../../core/entities/Client';

describe('🧪 [Unit Test] WelcomeOrchestrator - Motor de Saludos Adaptativos', () => {
  let mockClientRepository: jest.Mocked<IClientRepository>;
  let mockGreetingRepository: jest.Mocked<IGreetingRepository>;
  let mockDateTimeManager: jest.Mocked<DateTimeManager>;
  let mockDelayService: jest.Mocked<HumanDelayService>;
  let orchestratorInstance: WelcomeOrchestrator;

  beforeEach(() => {
    // 1. Crear mocks estrictos alineados a los contratos de las interfaces del Core (SOLID - D)
    mockClientRepository = {
      findByPhoneNumber: jest.fn(),
      silentRegister: jest.fn(),
      updatePauseStatus: jest.fn(),
      save: jest.fn()
    } as any;

    mockGreetingRepository = {
      getTemplates: jest.fn(),
      getAll: jest.fn()
    } as any;

    mockDateTimeManager = {
      getDayType: jest.fn(),
      getTimePeriod: jest.fn(),
      isWithinWorkingHours: jest.fn()
    } as any;

    mockDelayService = {
      execute: jest.fn().mockResolvedValue(undefined)
    } as any;

    orchestratorInstance = new WelcomeOrchestrator(
      mockClientRepository,
      mockGreetingRepository,
      mockDateTimeManager,
      mockDelayService
    );
  });

  it('Debe aplicar la flexión de género femenina ("estimada/bienvenida") si el perfil del CRM lo indica', async () => {
    // GIVEN: Un usuario registrado de género Femenino en un turno de mañana hábil
    const femaleClient = new Client('1', '573001112233', 'Carolina Mendoza', true, { gender: 'F' });

    mockClientRepository.findByPhoneNumber.mockResolvedValue(femaleClient);
    mockDateTimeManager.getTimePeriod.mockReturnValue('MORNING' as any);
    mockDateTimeManager.getDayType.mockResolvedValue('WEEKDAY' as any);
    
    mockGreetingRepository.getTemplates.mockResolvedValue([
      {
        id: 'greet_morning_default',
        dayType: 'WEEKDAY',
        timePeriod: 'MORNING',
        category: 'RESPONSE',
        text: 'Buenos días {{name}}. Sea {{welcome_token}} a nuestra central, {{esteem_token}} cliente.'
      }
    ] as any);

    // WHEN: Se solicita la compilación del saludo en caliente
    const renderedResult = await orchestratorInstance.generateContextualGreeting('573001112233');

    // THEN: Los tokens gramaticales deben sustituirse con precisión morfológica estricta
    expect(renderedResult).toContain('Carolina Mendoza');
    expect(renderedResult).toContain('bienvenida');
    expect(renderedResult).toContain('estimada');
    expect(renderedResult).not.toContain('bienvenido');
  });

  it('Debe degradar el saludo de forma segura a lenguaje neutro si el cliente no está registrado en el CRM', async () => {
    // GIVEN: Un número telefónico desconocido que escribe por primera vez
    mockClientRepository.findByPhoneNumber.mockResolvedValue(null); // No existe registro
    mockDateTimeManager.getTimePeriod.mockReturnValue('NIGHT' as any);
    mockDateTimeManager.getDayType.mockResolvedValue('HOLIDAY_NON_WORKABLE' as any);

    mockGreetingRepository.getTemplates.mockResolvedValue([
      {
        id: 'greet_hol_nowork_night',
        dayType: 'HOLIDAY_NON_WORKABLE',
        timePeriod: 'NIGHT',
        category: 'RESPONSE',
        text: 'Cordial saludo {{name}}. {{esteem_token}} cliente, le damos la bienvenida.'
      }
    ] as any);

    // WHEN: El ingestor procesa el payload
    const renderedResult = await orchestratorInstance.generateContextualGreeting('573009998877');

    // THEN: El bot debe auto-protegerse usando el fallback neutro de marca blanca
    expect(renderedResult.toLowerCase()).toContain('cliente');
    expect(renderedResult.toLowerCase()).toContain('cordial');
    expect(renderedResult.toLowerCase()).toContain('le damos la bienvenida');
  });
});
