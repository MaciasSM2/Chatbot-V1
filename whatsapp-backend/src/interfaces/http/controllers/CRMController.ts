/**
 * @file CRMController.ts
 * @description Adaptador primario para despachar los datos del CRM hacia el Dashboard Next.js.
 */
import { Request, Response } from 'express';
import { MySQLClientRepository } from '../../../providers/database/MySQLClientRepository';

export class CRMController {
  constructor(private readonly clientRepo: MySQLClientRepository) {}

  /**
   * GET /api/crm/clients
   * Despacha la lista completa de fichas de atención.
   */
  public async getClients(_req: Request, res: Response): Promise<Response> {
    try {
      const data = await this.clientRepo.getAllRaw();
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      console.error(`❌ [CRMController][getClients] Error: ${error.message}`);
      return res.status(500).json({ success: false, error: 'Error interno consultando la base de datos CRM.' });
    }
  }

  /**
   * POST /api/admin/crm/clients/sync
   * Sincroniza un cliente desde el buffer offline de IndexedDB.
   */
  public syncClient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone_number, name, is_registered, metadata } = req.body;
      if (!phone_number) {
        res.status(400).json({ success: false, error: 'phone_number es obligatorio.' });
        return;
      }
      await (this.clientRepo as any).save({
        phone_number,
        name: name || null,
        is_registered: is_registered ?? true,
        metadata: metadata || {}
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error('❌ [CRMController][syncClient] Error:', err.message);
      res.status(500).json({ success: false, error: 'Error interno al sincronizar cliente.' });
    }
  };
}
