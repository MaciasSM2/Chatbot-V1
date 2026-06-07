/**
 * @file SiceTacLiquidationEngine.spec.ts
 * @description Suite de pruebas unitarias automatizadas para el motor de fletes pesados.
 * Aísla las llamadas de red simulando de forma atómica MariaDB y Redis.
 */
import { SiceTacLiquidationEngine } from './SiceTacLiquidationEngine';
import { Pool } from 'mysql2/promise';
import Redis from 'ioredis';

const mockMariadbPool = {
  query: jest.fn()
} as unknown as jest.Mocked<Pool>;

const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn()
} as unknown as jest.Mocked<Redis>;

describe('\u{1F69B} [Unit Test] SiceTacLiquidationEngine - Motor de Fletes', () => {
  let liquidationEngine: SiceTacLiquidationEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    liquidationEngine = new SiceTacLiquidationEngine(mockMariadbPool, mockRedisClient);
  });

  it('Debe resolver el flete en microsegundos si la ruta ya existe indexada en la caché de Redis (Hit L2)', async () => {
    const fakeRouteData = {
      originId: 'MEDELLIN',
      destinationId: 'RIONEGRO',
      baseCost: 350000,
      costPerTon: 22000,
      peajesCount: 2
    };

    mockRedisClient.get.mockResolvedValue(JSON.stringify(fakeRouteData));

    const calculatedFreight = await liquidationEngine.calculateFreight('MEDELLIN', 'RIONEGRO', 5, 'TURBO');

    // (350000 + (22000 * 5)) * 1.15 + (2 * 14500) = 460000 * 1.15 + 29000 = 529000 + 29000 = 558000
    expect(calculatedFreight).toBe(558000);

    expect(mockMariadbPool.query).not.toHaveBeenCalled();
    expect(mockRedisClient.get).toHaveBeenCalledWith('route:MEDELLIN:RIONEGRO');
  });

  it('Debe consultar MariaDB si la ruta no está en caché, calcular con éxito e indexar el resultado en Redis (Miss total)', async () => {
    const dbRowMock = [
      {
        origin_id: 'MEDELLIN',
        destination_id: 'LA_ESTRELLA',
        base_cost: '200000',
        cost_per_ton: '15000',
        peajes_count: '0'
      }
    ];

    mockRedisClient.get.mockResolvedValue(null);
    mockMariadbPool.query.mockResolvedValue([dbRowMock, []] as any);
    mockRedisClient.set.mockResolvedValue('OK');

    const calculatedFreight = await liquidationEngine.calculateFreight('MEDELLIN', 'LA_ESTRELLA', 10, 'SENCILLO');

    // (200000 + (15000 * 10)) * 1.30 + (0 * 14500) = (200000 + 150000) * 1.30 = 350000 * 1.30 = 455000
    expect(calculatedFreight).toBe(455000);

    expect(mockMariadbPool.query).toHaveBeenCalledTimes(1);
    expect(mockRedisClient.set).toHaveBeenCalledWith(
      'route:MEDELLIN:LA_ESTRELLA',
      expect.stringContaining('originId'),
      'EX',
      1800
    );
  });

  it('Debe arrojar una excepción controlada si la ruta consultada no existe en la matriz relacional del Ministerio', async () => {
    mockRedisClient.get.mockResolvedValue(null);
    mockMariadbPool.query.mockResolvedValue([[], []] as any);

    await expect(
      liquidationEngine.calculateFreight('MEDELLIN', 'CAPURGANA', 2, 'MINI_VANS')
    ).rejects.toThrow('Ruta logística no homologada en el sistema de transporte');
  });
});
