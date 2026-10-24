/**
 * Unit tests for computeDiscount.
 *
 * Covers:
 * - Percent discount (10% of 100000 = 10000)
 * - Fixed discount (10000 of 100000 = 10000)
 * - Cap at subtotal (50% of 1000 = 500; 100% of 1000 = 1000; 200% of 1000 = 1000)
 * - Min order not met
 * - Expired (before validFrom, after validUntil)
 * - Inactive
 * - Exhausted (usedCount == maxUses)
 * - Happy path
 * - minOrderTotal = 0 always passes
 */

import { describe, it, expect } from 'vitest';
import { computeDiscount, PromotionRule } from './promotion.js';

const basePromo: PromotionRule = {
  type: 'PERCENT',
  value: 10,
  minOrderTotal: 0,
  maxUses: null,
  usedCount: 0,
  validFrom: new Date('2020-01-01'),
  validUntil: new Date('2030-12-31'),
  isActive: true,
};

describe('computeDiscount', () => {
  describe('percent discount', () => {
    it('10% of 100000 = 10000', () => {
      const result = computeDiscount({ ...basePromo, type: 'PERCENT', value: 10 }, 100000);
      expect(result).toEqual({ ok: true, discountAmount: 10000 });
    });

    it('50% of 1000 = 500 (no cap)', () => {
      const result = computeDiscount({ ...basePromo, type: 'PERCENT', value: 50 }, 1000);
      expect(result).toEqual({ ok: true, discountAmount: 500 });
    });

    it('100% of 1000 = 1000 (cap at subtotal)', () => {
      const result = computeDiscount({ ...basePromo, type: 'PERCENT', value: 100 }, 1000);
      expect(result).toEqual({ ok: true, discountAmount: 1000 });
    });

    it('200% of 1000 = 1000 (capped at subtotal)', () => {
      const result = computeDiscount({ ...basePromo, type: 'PERCENT', value: 200 }, 1000);
      expect(result).toEqual({ ok: true, discountAmount: 1000 });
    });
  });

  describe('fixed discount', () => {
    it('10000 fixed of 100000 = 10000', () => {
      const result = computeDiscount({ ...basePromo, type: 'FIXED', value: 10000 }, 100000);
      expect(result).toEqual({ ok: true, discountAmount: 10000 });
    });

    it('fixed 5000 of 10000 = 5000', () => {
      const result = computeDiscount({ ...basePromo, type: 'FIXED', value: 5000 }, 10000);
      expect(result).toEqual({ ok: true, discountAmount: 5000 });
    });

    it('fixed 20000 of 10000 = 10000 (capped at subtotal)', () => {
      const result = computeDiscount({ ...basePromo, type: 'FIXED', value: 20000 }, 10000);
      expect(result).toEqual({ ok: true, discountAmount: 10000 });
    });
  });

  describe('minOrderTotal', () => {
    it('subtotal below minOrderTotal -> PROMO_MIN_ORDER_NOT_MET', () => {
      const result = computeDiscount({ ...basePromo, minOrderTotal: 50000 }, 10000);
      expect(result).toEqual({
        ok: false,
        code: 'PROMO_MIN_ORDER_NOT_MET',
        message: 'Order subtotal must be at least 50000 VND',
      });
    });

    it('minOrderTotal = 0 -> passes', () => {
      const result = computeDiscount({ ...basePromo, minOrderTotal: 0 }, 100);
      expect(result.ok).toBe(true);
    });

    it('subtotal equal to minOrderTotal -> passes', () => {
      const result = computeDiscount({ ...basePromo, minOrderTotal: 10000 }, 10000);
      expect(result.ok).toBe(true);
    });
  });

  describe('expiry', () => {
    it('before validFrom -> PROMO_EXPIRED', () => {
      const result = computeDiscount(
        { ...basePromo, validFrom: new Date('2025-01-01'), validUntil: new Date('2025-12-31') },
        10000,
        new Date('2024-12-31')
      );
      expect(result).toEqual({
        ok: false,
        code: 'PROMO_EXPIRED',
        message: 'Promotion is not valid at this time',
      });
    });

    it('after validUntil -> PROMO_EXPIRED', () => {
      const result = computeDiscount(
        { ...basePromo, validFrom: new Date('2024-01-01'), validUntil: new Date('2024-12-31') },
        10000,
        new Date('2025-01-01')
      );
      expect(result).toEqual({
        ok: false,
        code: 'PROMO_EXPIRED',
        message: 'Promotion is not valid at this time',
      });
    });

    it('on validFrom boundary -> passes', () => {
      const result = computeDiscount(
        { ...basePromo, validFrom: new Date('2024-01-01'), validUntil: new Date('2024-12-31') },
        10000,
        new Date('2024-01-01')
      );
      expect(result.ok).toBe(true);
    });

    it('on validUntil boundary -> passes', () => {
      const result = computeDiscount(
        { ...basePromo, validFrom: new Date('2024-01-01'), validUntil: new Date('2024-12-31') },
        10000,
        new Date('2024-12-31')
      );
      expect(result.ok).toBe(true);
    });
  });

  describe('inactive', () => {
    it('isActive: false -> PROMO_INACTIVE', () => {
      const result = computeDiscount({ ...basePromo, isActive: false }, 10000);
      expect(result).toEqual({
        ok: false,
        code: 'PROMO_INACTIVE',
        message: 'Promotion is inactive',
      });
    });
  });

  describe('exhausted', () => {
    it('usedCount == maxUses -> PROMO_EXHAUSTED', () => {
      const result = computeDiscount({ ...basePromo, maxUses: 5, usedCount: 5 }, 10000);
      expect(result).toEqual({
        ok: false,
        code: 'PROMO_EXHAUSTED',
        message: 'Promotion usage limit reached',
      });
    });

    it('usedCount < maxUses -> passes', () => {
      const result = computeDiscount({ ...basePromo, maxUses: 5, usedCount: 3 }, 10000);
      expect(result.ok).toBe(true);
    });

    it('maxUses: null -> passes (unlimited)', () => {
      const result = computeDiscount({ ...basePromo, maxUses: null, usedCount: 100 }, 10000);
      expect(result.ok).toBe(true);
    });
  });

  describe('happy path', () => {
    it('valid percent promo -> returns discount', () => {
      const result = computeDiscount({ ...basePromo, type: 'PERCENT', value: 15 }, 20000);
      expect(result).toEqual({ ok: true, discountAmount: 3000 });
    });

    it('valid fixed promo -> returns discount', () => {
      const result = computeDiscount({ ...basePromo, type: 'FIXED', value: 5000 }, 20000);
      expect(result).toEqual({ ok: true, discountAmount: 5000 });
    });
  });
});