/**
 * @file BrandPromptService.spec.ts
 * @description Suite de pruebas unitarias con dobles de prueba (Mocks).
 */
import { BrandPromptService } from '../../core/services/BrandPromptService';
import { BrandConfig } from '../../core/entities/BrandConfig';

describe('🧠 BrandPromptService - Unit Test Suite', () => {
  
  // Mock de datos válidos de MariaDB
  const mockDbConfig = new BrandConfig(
    'MAIN_CONFIG',
    'Libros Medellín Test',
    'Cultura en movimiento',
    'Hablar con tono formal.',
    'http://test.com/logo.png',
    '08:00',
    '18:00',
    1,
    'WHATSAPP_GREEN'
  );

  it('debería compilar el System Prompt reemplazando tokens correctamente', async () => {
    // Arreglar (Setup Mocks con SOLID - D)
    const mockRepo: any = {
      getConfig: jest.fn().mockResolvedValue(mockDbConfig),
      updateConfig: jest.fn()
    };

    // El Circuit Breaker simplemente ejecuta la acción en estado CLOSED (Normal)
    const mockBreaker: any = {
      execute: jest.fn().mockImplementation((action) => action())
    };

    const service = new BrandPromptService(mockRepo, mockBreaker);

    // Actuar
    const finalPrompt = await service.buildCustomSystemPrompt();

    // Asertar
    expect(finalPrompt).toContain('Libros Medellín Test');
    expect(finalPrompt).toContain('Cultura en movimiento');
    expect(finalPrompt).toContain('Hablar con tono formal.');
    expect(mockRepo.getConfig).toHaveBeenCalledTimes(1);
  });

  it('debería activar el Fallback de contingencia si el repositorio lanza una excepción', async () => {
    // Arreglar: El repositorio simula una caída crítica de infraestructura
    const mockRepo: any = {
      getConfig: jest.fn().mockRejectedValue(new Error('Pool connection timeout')),
      updateConfig: jest.fn()
    };

    // El Circuit Breaker detecta el fallo y desvía la ejecución al segundo parámetro (fallbackAction)
    const mockBreaker: any = {
      execute: jest.fn().mockImplementation((_action, fallbackAction) => fallbackAction())
    };

    const service = new BrandPromptService(mockRepo, mockBreaker);

    // Actuar
    const finalPrompt = await service.buildCustomSystemPrompt();

    // Asertar: Verifica que a pesar del fallo de DB, el sistema responde con la marca por defecto
    expect(finalPrompt).toContain('Central de Transportes'); // Nombre por defecto del Fallback
    expect(finalPrompt).not.toContain('Pool connection timeout'); // No expone el error técnico
  });
});

