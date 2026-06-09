/**
 * @file CRMController.ts
 * @description Adaptador primario para despachar los datos del CRM hacia el Dashboard Next.js.
 */
import { Request, Response } from 'express';
import { MySQLClientRepository } from '../../../providers/database/MySQLClientRepository';
import { Client } from '../../../core/entities/Client';
import logger from '../../../infrastructure/logging/Logger';
import { ApiResponse } from '../types/ApiResponse';

export class CRMController {
  constructor(private readonly clientRepo: MySQLClientRepository) {}

  /**
   * GET /api/admin/crm/clients
   * Despacha la lista completa de fichas de atención.
   */
  public getClients = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.clientRepo.getAllRaw();
      res.status(200).json({ success: true, data } as ApiResponse<any[]>);
    } catch (error: any) {
      logger.error(`[CRMController][getClients] ${error.message}`);
      res.status(500).json({ success: false, error: 'Error interno consultando la base de datos CRM.' } as ApiResponse);
    }
  };

  /**
   * POST /api/admin/crm/clients
   * Crea un nuevo prospecto.
   * Body: { phoneNumber, name?, isRegistered?, metadata? }
   */
  public createClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phoneNumber, name, isRegistered, metadata } = req.body;
      if (!phoneNumber || typeof phoneNumber !== 'string') {
        res.status(400).json({ success: false, error: 'phoneNumber es obligatorio.' } as ApiResponse);
        return;
      }

      const existing = await this.clientRepo.findByPhoneNumber(phoneNumber);
      if (existing) {
        res.status(409).json({ success: false, error: 'Cliente ya existe con ese teléfono.' } as ApiResponse);
        return;
      }

      const client = new Client(
        phoneNumber,
        phoneNumber,
        name || null,
        isRegistered === true,
        metadata || {}
      );
      await this.clientRepo.save(client);
      res.status(201).json({
        success: true,
        data: {
          id: client.id,
          phoneNumber: client.phoneNumber,
          name: client.name,
          isRegistered: client.isRegistered,
          metadata: client.metadata
        }
      } as ApiResponse<{ id: string; phoneNumber: string; name: string | null; isRegistered: boolean; metadata: Record<string, any> }>);
    } catch (err: any) {
      logger.error(`[CRMController][createClient] ${err.message}`);
      res.status(500).json({ success: false, error: 'Error creando cliente.' } as ApiResponse);
    }
  };

  /**
   * PUT /api/admin/crm/clients/:id
   * Actualiza datos de un cliente existente.
   * Body: { name?, isRegistered?, metadata? }
   */
  public updateClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: 'ID de cliente obligatorio.' } as ApiResponse);
        return;
      }
      const existing = await this.clientRepo.findByPhoneNumber(id);
      if (!existing) {
        res.status(404).json({ success: false, error: 'Cliente no encontrado.' } as ApiResponse);
        return;
      }

      const { name, isRegistered, metadata } = req.body;
      const merged = new Client(
        existing.id,
        existing.phoneNumber,
        name !== undefined ? name : existing.name,
        isRegistered !== undefined ? !!isRegistered : existing.isRegistered,
        metadata !== undefined ? { ...existing.metadata, ...metadata } : existing.metadata
      );
      await this.clientRepo.save(merged);
      res.status(200).json({
        success: true,
        data: {
          id: merged.id,
          phoneNumber: merged.phoneNumber,
          name: merged.name,
          isRegistered: merged.isRegistered,
          metadata: merged.metadata
        }
      } as ApiResponse<{ id: string; phoneNumber: string; name: string | null; isRegistered: boolean; metadata: Record<string, any> }>);
    } catch (err: any) {
      logger.error(`[CRMController][updateClient] ${err.message}`);
      res.status(500).json({ success: false, error: 'Error actualizando cliente.' } as ApiResponse);
    }
  };

  /**
   * POST /api/admin/crm/clients/sync
   * Sincroniza un cliente desde el buffer offline de IndexedDB.
   */
  public syncClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const phoneNumber = req.body.phoneNumber || req.body.phone_number;
      const name = req.body.name || null;
      const isRegistered = req.body.isRegistered ?? req.body.is_registered ?? true;
      const metadata = req.body.metadata || {};

      if (!phoneNumber) {
        res.status(400).json({ success: false, error: 'phoneNumber es obligatorio.' } as ApiResponse);
        return;
      }
      const client = new Client(phoneNumber, phoneNumber, name, isRegistered, metadata);
      await this.clientRepo.save(client);
      res.json({ success: true } as ApiResponse);
    } catch (err: any) {
      logger.error(`[CRMController][syncClient] ${err.message}`);
      res.status(500).json({ success: false, error: 'Error interno al sincronizar cliente.' } as ApiResponse);
    }
  };
}
