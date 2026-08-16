/**
 * @file TransportLiquidationService.spec.ts
 * @description Validación de reglas impositivas y matrices de costos estatales.
 */
import { TransportLiquidationService, LiquidationRequest } from '../../core/services/TransportLiquidationService';

describe('💵 TransportLiquidationService - Rule Test Suite', () => {
  
  const sampleRequest: LiquidationRequest = {
    clientPhone: '573000000000',
    documentType: 'NIT',
    documentNumber: '901234567-1',
    clientName: 'Logística Antioquia',
    origin: 'Medellin',
    destination: 'Bogota'
  };

  it('debería liquidar una ruta existente aplicando tasa de IVA del 0%', async () => {
    // Arreglar
    const mockInvoiceRepo: any = {
      save: jest.fn().mockResolvedValue(123) // Retorna Insert ID ficticio
    };

    const mockLiquidationEngine: any = {
      calculateFreight: jest.fn().mockResolvedValue(1850000.00)
    };

    const service = new TransportLiquidationService(mockInvoiceRepo, mockLiquidationEngine);

    // Actuar
    const result = await service.calculateAndRegister(sampleRequest);

    // Asertar
    expect(result.id).toBe(123);
    expect(result.baseCost).toBe(1850000.00);
    expect(result.taxAmount).toBe(0.0); // Costo Base * 0.0
    expect(result.totalCost).toBe(1850000.00); // Costo Base + Tax
    expect(mockInvoiceRepo.save).toHaveBeenCalledTimes(1);
    expect(mockLiquidationEngine.calculateFreight).toHaveBeenCalledWith('MEDELLIN', 'BOGOTA', 1.0, 'SENCILLO');
  });

  it('debería aplicar tarifa de contingencia si la ruta es inexistente en SICE-TAC', async () => {
    // Arreglar
    const mockInvoiceRepo: any = {
      save: jest.fn().mockResolvedValue(124)
    };

    const mockLiquidationEngine: any = {
      calculateFreight: jest.fn().mockRejectedValue(new Error('Route not found'))
    };

    const service = new TransportLiquidationService(mockInvoiceRepo, mockLiquidationEngine);

    // Actuar
    const result = await service.calculateAndRegister(sampleRequest);

    // Asertar
    expect(result.baseCost).toBe(450000.00); // Activa la constante FALLBACK_BASE_COST
    expect(result.totalCost).toBe(450000.00);
  });
});

