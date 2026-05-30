import { PostgresMessageRepository } from "./PostgresMessageRepository";
import { Message } from "../../core/entities/Message";
import { Pool } from "pg";
import { PostgresClientRepository } from "./PostgresClientRepository";
import { Client } from "../../core/entities/Client";

describe("PostgresMessageRepository", () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: PostgresMessageRepository;

  beforeEach(() => {
    mockPool = {
      query: jest.fn(),
    } as unknown as jest.Mocked<Pool>;

    repository = new PostgresMessageRepository(mockPool);
    
    // Limpiar mensajes y clientes estáticos antes de cada prueba
    (PostgresMessageRepository as any).inMemoryMessages.length = 0;
    PostgresClientRepository.inMemoryClients.clear();
  });

  describe("save", () => {
    it("should try to save in DB and also save in memory", async () => {
      const msg = new Message("m1", "user123", "user", "Hola", "sent", new Date());
      mockPool.query.mockResolvedValueOnce({ rows: [] } as any);

      await repository.save(msg);

      expect(mockPool.query).toHaveBeenCalled();
      const inMem = (PostgresMessageRepository as any).inMemoryMessages;
      expect(inMem).toHaveLength(1);
      expect(inMem[0].id).toBe("m1");
    });

    it("should catch DB error and save in memory", async () => {
      const msg = new Message("m1", "user123", "user", "Hola", "sent", new Date());
      mockPool.query.mockRejectedValueOnce(new Error("DB error"));

      await repository.save(msg);

      expect(mockPool.query).toHaveBeenCalled();
      const inMem = (PostgresMessageRepository as any).inMemoryMessages;
      expect(inMem).toHaveLength(1);
      expect(inMem[0].id).toBe("m1");
    });
  });

  describe("searchMessages", () => {
    it("should query the database using ILIKE", async () => {
      const dbRows = [
        {
          id: "m1",
          userId: "user123",
          sender: "user",
          text: "Hola, ¿cómo estás?",
          status: "read",
          timestamp: new Date(),
          clientName: "Sebastian Macias",
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: dbRows } as any);

      const results = await repository.searchMessages("hola");

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("ILIKE"),
        ["%hola%"]
      );
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("m1");
      expect(results[0].clientName).toBe("Sebastian Macias");
    });

    it("should fall back to in-memory search when DB query fails", async () => {
      // Registrar cliente y guardar mensajes en memoria
      const client = new Client("c1", "user123", "Sebastian Macias", true);
      PostgresClientRepository.inMemoryClients.set("user123", client);

      const msg1 = new Message("m1", "user123", "user", "Hola amigo", "sent", new Date(Date.now() - 1000));
      const msg2 = new Message("m2", "user123", "bot", "Adiós", "received", new Date());

      // Guardar directamente en la memoria del mock
      (PostgresMessageRepository as any).inMemoryMessages.push(msg1, msg2);

      mockPool.query.mockRejectedValueOnce(new Error("DB Connection Refused"));

      const results = await repository.searchMessages("amigo");

      expect(mockPool.query).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("m1");
      expect(results[0].clientName).toBe("Sebastian Macias");
      expect(results[0].text).toBe("Hola amigo");
    });

    it("should query the database using ILIKE and date ranges", async () => {
      const dbRows = [
        {
          id: "m1",
          userId: "user123",
          sender: "user",
          text: "Hola, ¿cómo estás?",
          status: "read",
          timestamp: new Date("2026-05-22T10:00:00Z"),
          clientName: "Sebastian Macias",
        },
      ];
      mockPool.query.mockResolvedValueOnce({ rows: dbRows } as any);

      const start = new Date("2026-05-20");
      const end = new Date("2026-05-23");
      const results = await repository.searchMessages("hola", start, end);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining("AND m.timestamp >= $2 AND m.timestamp <= $3"),
        expect.arrayContaining(["%hola%", start])
      );
      expect(results).toHaveLength(1);
    });

    it("should filter by dates in in-memory fallback", async () => {
      const client = new Client("c1", "user123", "Sebastian Macias", true);
      PostgresClientRepository.inMemoryClients.set("user123", client);

      const msg1 = new Message("m1", "user123", "user", "Hola amigo", "sent", new Date("2026-05-22T10:00:00Z"));
      const msg2 = new Message("m2", "user123", "bot", "Hola compañero", "received", new Date("2026-05-20T10:00:00Z"));

      (PostgresMessageRepository as any).inMemoryMessages.push(msg1, msg2);
      mockPool.query.mockRejectedValueOnce(new Error("DB Connection Refused"));

      const start = new Date("2026-05-21");
      const results = await repository.searchMessages("hola", start, undefined);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("m1");
    });
  });
});
