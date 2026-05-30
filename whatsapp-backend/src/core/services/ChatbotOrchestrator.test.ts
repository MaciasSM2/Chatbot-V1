import { ChatbotOrchestrator } from "./ChatbotOrchestrator";
import { WelcomeOrchestrator } from "./WelcomeOrchestrator";
import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { Client } from "../entities/Client";
import { ChatSession } from "../entities/ChatSession";
import { ISessionRepository } from "../interfaces/repositories/ISessionRepository";

describe("ChatbotOrchestrator", () => {
  let orchestrator: ChatbotOrchestrator;
  let mockWelcomeOrchestrator: jest.Mocked<WelcomeOrchestrator>;
  let mockClientRepository: jest.Mocked<IClientRepository>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;

  beforeEach(() => {
    // Creamos un Mock del WelcomeOrchestrator
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

    // Creamos un Mock de ISessionRepository
    mockSessionRepository = {
      findByUserId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<ISessionRepository>;

    orchestrator = new ChatbotOrchestrator(
      mockWelcomeOrchestrator,
      mockClientRepository,
      mockSessionRepository
    );
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

  it("should transition to ASKING_NAME in WELCOME step if WelcomeOrchestrator expects name input", async () => {
    mockWelcomeOrchestrator.handleIncomingWelcome.mockResolvedValueOnce({
      message: "Por favor dime tu nombre",
      expectsDataInput: true
    });
    
    const result = await orchestrator.processMessage("WELCOME", "user123", "hola");
    expect(result.nextStep).toBe("CHECKING_REGISTRATION");
    expect(result.responseMessage).toBe("Por favor dime tu nombre");
  });

  it("should execute sequential registration flow correctly step-by-step", async () => {
    const session = new ChatSession({
      userId: "user123",
      currentStep: "ASKING_NAME",
      updatedAt: new Date(),
      metadata: {}
    });
    mockSessionRepository.findByUserId.mockResolvedValue(session);

    // Turn 1: User sends full name -> bot should save it and ask for Cédula (identification)
    let result = await orchestrator.processMessage("ASKING_NAME", "user123", "Sebastian Macias");
    expect(result.nextStep).toBe("ASKING_ID");
    expect(result.responseMessage).toContain("número de identificación");
    expect(session.metadata.fullName).toBe("Sebastian Macias");

    // Update session state for next turn
    session.transitionTo("ASKING_ID");

    // Turn 2: User sends identification -> bot should save it and ask for gender
    result = await orchestrator.processMessage("ASKING_ID", "user123", "1037654321");
    expect(result.nextStep).toBe("ASKING_GENDER");
    expect(result.responseMessage).toContain("género");
    expect(session.metadata.identification).toBe("1037654321");

    // Update session state for next turn
    session.transitionTo("ASKING_GENDER");

    // Turn 3: User sends gender -> bot should finalize and transition to AWAITING_MENU_OPTION
    result = await orchestrator.processMessage("ASKING_GENDER", "user123", "Caballero");
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(result.responseMessage).toContain("exitoso");
    expect(session.metadata.gender).toBe("Caballero");

    // Verify it saved the final registered client in PostgreSQL
    expect(mockClientRepository.save).toHaveBeenCalled();
    const savedClient = mockClientRepository.save.mock.calls[0][0];
    expect(savedClient.phoneNumber).toBe("user123");
    expect(savedClient.name).toBe("Sebastian Macias");
    expect(savedClient.isRegistered).toBe(true);
  });

  it("should reuse client UUID if user already exists under registration step", async () => {
    const session = new ChatSession({
      userId: "user123",
      currentStep: "ASKING_GENDER",
      updatedAt: new Date(),
      metadata: {
        fullName: "New Name",
        identification: "999999"
      }
    });
    mockSessionRepository.findByUserId.mockResolvedValue(session);

    const existing = new Client("existing-uuid-123", "user123", "Old Name", false);
    mockClientRepository.findByPhoneNumber.mockResolvedValueOnce(existing);

    const result = await orchestrator.processMessage("ASKING_GENDER", "user123", "Dama");
    
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(mockClientRepository.save).toHaveBeenCalled();
    const savedClient = mockClientRepository.save.mock.calls[0][0];
    expect(savedClient.id).toBe("existing-uuid-123"); // ID conservado y reutilizado!
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
