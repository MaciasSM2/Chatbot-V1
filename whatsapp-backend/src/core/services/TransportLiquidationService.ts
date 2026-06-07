import { IInvoiceRepository, InvoiceEntity } from '../interfaces/repositories/IInvoiceRepository';
import { ILiquidationEngine } from '../interfaces/services/ILiquidationEngine';
import logger from '../../infrastructure/logging/Logger';

export interface LiquidationRequest {
  clientPhone: string;
  documentType: 'CC' | 'NIT' | 'CE' | 'PPX';
  documentNumber: string;
  clientName: string;
  origin: string;
  destination: string;
}

export interface LiquidationResult {
  invoiceId: number;
  origin: string;
  destination: string;
  subtotal: number;
  total: number;
  usedFallback: boolean;
}

export class TransportLiquidationService {
  // Tasa de IVA parametrizable. Por defecto 0% para transporte de carga pública en Colombia
  private readonly TAX_RATE: number = 0.0;
  // Tarifa de contingencia por kilómetro/trayecto si la ruta no existe en SICE-TAC
  private readonly FALLBACK_BASE_COST: number = 450000.00;

  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly liquidationEngine: ILiquidationEngine
  ) {}

  /**
   * Orquesta la consulta de costos estatales, liquida impuestos y persiste la orden.
   * Método original de integración completa (CRM + documento).
   */
  public async calculateAndRegister(request: LiquidationRequest): Promise<InvoiceEntity> {
    let baseCost = this.FALLBACK_BASE_COST;

    // 1. Consultar matriz SICE-TAC usando el motor con caché
    try {
      baseCost = await this.liquidationEngine.calculateFreight(
        request.origin.toUpperCase().trim(),
        request.destination.toUpperCase().trim(),
        1.0,
        'SENCILLO'
      );
    } catch (error) {
      console.warn(`⚠️ [SICE-TAC] Ruta no encontrada: ${request.origin} -> ${request.destination}. Aplicando tarifa de contingencia.`);
    }

    // 3. Procesar desglose financiero
    const taxAmount = baseCost * this.TAX_RATE;
    const totalCost = baseCost + taxAmount;

    const invoice: InvoiceEntity = {
      clientPhone: request.clientPhone,
      documentType: request.documentType,
      documentNumber: request.documentNumber,
      clientName: request.clientName,
      origin: request.origin.toUpperCase(),
      destination: request.destination.toUpperCase(),
      baseCost,
      taxAmount,
      totalCost
    };

    // 4. Persistir registro atómico en el CRM (MariaDB)
    const insertId = await this.invoiceRepo.save(invoice);
    invoice.id = insertId;

    return invoice;
  }

  /**
   * Método simplificado invocado por la FSM conversacional.
   * No requiere datos del documento; persiste el registro y retorna el desglose financiero.
   */
  public async computeRouteLiquidation(
    phone: string,
    origin: string,
    destination: string
  ): Promise<LiquidationResult> {
    let finalCost = 0;
    let isFallbackActive = false;

    try {
      // 1. Extracción directa desde la matriz SICE-TAC usando el motor con caché de doble capa
      finalCost = await this.liquidationEngine.calculateFreight(
        origin.toUpperCase().trim(),
        destination.toUpperCase().trim(),
        1.0,
        'SENCILLO'
      );
    } catch (dbError) {
      logger.error(`🚨 [Liquidation FSM Error] Fallo MariaDB/Redis: ${dbError}. Tarifa de contingencia activada.`);
      finalCost = this.FALLBACK_BASE_COST;
      isFallbackActive = true;
    }

    // Transporte de carga terrestre Colombia: excluido de IVA (Tasa 0%)
    const subtotal = finalCost;
    const totalAmount = finalCost;

    // 2. Persistir el registro histórico de la orden en MariaDB
    const insertedId = await this.invoiceRepo.save({
      clientPhone: phone,
      documentType: 'CC',          // Tipo provisional hasta que la FSM lo recopile
      documentNumber: 'PENDIENTE',  // Se actualiza en flujo posterior de registro
      clientName: 'Cliente FSM',
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      baseCost: subtotal,
      taxAmount: 0,
      totalCost: totalAmount
    });

    return {
      invoiceId: insertedId,
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      subtotal,
      total: totalAmount,
      usedFallback: isFallbackActive
    };
  }
}

