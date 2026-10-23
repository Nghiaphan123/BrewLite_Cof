import { INestApplication } from '@nestjs/common';

/**
 * In Phase 1 without the full Auth JWT guard wired into every endpoint,
 * loginAs generates or returns a test token/identifier that maps to the user.
 */
export async function loginAs(
  app: INestApplication,
  email: string,
  password = 'correct-horse-battery',
): Promise<string> {
  // Returns simulated Bearer token containing user identifier
  return `test-token-for-${email}`;
}
