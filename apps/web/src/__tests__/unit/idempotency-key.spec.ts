import { describe, expect, it } from 'vitest';
import { buildIdempotencyKey } from '@/features/checkout/idempotency-key';

describe('buildIdempotencyKey', () => {
  it('lần thanh toán đầu giữ dạng key cũ', () => {
    expect(buildIdempotencyKey('1042', 'WALLET')).toBe('idem_1042_WALLET');
    expect(buildIdempotencyKey('1042', 'CARD', 0)).toBe('idem_1042_CARD');
  });

  it('mỗi lần thử lại sau thất bại có key khác nhau', () => {
    expect(buildIdempotencyKey('1042', 'WALLET', 1)).toBe('idem_1042_WALLET_retry1');
    expect(buildIdempotencyKey('1042', 'WALLET', 2)).toBe('idem_1042_WALLET_retry2');
  });
});
