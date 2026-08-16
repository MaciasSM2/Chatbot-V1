import request from 'supertest';
import { describe, beforeAll, test, expect } from '@jest/globals';
import { ExpressServer } from '../../infrastructure/server/ExpressServer';
import { AppContainer } from '../../infrastructure/containers/AppContainer';

describe('B2B Fullstack Contract Suite — Backend Express ↔ Next.js Dashboard', () => {
  let server: ExpressServer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_key_minimum_32_characters_long';
    process.env.MASTER_ENCRYPTION_KEY = 'e8f902a34b12c8567123456789abcdef0123456789abcdef0123456789abcdef';

    const container = AppContainer.getInstance();
    await container.init(false, false);
    server = new ExpressServer(container);
  });

  test('GET /health returns 200 OK with UP status', async () => {
    const response = await request(server.getExpressInstance()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });

  test('GET /api/greetings returns list of greeting templates', async () => {
    const response = await request(server.getExpressInstance()).get('/api/greetings');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/simulator/multi-chat returns quad-chat response contract', async () => {
    const payload = {
      tenantId: 'tenant-demo-01',
      text: 'Hola, cotizar flete Bogotá a Medellín',
      userPhone: '3001234567'
    };
    const response = await request(server.getExpressInstance())
      .post('/api/simulator/multi-chat')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('chat1Js');
    expect(response.body.data.chat1Js.chatType).toBe('FULL_JS');
  });

  test('GET /api/admin/settings/time-periods returns time periods contract', async () => {
    const response = await request(server.getExpressInstance()).get('/api/admin/settings/time-periods');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
