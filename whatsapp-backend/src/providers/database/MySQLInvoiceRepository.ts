import { Pool, ResultSetHeader } from 'mysql2/promise';
import { IInvoiceRepository, InvoiceEntity } from '../../core/interfaces/repositories/IInvoiceRepository';

export class MySQLInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly pool: Pool) {}

  async save(invoice: InvoiceEntity): Promise<number> {
    const [result] = await this.pool.query<ResultSetHeader>(
      `INSERT INTO transport_invoices 
        (client_phone, document_type, document_number, client_name, origin, destination, base_cost, tax_amount, total_cost) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice.clientPhone,
        invoice.documentType,
        invoice.documentNumber,
        invoice.clientName,
        invoice.origin,
        invoice.destination,
        invoice.baseCost,
        invoice.taxAmount,
        invoice.totalCost
      ]
    );

    return result.insertId;
  }
}
