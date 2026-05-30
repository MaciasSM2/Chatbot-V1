import { IdentityRecoveryStrategy } from "./IdentityRecoveryStrategy";
import { ISessionRepository } from "../../interfaces/repositories/ISessionRepository";
import { IClientRepository } from "../../interfaces/repositories/IClientRepository";
import { ChatSession } from "../../entities/ChatSession";
import { Client } from "../../entities/Client";

describe("IdentityRecoveryStrategy", () => {
  let strategy: IdentityRecoveryStrategy;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let mockClientRepository: jest.Mocked<IClientRepository>;

  beforeEach(() => {
    mockSessionRepository = {
      findByUserId: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<ISessionRepository>;

    mockClientRepository = {
      findAll: jest.fn(),
      findByPhoneNumber: jest.fn(),
      findById: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<IClientRepository>;

    strategy = new IdentityRecoveryStrategy(mockSessionRepository, mockClientRepository);
  });

  it("should transition from CHECKING_REGISTRATION to AWAITING_ID_VERIFICATION when user replies Sí", async () => {
    const session = new ChatSession({
      userId: "user123",
      currentStep: "CHECKING_REGISTRATION",
      updatedAt: new Date(),
      metadata: {}
    });
    mockSessionRepository.findByUserId.mockResolvedValue(session);

    const result = await strategy.execute("user123", "Sí");
    expect(result.nextStep).toBe("AWAITING_ID_VERIFICATION");
    expect(result.responseMessage).toContain("Número de Identificación");
  });

  it("should transition from CHECKING_REGISTRATION to ASKING_NAME when user replies No", async () => {
    const session = new ChatSession({
      userId: "user123",
      currentStep: "CHECKING_REGISTRATION",
      updatedAt: new Date(),
      metadata: {}
    });
    mockSessionRepository.findByUserId.mockResolvedValue(session);

    const result = await strategy.execute("user123", "no");
    expect(result.nextStep).toBe("ASKING_NAME");
    expect(result.responseMessage).toContain("¿Cuál es tu *Nombre Completo*?");
  });

  it("should validate that ID has only numbers and reject others in AWAITING_ID_VERIFICATION step", async () => {
    const session = new ChatSession({
      userId: "user123",
      currentStep: "AWAITING_ID_VERIFICATION",
      updatedAt: new Date(),
      metadata: {}
    });
    mockSessionRepository.findByUserId.mockResolvedValue(session);

    const result = await strategy.execute("user123", "abc-123");
    expect(result.nextStep).toBe("AWAITING_ID_VERIFICATION");
    expect(result.responseMessage).toContain("formato no es válido");
  });

  it("should find the user in DB and transition to AWAITING_MENU_OPTION if matched", async () => {
    const session = new ChatSession({
      userId: "user123",
      currentStep: "AWAITING_ID_VERIFICATION",
      updatedAt: new Date(),
      metadata: {}
    });
    mockSessionRepository.findByUserId.mockResolvedValue(session);

    const matchingClient = new Client(
      "client-uuid-1",
      "user123",
      "Andrés Valencia",
      true,
      { identification: "12345" }
    );
    mockClientRepository.findAll.mockResolvedValue([matchingClient]);

    const result = await strategy.execute("user123", "12345");
    expect(result.nextStep).toBe("AWAITING_MENU_OPTION");
    expect(result.responseMessage).toContain("Hola de nuevo, *Andrés Valencia*");
    expect(mockSessionRepository.save).toHaveBeenCalled();
  });

  it("should transition to ASKING_NAME if user is not found in DB (failsafe)", async () => {
    const session = new ChatSession({
      userId: "user123",
      currentStep: "AWAITING_ID_VERIFICATION",
      updatedAt: new Date(),
      metadata: {}
    });
    mockSessionRepository.findByUserId.mockResolvedValue(session);
    mockClientRepository.findAll.mockResolvedValue([]);

    const result = await strategy.execute("user123", "99999");
    expect(result.nextStep).toBe("ASKING_NAME");
    expect(result.responseMessage).toContain("No logré encontrarte");
  });
});
