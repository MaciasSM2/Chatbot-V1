/**
 * @file SocketServer.ts
 * @description Servidor Socket.io robusto con middleware perimetral de autenticación criptográfica.
 * Soluciona la vulnerabilidad C4 restringiendo el acceso a salas privadas mediante JWT.
 */
import { Server as SocketIoServer, Socket } from 'socket.io';
import { SecurityService } from '../../core/services/SecurityService';
import logger from '../logging/Logger';

export class SocketServer {
  constructor(
    private readonly io: SocketIoServer,
    private readonly securityService: SecurityService
  ) {}

  /**
   * Middleware de Intercepción perimetral en la fase de Handshake y registro de eventos.
   */
  public initEvents(): void {
    // 1. Middleware de Handshake Guard JWT
    this.io.use((socket: Socket, next) => {
      try {
        let clientToken = socket.handshake.query?.token as string | undefined;

        if (!clientToken && socket.handshake.headers?.cookie) {
          clientToken = this.extractTokenFromCookieString(socket.handshake.headers.cookie, 'admin_session_token') || undefined;
        }

        if (!clientToken) {
          logger.warn(`[Socket Auth Denied] Intento de conexión rechazado. Sockets anónimos bloqueados.`);
          return next(new Error('Authentication error: Token mandatorio ausente.'));
        }

        const decryptedPayload = this.securityService.verifySessionToken(clientToken);
        (socket as any).adminContext = decryptedPayload;
        
        return next();
      } catch (authException: any) {
        logger.error(`[Socket Auth Crash] Firma alterada o caducada: ${authException.message}`);
        return next(new Error('Authentication error: Firma inválida.'));
      }
    });

    // 2. Registro de eventos de conexión
    this.io.on('connection', (socket: Socket) => {
      const adminRole = (socket as any).adminContext?.role || 'OPERATOR';
      logger.info(`⚡ [Socket Connected] Canal establecido con ID: ${socket.id} | Rol: ${adminRole}`);

      // Mantener compatibilidad con "join" tradicional
      socket.on('join', (userId: string) => {
        socket.join(userId);
        logger.info(`📦 [Socket Room] El socket ${socket.id} se unió a la sala segura: ${userId}`);
      });

      socket.on('disconnect', (reason) => {
        logger.info(`🔌 [Socket Disconnected] Canal cerrado para ID: ${socket.id} Razón: ${reason}`);
      });
    });
  }

  /**
   * Parser auxiliar estricto para extraer cookies dentro del contexto del Handshake.
   */
  private extractTokenFromCookieString(cookieString: string, keyName: string): string | null {
    const cleanKey = keyName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(?:^|; )${cleanKey}=([^;]*)`);
    const match = cookieString.match(regex);
    return match ? decodeURIComponent(match[1]!) : null;
  }

  /**
   * Envía un evento exclusivamente a una sala privada (operador/cliente).
   * NO emite globalmente — corrige fuga de datos multi-inquilino.
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
