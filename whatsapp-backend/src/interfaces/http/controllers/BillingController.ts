import { Request, Response } from 'express';
import { IInvoiceRepository } from '../../../core/interfaces/repositories/IInvoiceRepository';
import { ApiResponse } from '../types/ApiResponse';

export class BillingController {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  public getInvoices = async (_req: Request, res: Response): Promise<void> => {
    try {
      const invoices = await this.invoiceRepo.getAll();
      res.status(200).json({ success: true, data: invoices } as ApiResponse);
    } catch (error: any) {
      console.error(`[BillingController] Error: ${error.message}`);
      res.status(500).json({ success: false, error: 'Error al obtener liquidaciones.' } as ApiResponse);
    }
  };
}
