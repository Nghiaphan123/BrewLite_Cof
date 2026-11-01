import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { LoggingInterceptor } from './logging.interceptor.js';
import { requestIdMiddleware } from './request-id.middleware.js';

@Controller('health')
class HealthProbeController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}

describe('request id logging', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app?.close();
  });

  it('echoes a safe request id and does not require a database', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthProbeController],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(requestIdMiddleware);
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.setGlobalPrefix('api/v1');
    await app.init();

    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .set('X-Request-Id', '11111111-2222-4333-8444-555555555555');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('11111111-2222-4333-8444-555555555555');
  });
});
