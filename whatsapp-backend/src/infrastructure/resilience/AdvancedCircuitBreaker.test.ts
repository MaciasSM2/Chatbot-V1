import { AdvancedCircuitBreaker } from './AdvancedCircuitBreaker';

describe('AdvancedCircuitBreaker', () => {
  it('debería ejecutar la acción normalmente cuando el circuito está CLOSED', async () => {
    const breaker = new AdvancedCircuitBreaker(3, 1000);
    const action = jest.fn().mockResolvedValue('resultado_exitoso');
    const fallback = jest.fn().mockResolvedValue('resultado_fallback');

    const result = await breaker.execute(action, fallback);

    expect(result).toBe('resultado_exitoso');
    expect(action).toHaveBeenCalledTimes(1);
    expect(fallback).not.toHaveBeenCalled();
  });

  it('debería ejecutar el fallback y abrir el circuito después de superar el umbral de fallos', async () => {
    const breaker = new AdvancedCircuitBreaker(2, 5000);
    const badAction = jest.fn().mockRejectedValue(new Error('Fallo de conexión'));
    const fallback = jest.fn().mockResolvedValue('resultado_fallback');

    // Primer fallo
    let result = await breaker.execute(badAction, fallback);
    expect(result).toBe('resultado_fallback');
    expect(badAction).toHaveBeenCalledTimes(1);

    // Segundo fallo (alcanza el umbral de 2)
    result = await breaker.execute(badAction, fallback);
    expect(result).toBe('resultado_fallback');
    expect(badAction).toHaveBeenCalledTimes(2);

    // Tercer intento: circuito abierto, no debería llamar a badAction
    const newAction = jest.fn().mockResolvedValue('no_deberia_llamarse');
    result = await breaker.execute(newAction, fallback);
    expect(result).toBe('resultado_fallback');
    expect(newAction).not.toHaveBeenCalled();
  });
});
