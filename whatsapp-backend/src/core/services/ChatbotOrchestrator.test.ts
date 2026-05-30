import { ChatbotOrchestrator } from "./ChatbotOrchestrator";
import { WelcomeOrchestrator } from "./WelcomeOrchestrator";
import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { Client } from "../entities/Client";

describe("ChatbotOrchestrator", () => {
  let orchestrator: ChatbotOrchestrator;
  let mockWelcomeOrchestrator: jest.Mocked<WelcomeOrchestrator>;
  let mockClientRepository: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    // Creamos un Mock del WelcomeOrchestrator para aislar las pruebas de la base de datos
    mockWelcomeOrchestrator = {
      handleIncomingWelcome: jest.fn().mockResolvedValue({
        message: "Mensaje dinámico de bienvenida",
        expectsDataInput: false
      })
    } as unknown as jest.Mocked<WelcomeOrchestrator>;

    // Creamos un Mock de IClientRepository
    mockClientRepository = {
      findByPhoneNumber: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<IClientRepository>;

    orchestrator = new ChatbotOrchestrator(mockWelcomeOrchestrator, mockClientRepository);
  });

  it("should return the welcome message when currentStep is unknown", async () => {
    const result = await orchestrator.processMessage("UNKNOWN_STEP", "user123", "hola");
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(result.responseMessage).toBe("Mensaje dinámico de bienvenida");
    expect(mockWelcomeOrchestrator.handleIncomingWelcome).toHaveBeenCalledWith("user123");
  });

  it("should handle WELCOME step correctly and expect menu option if not expecting name", async () => {
    const result = await orchestrator.processMessage("WELCOME", "user123", "cualquier cosa");
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(result.responseMessage).toBe("Mensaje dinámico de bienvenida");
  });

  it("should transition to AWAITING_NAME in WELCOME step if WelcomeOrchestrator expects name input", async () => {
    mockWelcomeOrchestrator.handleIncomingWelcome.mockResolvedValueOnce({
      message: "Por favor dime tu nombre",
      expectsDataInput: true
    });
    
    const result = await orchestrator.processMessage("WELCOME", "user123", "hola");
    expect(result.nextStep).toBe("AWAITING_NAME");
    expect(result.responseMessage).toBe("Por favor dime tu nombre");
  });

  it("should capture name, save client, and transition to AWAITING_MENU_OPTION inside AWAITING_NAME step", async () => {
    const result = await orchestrator.processMessage("AWAITING_NAME", "user123", "Sebastian Macias");
    
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(result.responseMessage).toContain("Mucho gusto, Sebastian Macias");
    
    // Verificar que se guardó el cliente con name y isRegistered = true
    expect(mockClientRepository.save).toHaveBeenCalled();
    const savedClient = mockClientRepository.save.mock.calls[0][0];
    expect(savedClient.phoneNumber).toBe("user123");
    expect(savedClient.name).toBe("Sebastian Macias");
    expect(savedClient.isRegistered).toBe(true);
  });

  it("should reuse client UUID if user already exists under AWAITING_NAME step", async () => {
    const existing = new Client("existing-uuid-123", "user123", "Old Name", false);
    mockClientRepository.findByPhoneNumber.mockResolvedValueOnce(existing);

    const result = await orchestrator.processMessage("AWAITING_NAME", "user123", "New Name");
    
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(mockClientRepository.save).toHaveBeenCalled();
    const savedClient = mockClientRepository.save.mock.calls[0][0];
    expect(savedClient.id).toBe("existing-uuid-123"); // ID conservado y reutilizado!
    expect(savedClient.name).toBe("New Name");
  });

  it("should handle AWAITING_MENU_OPTION step with valid option 1", async () => {
    const result = await orchestrator.processMessage("AWAITING_MENU_OPTION", "user123", "1");
    expect(result.nextStep).toBe("WELCOME");
    expect(result.responseMessage).toContain("Soporte");
  });

  it("should handle AWAITING_MENU_OPTION step with invalid option", async () => {
    const result = await orchestrator.processMessage("AWAITING_MENU_OPTION", "user123", "5");
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(result.responseMessage).toContain("Opción inválida");
  });
});
