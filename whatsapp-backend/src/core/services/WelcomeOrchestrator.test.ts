import { WelcomeOrchestrator } from "./WelcomeOrchestrator";
import { IClientRepository } from "../interfaces/repositories/IClientRepository";
import { IGreetingRepository } from "../interfaces/repositories/IGreetingRepository";
import { DateTimeManager } from "./DateTimeManager";
import { HumanDelayService } from "./HumanDelayService";
import { GreetingTemplate } from "../entities/GreetingTemplate";
import { Client } from "../entities/Client";

describe("WelcomeOrchestrator", () => {
  let welcomeOrchestrator: WelcomeOrchestrator;
  let mockClientRepository: jest.Mocked<IClientRepository>;
  let mockGreetingRepository: jest.Mocked<IGreetingRepository>;
  let mockDateTimeManager: jest.Mocked<DateTimeManager>;
  let mockDelayService: jest.Mocked<HumanDelayService>;

  beforeEach(() => {
    mockClientRepository = {
      findByPhoneNumber: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<IClientRepository>;

    mockGreetingRepository = {
      getTemplates: jest.fn(),
      getAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn()
    } as unknown as jest.Mocked<IGreetingRepository>;

    mockDateTimeManager = {
      getDayType: jest.fn().mockResolvedValue("WEEKDAY"),
      getTimePeriod: jest.fn().mockReturnValue("MORNING"),
      isWithinWorkingHours: jest.fn().mockResolvedValue(true)
    } as unknown as jest.Mocked<DateTimeManager>;

    mockDelayService = {
      execute: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<HumanDelayService>;

    welcomeOrchestrator = new WelcomeOrchestrator(
      mockClientRepository,
      mockGreetingRepository,
      mockDateTimeManager,
      mockDelayService
    );
  });

  describe("handleIncomingWelcome", () => {
    it("should return forced greeting for TEST_BOT_DEBUG", async () => {
      const template = new GreetingTemplate("t1", "WEEKDAY", "MORNING", "Hola{{name}}, han pasado {{time}}.", "CONTINUITY");
      mockGreetingRepository.getAll.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.handleIncomingWelcome("TEST_BOT_DEBUG", "CONTINUITY", 15);
      expect(result.message).toContain("15 minutos");
      expect(result.expectsDataInput).toBe(false);
    });

    it("should inject time placeholder and name in standard incoming welcome for registered user", async () => {
      const client = new Client("client-1", "573001234567", "Sebastian", true);
      const template = new GreetingTemplate("t1", "WEEKDAY", "MORNING", "Hola de nuevo{{name}}. Han pasado {{time}}.", "CONTINUITY");

      mockClientRepository.findByPhoneNumber.mockResolvedValue(client);
      mockGreetingRepository.getTemplates.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.handleIncomingWelcome("573001234567", "CONTINUITY", 10);
      expect(result.message).toBe("Hola de nuevo, Sebastian. Han pasado 10 minutos.");
      expect(result.expectsDataInput).toBe(false);
    });

    it("should use default minutes when minutes parameter is not provided", async () => {
      const client = new Client("client-1", "573001234567", "Sebastian", true);
      const template = new GreetingTemplate("t1", "WEEKDAY", "MORNING", "Hola de nuevo{{name}}. Han pasado {{time}}.", "CONTINUITY");

      mockClientRepository.findByPhoneNumber.mockResolvedValue(client);
      mockGreetingRepository.getTemplates.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.handleIncomingWelcome("573001234567", "CONTINUITY");
      expect(result.message).toBe("Hola de nuevo, Sebastian. Han pasado 5 minutos.");
    });
    it("should serve custom onboarding template and expect data input for new unregistered client in RESPONSE category", async () => {
      const template = new GreetingTemplate("t_resp_new1", "WEEKDAY", "MORNING", "¡Hola! Bienvenido. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes...", "RESPONSE");

      mockClientRepository.findByPhoneNumber.mockResolvedValue(null); // Unregistered client
      mockGreetingRepository.getTemplates.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.handleIncomingWelcome("573001234567", "RESPONSE", undefined, true);
      expect(result.message).toContain("Bienvenido");
      expect(result.expectsDataInput).toBe(true);
    });
  });

  describe("getForcedGreeting", () => {
    it("should inject time placeholder in forced continuity greetings", async () => {
      const template = new GreetingTemplate("t_cont", "WEEKDAY", "MORNING", "Han pasado {{time}} desde tu último mensaje.", "CONTINUITY");
      mockGreetingRepository.getAll.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.getForcedGreeting("CONTINUITY", 15);
      expect(result).toContain("15 minutos");
      expect(result).not.toContain("{{time}}");
    });

    it("should serve onboarding template for forced greeting when isNewClient is true", async () => {
      const template = new GreetingTemplate("t_resp_new1", "WEEKDAY", "MORNING", "¡Hola! Bienvenid[o/a]. 👋 Es un gusto saludarte. Veo que es la primera vez que nos escribes...", "RESPONSE");
      mockGreetingRepository.getAll.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.getForcedGreeting("RESPONSE", undefined, true);
      expect(result).toContain("Bienvenid[o/a]");
    });
  });

  describe("applyGender", () => {
    it("should correctly translate F tags", () => {
      const text = "Bienvenid[o/a] [el/la] amig[o/a] [El/La] cual es estimad[o/a]";
      const result = welcomeOrchestrator.applyGender(text, "F");
      expect(result).toBe("Bienvenida la amiga La cual es estimada");
    });

    it("should correctly translate M tags", () => {
      const text = "Bienvenid[o/a] [el/la] amig[o/a] [El/La] cual es estimad[o/a]";
      const result = welcomeOrchestrator.applyGender(text, "M");
      expect(result).toBe("Bienvenido el amigo El cual es estimado");
    });
  });

  describe("validateAndGreet", () => {
    it("should correctly return validated format for registered user", async () => {
      const client = new Client("client-1", "573001234567", "Sebastian Macias", true);
      mockClientRepository.findByPhoneNumber.mockResolvedValue(client);

      const template = new GreetingTemplate("t1", "WEEKDAY", "MORNING", "Bienvenid[o/a]{name}!", "RESPONSE");
      mockGreetingRepository.getAll.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.validateAndGreet("573001234567", "F", "RESPONSE");
      expect(result.status).toBe("VALIDATED");
      expect(result.token).toMatch(/^TK-[A-Z0-9]+$/);
      expect(result.name).toBe("Sebastian Macias");
      expect(result.greeting).toContain("Bienvenida");
    });

    it("should correctly return anonymous format for unregistered user", async () => {
      mockClientRepository.findByPhoneNumber.mockResolvedValue(null);

      const template = new GreetingTemplate("t_resp_new1", "WEEKDAY", "MORNING", "Bienvenid[o/a]!", "RESPONSE");
      mockGreetingRepository.getAll.mockResolvedValue([template]);

      const result = await welcomeOrchestrator.validateAndGreet("573008888888", "M", "RESPONSE");
      expect(result.status).toBe("ANONYMOUS");
      expect(result.token).toMatch(/^TK-[A-Z0-9]+$/);
      expect(result.name).toBe("Invitado");
      expect(result.greeting).toContain("Bienvenido");
    });
  });

  describe("Absence Protocol", () => {
    it("should serve absence apology for new client on WEEKEND", async () => {
      mockDateTimeManager.getDayType.mockResolvedValue("WEEKEND");
      mockClientRepository.findByPhoneNumber.mockResolvedValue(null);

      const templates = [
        new GreetingTemplate("t_absence_new_we", "WEEKEND", "MORNING", "¡Bienvenid[o/a]! 👋 Gracias por escribirnos. Nos disculpamos por no poder atenderte de inmediato...", "RESPONSE")
      ];
      mockGreetingRepository.getAll.mockResolvedValue(templates);

      const result = await welcomeOrchestrator.validateAndGreet("573008888888", "F", "RESPONSE");
      expect(result.status).toBe("ANONYMOUS");
      expect(result.greeting).toContain("Bienvenida");
      expect(result.greeting).toContain("Nos disculpamos");
    });

    it("should serve priority wait message for existing client on HOLIDAY_NON_WORKABLE", async () => {
      mockDateTimeManager.getDayType.mockResolvedValue("HOLIDAY_NON_WORKABLE");
      const client = new Client("client-123", "573001234567", "Sebastian Macias", true);
      mockClientRepository.findByPhoneNumber.mockResolvedValue(client);

      const templates = [
        new GreetingTemplate("t_absence_exist_hol", "HOLIDAY_NON_WORKABLE", "MORNING", "¡Hola{{name}}! 👋 Te saludamos con gusto. Te pedimos una sincera disculpa...", "RESPONSE")
      ];
      mockGreetingRepository.getAll.mockResolvedValue(templates);

      const result = await welcomeOrchestrator.validateAndGreet("573001234567", "M", "RESPONSE");
      expect(result.status).toBe("VALIDATED");
      expect(result.greeting).toContain("USUARIO TEST");
      expect(result.greeting).toContain("sincera disculpa");
    });
  });

  describe("Workable Weekend Days Protocol", () => {
    it("should serve active welcoming message for registered user on SUNDAY_WORKABLE and not apologize", async () => {
      mockDateTimeManager.getDayType.mockResolvedValue("SUNDAY_WORKABLE");
      const client = new Client("client-123", "573001234567", "Sebastian Macias", true);
      mockClientRepository.findByPhoneNumber.mockResolvedValue(client);

      const templates = [
        new GreetingTemplate("t_absence_exist_sun", "SUNDAY_WORKABLE", "MORNING", "¡Hola{{name}}! Qué gusto saludarte en este domingo. 👋 He recibido tu mensaje y estoy listo para ayudarte...", "RESPONSE")
      ];
      mockGreetingRepository.getAll.mockResolvedValue(templates);

      const result = await welcomeOrchestrator.validateAndGreet("573001234567", "M", "RESPONSE");
      expect(result.status).toBe("VALIDATED");
      expect(result.isNonWorkable).toBe(false);
      expect(result.greeting).toContain("domingo");
      expect(result.greeting).not.toContain("disculpa");
    });
  });

  describe("Dynamic Working Hours Protocol", () => {
    it("should serve absence greeting if outside working hours on a weekday", async () => {
      mockDateTimeManager.getDayType.mockResolvedValue("WEEKDAY");
      mockDateTimeManager.isWithinWorkingHours.mockResolvedValue(false); // Outside working hours

      const client = new Client("client-123", "573001234567", "Sebastian Macias", true);
      mockClientRepository.findByPhoneNumber.mockResolvedValue(client);

      const templates = [
        new GreetingTemplate("t_absence_exist_we", "WEEKEND", "MORNING", "¡Hola{{name}}! 👋 Te saludamos con gusto. Te pedimos una sincera disculpa, pero hoy es un día no laborable en nuestro equipo.", "RESPONSE")
      ];
      mockGreetingRepository.getAll.mockResolvedValue(templates);

      const result = await welcomeOrchestrator.handleIncomingWelcome("573001234567", "RESPONSE", undefined, false);
      expect(result.message).toContain("sincera disculpa");
      expect(result.expectsDataInput).toBe(false);
    });
  });
});
