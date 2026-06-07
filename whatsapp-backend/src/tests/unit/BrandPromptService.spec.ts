/**
 * @file BrandPromptService.spec.ts
 * @description Suite de pruebas unitarias con dobles de prueba (Mocks).
 */
import { BrandPromptService } from '../../core/services/BrandPromptService';
import { IBrandRepository } from '../../core/interfaces/repositories/IBrandRepository';
import { ICircuitBreaker } from '../../core/interfaces/resilience/ICircuitBreaker';
import { BrandConfig } from '../../core/entities/BrandConfig';

describe('🧠 BrandPromptService - Unit Test Suite', () => {
  
  // Mock de datos válidos de MariaDB
  const mockDbConfig: BrandConfig = {
    id: 'MAIN_CONFIG',
    companyName: 'Libros Medellín Test',
    companySlogan: 'Cultura en movimiento',
    companyLogoUrl: 'http://test.com/logo.png',
    institutionalLanguage: 'Hablar con tono formal.',
    startWorkHour: '08:00',
    endWorkHour: '18:00',
    operationMode: 1
  };

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
      execute: jest.fn().mockImplementation((action, fallbackAction) => fallbackAction())
    };

    const service = new BrandPromptService(mockRepo, mockBreaker);

    // Actuar
    const finalPrompt = await service.buildCustomSystemPrompt();

    // Asertar: Verifica que a pesar del fallo de DB, el sistema responde con la marca por defecto
    expect(finalPrompt).toContain('Central de Transportes'); // Nombre por defecto del Fallback
    expect(finalPrompt).not.toContain('Pool connection timeout'); // No expone el error técnico
  });
});
