/**
 * @file MultiChatE2E.spec.ts
 * @description Suite de pruebas de integración End-to-End para verificar el endpoint
 * de simulación simultánea Quad-Chat sobre los 3 motores conversacionales.
 */

import request from 'supertest';
import { describe, beforeAll, it, expect } from '@jest/globals';
import { ExpressServer } from '../../infrastructure/server/ExpressServer';
import { AppContainer } from '../../infrastructure/containers/AppContainer';

describe('🧪 [E2E] Endpoint Simultáneo Multi-Chat (/api/simulator/multi-chat)', () => {
  let app: ExpressServer;

  beforeAll(async () => {
    // Inicializar el contenedor de dependencias en entorno de pruebas
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters_long';
    process.env.MASTER_ENCRYPTION_KEY = 'e8f902a34b12c8567123456789abcdef0123456789abcdef0123456789abcdef';

    const container = AppContainer.getInstance();
    await container.init(false, false); // Modo Mock/Test
    app = new ExpressServer(container);
  });

  it('Debe responder exitosamente con las estructuras de los 3 motores en simultáneo', async () => {
    const payload = {
      tenantId: 'tenant-demo-01',
      text: '¿Cuál es la tarifa de transporte de Medellín a Rionegero?',
      userPhone: 'TEST-SUITE-RUNNER',
    };

    const response = await request(app.getExpressInstance())
      .post('/api/simulator/multi-chat')
      .send(payload)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();

    // Validar contrato del Chat 1 (Full JS)
    expect(response.body.data.chat1Js).toBeDefined();
    expect(response.body.data.chat1Js.chatType).toBe('FULL_JS');

    // Validar contrato del Chat 2 (Híbrido)
    expect(response.body.data.chat2Hybrid).toBeDefined();
    expect(response.body.data.chat2Hybrid.chatType).toBe('HYBRID');

    // Validar contrato del Chat 3 (Full IA)
    expect(response.body.data.chat3FullAi).toBeDefined();
    expect(response.body.data.chat3FullAi.chatType).toBe('FULL_AI');
  });

  it('Debe rechazar la petición con error 400 si el campo "text" está ausente', async () => {
    const invalidPayload = {
      tenantId: 'tenant-demo-01',
      text: '',
    };

    const response = await request(app.getExpressInstance())
      .post('/api/simulator/multi-chat')
      .send(invalidPayload)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('obligatorio');
  });

  it('Debe aplicar degradación dinámica a JS si se excede la cuota diaria en Redis', async () => {
    // 1. Establecer un límite diario muy bajo (0.000001 USD)
    await request(app.getExpressInstance())
      .post('/api/tenant/quota/limit')
      .send({ limitUsd: 0.000001 })
      .expect(200);

    // 2. Primera petición: consume tokens e incrementa el acumulado
    const firstPayload = {
      tenantId: 'tenant-demo-01',
      text: 'Explicación detallada de tarifas de Medellín a Bogotá',
      userPhone: 'QUOTA-TEST-RUNNER',
    };

    await request(app.getExpressInstance())
      .post('/api/simulator/multi-chat')
      .send(firstPayload)
      .expect(200);

    // El primer mensaje puede pasar (o exceder inmediatamente), pero el siguiente DEFINITIVAMENTE debe estar degradado.
    const res2 = await request(app.getExpressInstance())
      .post('/api/simulator/multi-chat')
      .send(firstPayload)
      .expect(200);

    expect(res2.body.data.chat3FullAi.responseText).toContain('Límite de Presupuesto Excedido');
    expect(res2.body.data.chat3FullAi.sourceContext).toContain('Presupuesto LLM Excedido');

    // 3. Restaurar el límite a 0 (Ilimitado)
    await request(app.getExpressInstance())
      .post('/api/tenant/quota/limit')
      .send({ limitUsd: 0 })
      .expect(200);
  });
});
