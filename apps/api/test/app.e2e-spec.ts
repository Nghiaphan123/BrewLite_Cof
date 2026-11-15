/**
 * App boot smoke test.
 *
 * Not a graded test (PDF §9). Proves the Nest app boots with all modules
 * imported (OrdersModule, PaymentsModule) and the root route is reachable.
 * If this fails, the other e2e suites will fail too — fix it first.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('GET /api/v1/health returns the liveness contract', async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const prefixed = moduleFixture.createNestApplication();
    prefixed.setGlobalPrefix('api/v1');
    await prefixed.init();

    await request(prefixed.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect({ status: 'ok', version: 'v1' });

    await prefixed.close();
  });

  afterEach(async () => {
    await app.close();
  });
});
