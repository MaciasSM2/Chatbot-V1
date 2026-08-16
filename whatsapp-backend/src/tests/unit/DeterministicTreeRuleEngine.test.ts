import { DeterministicTreeRuleEngine } from '../../core/services/DeterministicTreeRuleEngine';

describe('DeterministicTreeRuleEngine', () => {
  let engine: DeterministicTreeRuleEngine;

  beforeEach(() => {
    engine = new DeterministicTreeRuleEngine();
  });

  test('debe emparejar saludo "hola" con el nodo de bienvenida', () => {
    const result = engine.evaluate('hola');
    expect(result.isFallback).toBe(false);
    expect(result.matchedNode).not.toBeNull();
    expect(result.matchedNode?.id).toBe('node-01-greeting');
    expect(result.matchedNode?.responseText).toContain('ProChat Enterprise');
  });

  test('debe emparejar "horarios" con el nodo de horario y ubicacion', () => {
    const result = engine.evaluate('¿Cuales son los horarios de atencion?');
    expect(result.isFallback).toBe(false);
    expect(result.matchedNode?.id).toBe('node-03-location-hours');
  });

  test('debe emparejar "asesor" con el nodo de derivacion humana', () => {
    const result = engine.evaluate('Quiero hablar con un asesor');
    expect(result.isFallback).toBe(false);
    expect(result.matchedNode?.id).toBe('node-13-human-handoff');
    expect(result.matchedNode?.requiresHumanEscalation).toBe(true);
  });

  test('debe retornar fallback para un texto no reconocido', () => {
    const result = engine.evaluate('xyz123456789 unmapped text input');
    expect(result.isFallback).toBe(true);
    expect(result.matchedNode?.id).toBe('node-19-fallback-unknown');
  });
});
