import { Worker } from "bullmq";
import Redis from "ioredis";
import { ChatbotOrchestrator } from "./services/ChatbotOrchestrator";
import { WelcomeOrchestrator } from "./services/WelcomeOrchestrator";
import { ISessionRepository } from "./interfaces/repositories/ISessionRepository";
import { ChatSession } from "./entities/ChatSession";
import { IWhatsAppGateway } from "./interfaces/IWhatsAppGateway";
import { Server as SocketIOServer } from "socket.io";
import logger from "../infrastructure/logging/Logger";
import { processingDuration } from "../infrastructure/metrics/Metrics";
import { IMessageRepository } from "./interfaces/repositories/IMessageRepository";
import { Message } from "./entities/Message";
import { resolveContext } from "./services/ContextResolver";
import { resolveAmbiguity } from "./services/AmbiguityResolver";
import { TaskOrchestrator } from "./services/TaskOrchestrator";

export class MessageWorker {
  private worker: Worker | null = null;

  constructor(
    private readonly redisConnection: Redis,
    private readonly orchestrator: ChatbotOrchestrator,
    private readonly sessionRepository: ISessionRepository,
    private readonly whatsappClient: IWhatsAppGateway,
    private readonly io: SocketIOServer,
    private readonly messageRepository: IMessageRepository,
    private readonly welcomeOrchestrator: WelcomeOrchestrator
  ) {}

  public async processContinuityDirectly(userId: string, minutes: number): Promise<void> {
    logger.info("Verificando posibilidad de envío de continuidad", { userId, minutes });

    let session = await this.sessionRepository.findByUserId(userId);
    if (session && session.isPaused) {
      logger.info(`🚫 Silencio: Omitiendo recordatorio de continuidad para ${userId} debido a intervención humana activa.`);
      return;
    }
    
    // REGLA CRÍTICA: Solo enviar si el último mensaje fue del CLIENTE.
    // Si el último mensaje fue 'bot', significa que ya atendimos o ya enviamos un recordatorio.
    const lastMessage = await this.messageRepository.findLastByUserId(userId);
    
    if (lastMessage && lastMessage.sender === 'user') {
      const greeting = await this.welcomeOrchestrator.handleContinuity(userId, minutes);
      
      const botMsgId = `bot_${Date.now()}`;
      const botMsg = new Message(botMsgId, userId, 'bot', greeting.message, 'delivered', new Date());
      await this.messageRepository.save(botMsg);
      
      this.io.to(userId).emit(`new_message_${userId}`, {
        id: botMsgId, sender: 'bot', text: greeting.message, timestamp: botMsg.timestamp, status: 'delivered'
      });

      try {
        if (process.env.WA_ACCESS_TOKEN && process.env.WA_PHONE_NUMBER_ID) {
          await this.whatsappClient.sendMessage(userId, greeting.message);
        }
      } catch (apiError) {}

      logger.info(`📢 Recordatorio de ${minutes} min enviado a ${userId}`);
    } else {
      logger.info(`⏭️ Recordatorio de ${minutes} min saltado: El usuario ya fue atendido o el bot fue el último en escribir.`, { userId });
    }
  }

  public async processMessageDirectly(messageId: string, userId: string, messageBody: string, customResponse?: string | null): Promise<void> {
    logger.info("Procesando mensaje directamente", { messageId, userId });

    const userMsg = new Message(
      messageId || `msg_${Date.now()}`,
      userId,
      'user',
      messageBody,
      'read',
      new Date()
    );
    await this.messageRepository.save(userMsg);

    let session = await this.sessionRepository.findByUserId(userId);
    if (!session) {
      session = new ChatSession({ userId, currentStep: "WELCOME", updatedAt: new Date() });
    }

    if (session.isPaused) {
      logger.info(`🚫 Silencio: El bot recibió un mensaje de ${userId} pero la intervención humana está activa. Omitiendo respuesta automática.`);
      return;
    }

    // 1. Registrar interrupción previa. Si el usuario ya tenía una respuesta pendiente, se cancelará.
    const taskOrchestrator = TaskOrchestrator.getInstance();
    taskOrchestrator.registerTask(userId, null as any); // Limpia tarea anterior

    // 2. Guardar mensaje del usuario en el buffer de corto plazo
    session.addMessageToHistory('user', messageBody);
    await this.sessionRepository.save(session);
    taskOrchestrator.logEvent(userId, `Mensaje del usuario recibido: "${messageBody.substring(0, 30)}..."`);

    // 3. Programar la respuesta del bot con posibilidad de ser interrumpida
    const responseTask = setTimeout(async () => {
      try {
        // Resolver el contexto usando la memoria de corto plazo
        const context = resolveContext(session, messageBody);
        logger.info("Contexto resuelto", { userId, action: context.action, value: context.value });

        // Realizar análisis semántico de coincidencia de intención (Levenshtein)
        let finalMessageBody = messageBody;
        let responseMessage = "";
        let nextStep = session.currentStep;
        let bypassOrchestrator = false;
        let semanticResolution = null;

        if (customResponse) {
          responseMessage = customResponse;
          bypassOrchestrator = true;
          taskOrchestrator.logEvent(userId, `Test Custom Response: "${customResponse.substring(0, 35)}..."`);
        } else if (session.currentStep === 'AWAITING_MENU_OPTION') {
          const menuOptions = ["1", "2", "3", "soporte", "ventas", "horarios"];
          semanticResolution = resolveAmbiguity(messageBody, menuOptions);
          taskOrchestrator.logEvent(userId, `Análisis semántico: coincidencia "${semanticResolution.match.option}" (Dist: ${semanticResolution.match.distance}, Tipo: ${semanticResolution.type})`);
          
          if (semanticResolution.type === 'EXECUTE') {
            const target = semanticResolution.match.option;
            if (target === "1" || target === "soporte") {
              finalMessageBody = "1";
            } else if (target === "2" || target === "ventas") {
              finalMessageBody = "2";
            } else if (target === "3" || target === "horarios") {
              finalMessageBody = "3";
            }
          } else {
            bypassOrchestrator = true;
            nextStep = 'AWAITING_MENU_OPTION';
            responseMessage = semanticResolution.text || "Lo siento, no logré entender eso.";
            if (semanticResolution.type === 'FAILSAFE') {
              responseMessage += "\n\n1. Soporte Técnico\n2. Ventas\n3. Horarios";
            }
          }
        }

        if (!semanticResolution) {
          const commonOptions = ["soporte", "ventas", "horarios", "registro", "ayuda", "salir"];
          semanticResolution = resolveAmbiguity(messageBody, commonOptions);
        }

        if (context.action === 'END_CONVERSATION') {
          logger.info(`ℹ️ Contexto END_CONVERSATION detectado para ${userId}.`);
          taskOrchestrator.logEvent(userId, "Flujo cerrado por detección de agradecimiento.", "INFO");
        }

        if (!bypassOrchestrator) {
          const result = await this.orchestrator.processMessage(
            session.currentStep, userId, finalMessageBody
          );
          nextStep = result.nextStep;
          responseMessage = result.responseMessage;
        }

        session.transitionTo(nextStep);


        // Guardar mensaje del bot en el buffer de corto plazo
        session.addMessageToHistory('bot', responseMessage);

        // Guardar intención semántica calculada en el metadato dinámico de la sesión
        session.updateMetadata({
          semanticIntention: {
            lastInput: messageBody,
            bestMatch: semanticResolution.match.option,
            distance: semanticResolution.match.distance
          }
        });

        await this.sessionRepository.save(session);
        logger.info("Respuesta generada", { userId, nextStep });

        const botMsgId = `bot_${Date.now()}`;
        const botMsg = new Message(botMsgId, userId, 'bot', responseMessage, 'delivered', new Date());
        await this.messageRepository.save(botMsg);

        // Emitir mensaje al frontend
        this.io.to(userId).emit(`new_message_${userId}`, {
          id: botMsgId, sender: 'bot', text: responseMessage, timestamp: botMsg.timestamp, status: 'delivered'
        });

        try {
          if (process.env.WA_ACCESS_TOKEN && process.env.WA_PHONE_NUMBER_ID) {
            await this.whatsappClient.sendMessage(userId, responseMessage);
          } else {
            logger.info("Envío de WhatsApp omitido de forma segura (credenciales no configuradas)", { userId });
          }
        } catch (apiError) {
          logger.error("Error al enviar mensaje vía WhatsApp API (pero el flujo continúa)", {
            userId, error: apiError instanceof Error ? apiError.message : String(apiError)
          });
        }

        // Limpiar la tarea
        taskOrchestrator.clearTask(userId);
        taskOrchestrator.logEvent(userId, "Respuesta automática generada con éxito");
      } catch (err) {
        logger.error("Error en tarea de respuesta del bot asíncrona", { error: (err as Error).message });
      }
    }, 2000); // 2 segundos de retardo de "pensamiento" e interruptibilidad!

    taskOrchestrator.registerTask(userId, responseTask);
  }

  public start() {
    const useRedis = process.env.USE_REDIS !== 'false';
    if (!useRedis || !this.redisConnection) {
      logger.info("[Worker] Iniciando en modo local (sin Redis). Procesamiento asíncrono activado en memoria.");
      return;
    }

    try {
      this.worker = new Worker("process-whatsapp-message", async (job) => {
        const endTimer = processingDuration.startTimer();
        
        if (job.name === 'send_continuity') {
          const { userId, minutes } = job.data;
          logger.info("Procesando recordatorio de continuidad", { jobId: job.id, userId, minutes });
          await this.processContinuityDirectly(userId, minutes);
        } else {
          const { messageId, userId, messageBody, customResponse } = job.data;
          logger.info("Procesando mensaje de la cola", { jobId: job.id, userId });
          await this.processMessageDirectly(messageId, userId, messageBody, customResponse);
        }
        
      }, { 
        connection: this.redisConnection,
        limiter: {
          max: 1,
          duration: 1000
        }
      });
      
      logger.info("Worker de mensajes iniciado y escuchando (modo Redis)...");
    } catch (err) {
      logger.warn("[Worker] BullMQ no pudo iniciar (modo demo sin Redis)", { error: (err as Error).message });
    }
  }

  public async close(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      logger.info("🏗️ Instancia interna del Worker de BullMQ cerrada.");
    }
  }
}
