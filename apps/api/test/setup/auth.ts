import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * loginAs — authenticates via the real POST /api/v1/auth/login endpoint.
 *
 * Why it exists:
 * - Replaces the fake token with a real JWT from the auth service.
 * - The specs call seedUser before loginAs, so the user exists.
 * - If login fails (e.g., user not registered), register first, then log in.
 *
 * Returns: accessToken string (for Authorization: Bearer <token>)
 */
export async function loginAs(
  app: INestApplication,
  email: string,
  password = 'correct-horse-battery-1',
): Promise<string> {
  // Try login first
  let res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password });

  if (res.status === 401 && res.body.code === 'AUTH_INVALID') {
    // User might not be registered; try register then login
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email, password });

    res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });
  }

  if (res.status !== 200 || !res.body.accessToken) {
    throw new Error(`loginAs failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  return res.body.accessToken;
}