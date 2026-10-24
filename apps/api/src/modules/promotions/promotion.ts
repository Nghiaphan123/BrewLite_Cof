/**
 * Promotion rule engine — pure function for computing discounts.
 *
 * Why it exists:
 * - Pure functions are testable, auditable, and reusable by both the
 *   validate endpoint (preview) and the applyToOrder service (mutation).
 * - The logic is the contract; the service just calls it.
 *
 * Contract (matches Promotion model fields):
 * - type: 'PERCENT' | 'FIXED'
 * - value: number (percent: 1..100, fixed: VND amount)
 * - minOrderTotal: number (0 = no minimum)
 * - maxUses: number | null (null = unlimited)
 * - usedCount: number
 * - validFrom: Date
 * - validUntil: Date
 * - isActive: boolean
 *
 * Returns DiscountResult:
 * - ok: true -> { discountAmount: number }
 * - ok: false -> { code, message } for the specific failure reason
 */

export type PromotionRule = {
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderTotal: number;
  maxUses: number | null;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
};

export type DiscountResult =
  | { ok: true; discountAmount: number }
  | { ok: false; code: 'PROMO_INACTIVE' | 'PROMO_EXPIRED' | 'PROMO_MIN_ORDER_NOT_MET' | 'PROMO_EXHAUSTED'; message: string };

/**
 * Computes the discount for a given promotion rule and subtotal.
 * Does not mutate anything — use applyToOrder in the service for that.
 */
export function computeDiscount(promo: PromotionRule, subtotal: number, now = new Date()): DiscountResult {
  // Inactive
  if (!promo.isActive) {
    return { ok: false, code: 'PROMO_INACTIVE', message: 'Promotion is inactive' };
  }

  // Expired (before validFrom or after validUntil)
  if (now < promo.validFrom || now > promo.validUntil) {
    return { ok: false, code: 'PROMO_EXPIRED', message: 'Promotion is not valid at this time' };
  }

  // Minimum order not met
  if (promo.minOrderTotal > 0 && subtotal < promo.minOrderTotal) {
    return {
      ok: false,
      code: 'PROMO_MIN_ORDER_NOT_MET',
      message: `Order subtotal must be at least ${promo.minOrderTotal} VND`,
    };
  }

  // Exhausted
  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { ok: false, code: 'PROMO_EXHAUSTED', message: 'Promotion usage limit reached' };
  }

  // Compute discount
  let discountAmount =
    promo.type === 'PERCENT'
      ? Math.floor((subtotal * promo.value) / 100)
      : promo.value;

  // Cap at subtotal (discount cannot exceed subtotal)
  if (discountAmount > subtotal) {
    discountAmount = subtotal;
  }

  return { ok: true, discountAmount };
}