import { AnalyticsController } from "./AnalyticsController";
import { IMessageRepository } from "../../core/interfaces/repositories/IMessageRepository";
import { ISessionRepository } from "../../core/interfaces/repositories/ISessionRepository";
import { Message } from "../../core/entities/Message";
import { ChatSession } from "../../core/entities/ChatSession";
import { Pool } from "pg";
import { Request, Response } from "express";

describe("AnalyticsController", () => {
  let analyticsController: AnalyticsController;
  let mockMessageRepository: jest.Mocked<IMessageRepository>;
  let mockSessionRepository: jest.Mocked<ISessionRepository>;
  let mockDbPool: jest.Mocked<Pool>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    mockMessageRepository = {
      save: jest.fn(),
      findByUserId: jest.fn(),
      findAll: jest.fn(),
      clearHistory: jest.fn()
    } as unknown as jest.Mocked<IMessageRepository>;

    mockSessionRepository = {
      findByUserId: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    } as unknown as jest.Mocked<ISessionRepository>;

    mockDbPool = {
      query: jest.fn().mockResolvedValue({ rows: [] })
    } as unknown as jest.Mocked<Pool>;

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();

    mockReq = {
      query: {}
    };

    mockRes = {
      status: statusSpy,
      json: jsonSpy
    };

    analyticsController = new AnalyticsController(
      mockMessageRepository,
      mockSessionRepository,
      mockDbPool
    );
  });

  describe("getAnalytics", () => {
    it("should return demo data if repositories are empty", async () => {
      mockMessageRepository.findAll.mockResolvedValue([]);
      mockSessionRepository.findAll.mockResolvedValue([]);

      await analyticsController.getAnalytics(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalled();
      const responseData = jsonSpy.mock.calls[0][0];
      expect(responseData.demo).toBe(true);
      expect(responseData.messages.total).toBeGreaterThan(0);
      expect(responseData.sessions.total).toBe(14);
    });

    it("should process real metrics if data is available and demo is not requested", async () => {
      const mockMessages = [
        new Message("m1", "user1", "user", "Hola", "read", new Date(Date.now() - 3000)),
        new Message("m2", "user1", "bot", "¡Hola! ¿Cómo te va?", "read", new Date(Date.now() - 2500)),
        new Message("m3", "user2", "user", "Precios", "read", new Date(Date.now() - 1000))
      ];

      const mockSessions = [
        new ChatSession({ userId: "user1", currentStep: "AWAITING_MENU_OPTION", updatedAt: new Date() }),
        new ChatSession({ userId: "user2", currentStep: "WELCOME", updatedAt: new Date() })
      ];

      mockMessageRepository.findAll.mockResolvedValue(mockMessages);
      mockSessionRepository.findAll.mockResolvedValue(mockSessions);

      await analyticsController.getAnalytics(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      const responseData = jsonSpy.mock.calls[0][0];
      expect(responseData.demo).toBe(false);
      expect(responseData.messages.total).toBe(3);
      expect(responseData.messages.bot).toBe(1);
      expect(responseData.messages.user).toBe(2);
      expect(responseData.sessions.total).toBe(2);
      expect(responseData.sessions.states.WELCOME).toBe(1);
      expect(responseData.sessions.states.AWAITING_MENU_OPTION).toBe(1);
    });

    it("should correctly compute user-to-bot latency", async () => {
      const baseTime = Date.now();
      const mockMessages = [
        // Latencia de 500ms (0.5s)
        new Message("m1", "user1", "user", "Mensaje", "read", new Date(baseTime)),
        new Message("m2", "user1", "bot", "Respuesta", "read", new Date(baseTime + 500)),
        
        // Latencia de 1500ms (1.5s)
        new Message("m3", "user2", "user", "Pregunta", "read", new Date(baseTime)),
        new Message("m4", "user2", "bot", "Información", "read", new Date(baseTime + 1500))
      ];

      mockMessageRepository.findAll.mockResolvedValue(mockMessages);
      mockSessionRepository.findAll.mockResolvedValue([]);

      await analyticsController.getAnalytics(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      const responseData = jsonSpy.mock.calls[0][0];
      expect(responseData.demo).toBe(false);
      // Promedio de 0.5s y 1.5s es 1.0s
      expect(responseData.latency.avg).toBe(1.0);
      expect(responseData.latency.min).toBe(0.5);
      expect(responseData.latency.max).toBe(1.5);
    });

    it("should enforce demo data if demo query parameter is true", async () => {
      mockReq.query = { demo: "true" };
      mockMessageRepository.findAll.mockResolvedValue([
        new Message("m1", "user1", "user", "Hola", "read", new Date())
      ]);

      await analyticsController.getAnalytics(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      const responseData = jsonSpy.mock.calls[0][0];
      expect(responseData.demo).toBe(true);
    });
  });
});
