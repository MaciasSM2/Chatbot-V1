import { Request, Response } from "express";
import { IMessageRepository } from "../../core/interfaces/repositories/IMessageRepository";
import { ISessionRepository } from "../../core/interfaces/repositories/ISessionRepository";
import logger from "../../infrastructure/logging/Logger";
import { MySQLClientRepository } from "../../providers/database/MySQLClientRepository";
import { ChatSession } from "../../core/entities/ChatSession";
import { TaskOrchestrator } from "../../core/services/TaskOrchestrator";

export class ChatController {
  constructor(
    private readonly messageRepository: IMessageRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly dbPool: any
  ) {}

  public async getActiveChats(_req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT 
          m.usuario_id as userId, 
          c.full_name as clientName, 
          c.is_registered as isRegistered,
          MAX(m.marca_tiempo) as lastMessageTime,
          (SELECT texto FROM mensajes WHERE usuario_id = m.usuario_id ORDER BY marca_tiempo DESC LIMIT 1) as lastMessageText,
          COALESCE(c.is_paused, 0) as isPaused,
          (SELECT paso_actual FROM sesiones_chat WHERE usuario_id = m.usuario_id) as currentStep,
          (SELECT metadatos FROM sesiones_chat WHERE usuario_id = m.usuario_id) as metadata
        FROM mensajes m 
        LEFT JOIN clients c ON m.usuario_id = c.phone_number 
        GROUP BY m.usuario_id, c.full_name, c.is_registered, c.is_paused
        ORDER BY lastMessageTime DESC
      `;
      const [rows]: any = await this.dbPool.query(query);
      const rowsWithEvents = rows.map((row: any) => {
        // En MySQL, los tipos booleanos de isRegistered/isPaused pueden venir como 1 o 0, o true/false
        const isRegistered = row.isRegistered === 1 || row.isRegistered === true || row.isRegistered === 'true';
        const isPaused = row.isPaused === 1 || row.isPaused === true || row.isPaused === 'true';
        const rowMetadata = typeof row.metadata === 'string' ? JSON.parse(row.metadata) : (row.metadata || {});

        return {
          userId: row.userId,
          clientName: row.clientName,
          isRegistered: isRegistered,
          lastMessageTime: row.lastMessageTime,
          lastMessageText: row.lastMessageText,
          isPaused: isPaused,
          currentStep: row.currentStep,
          metadata: {
            ...rowMetadata,
            events: TaskOrchestrator.getInstance().getEvents(row.userId)
          }
        };
      });
      res.status(200).json(rowsWithEvents);
    } catch (error) {
      logger.warn("[Chat] getActiveChats falló en MySQL, usando fallback de memoria", { error: error instanceof Error ? error.message : String(error) });
      
      try {
        const allMsgs = await this.messageRepository.findAll();
        
        // Agrupar mensajes por userId para obtener el último mensaje
        const userGroups = new Map<string, { lastMessageTime: Date, lastMessageText: string }>();
        for (const msg of allMsgs) {
          const existing = userGroups.get(msg.userId);
          if (!existing || msg.timestamp.getTime() > existing.lastMessageTime.getTime()) {
            userGroups.set(msg.userId, {
              lastMessageTime: msg.timestamp,
              lastMessageText: msg.text
            });
          }
        }
        
        const activeChats = [];
        for (const [userId, info] of userGroups.entries()) {
          // Buscar información del cliente en el repositorio de fallback
          const client = MySQLClientRepository.inMemoryClients.get(userId);
          const session = await this.sessionRepository.findByUserId(userId);
          activeChats.push({
            userId,
            clientName: client ? client.name : null,
            isRegistered: client ? client.isRegistered : false,
            lastMessageTime: info.lastMessageTime.toISOString(),
            lastMessageText: info.lastMessageText,
            isPaused: session ? session.isPaused : false,
            currentStep: session ? session.currentStep : 'WELCOME',
            metadata: session ? {
              isPaused: session.isPaused,
              lastStep: session.currentStep,
              clientName: client ? client.name : null,
              messageHistory: session.history,
              events: TaskOrchestrator.getInstance().getEvents(userId)
            } : {}
          });
        }
        
        // Ordenar chats por tiempo de último mensaje descendente
        activeChats.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        
        res.status(200).json(activeChats);
      } catch (fallbackError) {
        logger.error("[Chat] Fallback de getActiveChats también falló", { error: (fallbackError as Error).message });
        res.status(200).json([]);
      }
    }
  }

  public async getChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      if (typeof userId !== "string") {
        res.status(400).json({ error: "Falta el ID del chat" });
        return;
      }
      const history = await this.messageRepository.findByUserId(userId);
      res.status(200).json(history);
    } catch (error) {
      logger.error("Error obteniendo historial de chat", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send("Error interno");
    }
  }

  public async resetTestChat(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    if (typeof userId !== "string") {
      res.status(400).json({ error: "Falta el ID del chat" });
      return;
    }
    try {
      // 1. Borramos la sesión en Redis para forzar el estado 'WELCOME'
      await this.sessionRepository.delete(userId); 
      
      // 2. Borramos el historial de mensajes de la tabla de mensajes y memoria
      await this.messageRepository.clearHistory(userId);

      res.status(200).json({ message: "Sesión reiniciada con éxito" });
    } catch (error) {
      logger.error("Error al resetear chat de pruebas", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "No se pudo limpiar el chat" });
    }
  }

  public async searchMessages(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.q;
      const { startDate, endDate } = req.query;

      if (typeof query !== "string" || !query.trim()) {
        res.status(200).json([]);
        return;
      }

      const parsedStartDate = startDate && typeof startDate === "string" ? new Date(startDate) : undefined;
      const parsedEndDate = endDate && typeof endDate === "string" ? new Date(endDate) : undefined;
      
      const repo = this.messageRepository as any;
      if (typeof repo.searchMessages === "function") {
        const results = await repo.searchMessages(
          query.trim(),
          parsedStartDate && !isNaN(parsedStartDate.getTime()) ? parsedStartDate : undefined,
          parsedEndDate && !isNaN(parsedEndDate.getTime()) ? parsedEndDate : undefined
        );
        res.status(200).json(results);
      } else {
        res.status(200).json([]);
      }
    } catch (error) {
      logger.error("Error buscando mensajes", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send("Error interno");
    }
  }

  public async pauseBot(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    if (typeof userId !== "string") {
      res.status(400).json({ error: "Falta el ID del chat" });
      return;
    }
    try {
      let session = await this.sessionRepository.findByUserId(userId);
      if (!session) {
        session = new ChatSession({ userId, currentStep: "WELCOME", updatedAt: new Date() });
      }
      session.pauseBot();
      await this.sessionRepository.save(session);

      // Persistir is_paused en la base de datos relacional para homologación completa
      try {
        await this.dbPool.query('UPDATE clients SET is_paused = 1 WHERE phone_number = ?', [userId]);
      } catch (dbErr) {
        logger.warn(`[ChatController] No se pudo persistir is_paused en clients: ${(dbErr as Error).message}`);
      }

      logger.info(`[ChatController] Bot pausado para el usuario ${userId}`);
      res.status(200).json({ isPaused: true });
    } catch (error) {
      logger.error("Error al pausar el bot", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "No se pudo pausar el bot" });
    }
  }

  public async resumeBot(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    if (typeof userId !== "string") {
      res.status(400).json({ error: "Falta el ID del chat" });
      return;
    }
    try {
      let session = await this.sessionRepository.findByUserId(userId);
      if (session) {
        session.resumeBot();
        await this.sessionRepository.save(session);
      }

      // Persistir is_paused = 0 en la base de datos relacional para homologación completa
      try {
        await this.dbPool.query('UPDATE clients SET is_paused = 0 WHERE phone_number = ?', [userId]);
      } catch (dbErr) {
        logger.warn(`[ChatController] No se pudo persistir is_paused en clients: ${(dbErr as Error).message}`);
      }

      logger.info(`[ChatController] Bot reactivado para el usuario ${userId}`);
      res.status(200).json({ isPaused: false });
    } catch (error) {
      logger.error("Error al reactivar el bot", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).json({ error: "No se pudo reactivar el bot" });
    }
  }

  /**
   * POST /api/chat/toggle-pause
   * Altera el estado del flag de automatización en MariaDB y propaga el cambio por WebSockets.
   */
  public toggleBotAutomation = async (req: Request, res: Response): Promise<void> => {
    const phoneNumber = req.body.phoneNumber || req.body.phone_number;
    const isPaused = req.body.isPaused ?? req.body.is_paused;
    const operatorId = (req as any).adminContext?.operatorId || 'SYSTEM';

    if (!phoneNumber || isPaused === undefined) {
      res.status(400).json({ success: false, error: 'Número de teléfono y flag isPaused mandatorios.' });
      return;
    }

    const numericPauseFlag = isPaused ? 1 : 0;

    try {
      // 1. Ejecutar la mutación atómica en MariaDB sobre la tabla unificada de clientes
      const [_result] = await this.dbPool.query(
        `UPDATE clients SET is_paused = ? WHERE phone_number = ?`,
        [numericPauseFlag, phoneNumber]
      );

      // Mutar la sesión de la FSM también para mantener la consistencia híbrida
      let session = await this.sessionRepository.findByUserId(phoneNumber);
      if (session) {
        if (numericPauseFlag === 1) {
          session.pauseBot();
        } else {
          session.resumeBot();
        }
        await this.sessionRepository.save(session);
      }

      logger.info(`🔄 [Agent Interception] Operador ${operatorId} cambió automatización para ${phoneNumber} a: ${numericPauseFlag}`);

      res.status(200).json({
        success: true,
        message: numericPauseFlag === 1 ? 'Bot pausado. Control transferido al asesor humano.' : 'Bot reanudado con éxito.'
      });

    } catch (error: any) {
      logger.error('🚨 [ChatController Collapse] Falló la conmutación del estado del bot:', error);
      res.status(500).json({ success: false, error: 'Fallo interno modificando la compuerta de automatización.' });
    }
  };
}
