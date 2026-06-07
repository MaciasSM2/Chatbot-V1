import { AnalyticsController } from "./controllers/AnalyticsController";
import { StatsService } from "../../core/services/StatsService";
import { Request, Response } from "express";

describe("AnalyticsController", () => {
  let analyticsController: AnalyticsController;
  let mockStatsService: jest.Mocked<StatsService>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    mockStatsService = {
      getDailyMessageVolume: jest.fn(),
      getFsmFunnelStats: jest.fn()
    } as unknown as jest.Mocked<StatsService>;

    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();

    mockReq = {};
    mockRes = {
      status: statusSpy,
      json: jsonSpy
    };

    analyticsController = new AnalyticsController(mockStatsService);
  });

  describe("getDashboardMetrics", () => {
    it("should return volume and funnel metrics successfully", async () => {
      const mockVolume = [{ date: '2026-06-05', userMessages: 10, botMessages: 15 }];
      const mockFunnel = { CC: 5, NIT: 3, CE: 1, PPX: 0 };

      mockStatsService.getDailyMessageVolume.mockResolvedValue(mockVolume);
      mockStatsService.getFsmFunnelStats.mockResolvedValue(mockFunnel);

      await analyticsController.getDashboardMetrics(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(200);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: true,
        data: {
          volume: mockVolume,
          funnel: mockFunnel
        }
      });
    });

    it("should return 500 status on service failure", async () => {
      mockStatsService.getDailyMessageVolume.mockRejectedValue(new Error("Database error"));

      await analyticsController.getDashboardMetrics(mockReq as Request, mockRes as Response);

      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({
        success: false,
        error: "Error de sintaxis interna al compilar estadísticas desde MariaDB."
      });
    });
  });
});
