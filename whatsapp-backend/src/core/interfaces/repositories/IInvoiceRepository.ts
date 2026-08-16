export interface InvoiceEntity {
  id?: number;
  clientPhone: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'PPX';
  documentNumber: string;
  clientName: string;
  origin: string;
  destination: string;
  baseCost: number;
  taxAmount: number;
  totalCost: number;
  createdAt?: Date;
}

export interface IInvoiceRepository {
  /**
   * Registra y persiste una liquidación oficial en la base de datos relacional.
   */
  save(invoice: InvoiceEntity): Promise<number>;
  getAll(): Promise<InvoiceEntity[]>;
}
