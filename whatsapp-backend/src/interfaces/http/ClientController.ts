import { Request, Response } from "express";
import { IClientRepository } from "../../core/interfaces/repositories/IClientRepository";
import { ISessionRepository } from "../../core/interfaces/repositories/ISessionRepository";

import { Client } from "../../core/entities/Client";
import logger from "../../infrastructure/logging/Logger";
import { v4 as uuidv4 } from "uuid";

const allowedDocumentTypes = [
  "Cédula de Ciudadanía",
  "Tarjeta de Identidad",
  "Cédula de Extranjería",
  "Pasaporte"
];

function validateIdentityFields(metadata: any): string | null {
  if (!metadata) {
    return "Falta el objeto metadata con los campos obligatorios";
  }
  const docType = metadata.document_type;
  const docNumber = metadata.document_number;

  if (!docType) {
    return "El campo 'Tipo de Documento' es obligatorio";
  }
  if (!allowedDocumentTypes.includes(docType)) {
    return `El valor de 'Tipo de Documento' no es válido. Debe ser uno de: ${allowedDocumentTypes.join(", ")}`;
  }
  if (docNumber === undefined || docNumber === null || String(docNumber).trim() === "") {
    return "El campo 'Numero de ID' es obligatorio";
  }
  return null;
}

export class ClientController {
  constructor(
    private readonly clientRepository: IClientRepository,
    private readonly sessionRepository: ISessionRepository
  ) {}

  public async getClients(req: Request, res: Response): Promise<void> {
    try {
      const clients = await this.clientRepository.findAll();
      
      let sessions: any[] = [];
      try {
        sessions = await this.sessionRepository.findAll();
      } catch (err) {
        logger.warn("No se pudieron obtener las sesiones FSM para los clientes", { error: err instanceof Error ? err.message : String(err) });
      }

      const sessionsMap = new Map(sessions.map(s => [s.userId, s.currentStep]));

      const clientsWithState = clients.map((client: any) => {
        const state = sessionsMap.get(client.phoneNumber) || null;
        return {
          ...client,
          state
        };
      });

      res.status(200).json(clientsWithState);
    } catch (error) {
      logger.error("Error obteniendo clientes con FSM state", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send("Error interno");
    }
  }


  public async createClient(req: Request, res: Response): Promise<void> {
    try {
      const { id, phoneNumber, name, isRegistered, metadata } = req.body;
      if (!phoneNumber) {
        res.status(400).json({ error: "Falta el número de teléfono" });
        return;
      }

      const validationError = validateIdentityFields(metadata);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }
      
      const client = new Client(
        id || uuidv4(),
        phoneNumber,
        name || null,
        isRegistered !== undefined ? isRegistered : false,
        metadata || {}
      );

      await this.clientRepository.save(client);
      logger.info("Cliente creado/actualizado", { id: client.id, phoneNumber, name, isRegistered, metadata });
      res.status(201).json(client);
    } catch (error) {
      logger.error("Error creando cliente", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send("Error interno");
    }
  }

  public async updateClient(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (typeof id !== "string") {
        res.status(400).json({ error: "Falta el ID del cliente" });
        return;
      }
      const { name, isRegistered, metadata } = req.body;

      if (metadata !== undefined) {
        const validationError = validateIdentityFields(metadata);
        if (validationError) {
          res.status(400).json({ error: validationError });
          return;
        }
      }

      const existingClient = await this.clientRepository.findById(id);
      if (!existingClient) {
        res.status(404).json({ error: "Cliente no encontrado" });
        return;
      }

      const updatedClient = new Client(
        existingClient.id,
        existingClient.phoneNumber,
        name !== undefined ? name : existingClient.name,
        isRegistered !== undefined ? isRegistered : existingClient.isRegistered,
        metadata !== undefined ? metadata : existingClient.metadata
      );

      await this.clientRepository.save(updatedClient);

      logger.info("Cliente actualizado", { id, name, isRegistered, metadata });
      res.status(200).json(updatedClient);
    } catch (error) {
      logger.error("Error actualizando cliente", { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send("Error interno");
    }
  }
}


