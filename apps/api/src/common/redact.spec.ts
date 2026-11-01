import { describe, expect, it } from 'vitest';
import { isSafeRequestId, redact } from './redact.js';

describe('redact', () => {
  it('removes bearer tokens and database URLs', () => {
    const raw = 'Authorization: Bearer abc.def.ghi failed postgres://brewlite:secret@db:5432/brewlite';
    const cleaned = redact(raw);

    expect(cleaned).not.toContain('abc.def.ghi');
    expect(cleaned).not.toContain('secret@db');
    expect(cleaned).toContain('[redacted]');
  });

  it('removes password and jwt assignments', () => {
    const cleaned = redact('password=Brewlite1 JWT_SECRET=super-secret-value');

    expect(cleaned).not.toContain('Brewlite1');
    expect(cleaned).not.toContain('super-secret-value');
  });

  it('accepts only simple request ids', () => {
    expect(isSafeRequestId('11111111-2222-4333-8444-555555555555')).toBe(true);
    expect(isSafeRequestId('Bearer secret')).toBe(false);
    expect(isSafeRequestId('short')).toBe(false);
  });
});
