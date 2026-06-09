/**
 * @file SocketServer.ts
 * @description Servidor Socket.io con conexiones anónimas permitidas.
 */
import { Server as SocketIoServer, Socket } from 'socket.io';
import logger from '../logging/Logger';

export class SocketServer {
  constructor(
    private readonly io: SocketIoServer
  ) {}

  /**
   * Registro de eventos de conexión.
   */
  public initEvents(): void {
    this.io.on('connection', (socket: Socket) => {
      try {
        logger.info(`⚡ [Socket Connected] Canal establecido con ID: ${socket.id}`);
      } catch (err: any) {
        logger.error(`[Socket Connection] Error en handler de conexión: ${err.message}`);
      }

      socket.on('join', (userId: string) => {
        try {
          socket.join(userId);
          logger.info(`📦 [Socket Room] El socket ${socket.id} se unió a la sala: ${userId}`);
        } catch (err: any) {
          logger.error(`[Socket Join] Error al unir sala: ${err.message}`);
        }
      });

      socket.on('disconnect', (reason) => {
        try {
          logger.info(`🔌 [Socket Disconnected] Canal cerrado para ID: ${socket.id} Razón: ${reason}`);
        } catch (err: any) {
          logger.error(`[Socket Disconnect] Error en handler: ${err.message}`);
        }
      });
    });
  }

  /**
   * Envía un evento exclusivamente a una sala privada.
   */
  public emitToPrivateRoom(room: string, event: string, payload: any): void {
    if (!room) {
      logger.error('[Socket Security] emitToPrivateRoom llamado sin room — bloqueado.');
      return;
    }
    if (this.io) {
      this.io.to(room).emit(event, payload);
      logger.info(`[Socket Isolation] Evento [${event}] emitido solo a sala: ${room}`);
    }
  }
}
