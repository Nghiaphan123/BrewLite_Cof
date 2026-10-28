import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { createE2EApp } from './setup/e2e-app.js';
import { seedUser } from './setup/fixtures.js';
import { PrismaService } from '../src/common/prisma.service.js';
import { randomUUID } from 'node:crypto';

/**
 * Task 7 auth e2e tests.
 *
 * Verifies the auth contract (api-contract.md §6–§7) and that protected
 * routes enforce JWT (ADR 0005 C4).
 */
describe('Auth (Task 7)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const testEmail = `auth-e2e-${randomUUID()}@example.com`;
  const testName = 'Auth E2E Customer';
  const testPassword = 'correct-horse-battery-1';

  it('register with a new email -> 201, body.user.email matches', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: testName, email: testEmail, password: testPassword });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.user.name).toBe(testName);
    expect(res.body.user.loyaltyPoints).toBe(0);
    expect(res.body.user.id).toBeDefined();

    userId = res.body.user.id;
  });

  it('register the same email again -> 409, body.code = EMAIL_TAKEN', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ name: testName, email: testEmail, password: testPassword });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('login with correct password -> 200, accessToken is a non-empty string', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.accessToken.length).toBeGreaterThan(0);
    expect(res.body.expiresIn).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail.toLowerCase());
    expect(res.body.user.name).toBe(testName);

    token = res.body.accessToken;
  });

  it('GET /auth/me returns only the authenticated user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: userId,
      name: testName,
      email: testEmail.toLowerCase(),
      loyaltyPoints: 0,
    });
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('PATCH /auth/password verifies current password and updates the hash', async () => {
    const nextPassword = 'new-correct-password-2';
    const res = await request(app.getHttpServer())
      .patch('/api/v1/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: testPassword, newPassword: nextPassword });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password changed successfully');

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: nextPassword });
    expect(login.status).toBe(200);
  });

  it('login with wrong password -> 401, body.code = AUTH_INVALID', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: 'wrong-password-1' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_INVALID');
  });

  it('login with an unknown email -> 401, identical body to wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'unknown@example.com', password: testPassword });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_INVALID');
    // Message should be identical (no account enumeration)
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('POST /api/v1/payments without Authorization -> 401, body.code = AUTH_REQUIRED', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);

    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Idempotency-Key', randomUUID())
      .send({ orderId: order.id, method: 'WALLET' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('POST /api/v1/payments with a malformed token -> 401', async () => {
    const product = await seedProduct(prisma, { stock: 10 });
    const order = await seedOrder(prisma, userId, product.id);

    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', 'Bearer not.a.valid.token')
      .set('Idempotency-Key', randomUUID())
      .send({ orderId: order.id, method: 'WALLET' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_INVALID');
  });

  it('POST /api/v1/payments with valid token for user A but order owned by user B -> 404', async () => {
    // Create a second user
    const userB = await seedUser(prisma, `userb-${randomUUID()}@example.com`);

    // Create an order for user B
    const product = await seedProduct(prisma, { stock: 10 });
    const orderB = await seedOrder(prisma, userB.id, product.id);

    // User A tries to pay for user B's order
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', randomUUID())
      .send({ orderId: orderB.id, method: 'WALLET' });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('ORDER_NOT_FOUND');
  });
});

// Re-use seedProduct and seedOrder from fixtures
import { seedProduct, seedOrder } from './setup/fixtures.js';