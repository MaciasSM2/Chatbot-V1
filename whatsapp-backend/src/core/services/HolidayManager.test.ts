import { HolidayManager } from "./HolidayManager";

describe("HolidayManager", () => {
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    };

    // Limpiar configuraciones en memoria antes de cada test
    HolidayManager.inMemoryCalendarSettings.clear();
  });

  describe("getHolidayStatus", () => {
    it("should retrieve static holidays as fallback", async () => {
      const manager = new HolidayManager();
      const status = await manager.getHolidayStatus(new Date("2026-01-01T12:00:00"));
      expect(status).toBe("NON_WORKABLE");
    });

    it("should prioritize database query if dbPool is provided", async () => {
      const manager = new HolidayManager(mockPool);
      mockPool.query.mockResolvedValueOnce([
        [{ day_type: "HOLIDAY_WORKABLE" }]
      ] as any);

      // 2026-01-01 is statically NON_WORKABLE, but DB says HOLIDAY_WORKABLE
      const status = await manager.getHolidayStatus(new Date("2026-01-01T12:00:00"));
      expect(mockPool.query).toHaveBeenCalledWith(
        "SELECT tipo_dia as day_type FROM configuraciones_calendario WHERE fecha = ?",
        ["2026-01-01"]
      );
      expect(status).toBe("WORKABLE");
    });

    it("should prioritize in-memory fallback if DB query fails or is not available", async () => {
      const manager = new HolidayManager(mockPool);
      // DB query fails
      mockPool.query.mockRejectedValueOnce(new Error("Database offline") as never);

      // Pre-populate memory
      HolidayManager.inMemoryCalendarSettings.set("2026-08-15", "HOLIDAY_NON_WORKABLE");

      const status = await manager.getHolidayStatus(new Date("2026-08-15T12:00:00"));
      expect(status).toBe("NON_WORKABLE");
    });

    it("should cancel a static holiday when explicitly overridden with WEEKDAY", async () => {
      const manager = new HolidayManager(mockPool);
      mockPool.query.mockResolvedValueOnce([
        [{ day_type: "WEEKDAY" }]
      ] as any);

      // 2026-01-01 is statically NON_WORKABLE, but DB says WEEKDAY
      const status = await manager.getHolidayStatus(new Date("2026-01-01T12:00:00"));
      expect(status).toBeNull();
    });

    it("should return null for dates that are not holidays statically, in DB, or in memory", async () => {
      const manager = new HolidayManager(mockPool);
      mockPool.query.mockResolvedValueOnce([[]] as any);

      // Normal weekday
      const status = await manager.getHolidayStatus(new Date("2026-05-13T12:00:00"));
      expect(status).toBeNull();
    });
  });
});
