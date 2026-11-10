/**
 * Order pricing rule — the backend mirror of the web pricing (ui-decisions.md §4.2).
 *
 * Contract:
 * - Product.price is the size S price, whole VND.
 * - unit price = product price + size surcharge + topping prices.
 * - The surcharge table must match apps/web/src/features/product/pricing.ts,
 *   or the customer sees one price in the cart and is charged another.
 */
export const SIZE_SURCHARGE = { S: 0, M: 5000, L: 10000 } as const;

export function calculateUnitPrice(
  productPrice: number,
  size: keyof typeof SIZE_SURCHARGE,
  toppingPrices: number[] = [],
): number {
  const toppingTotal = toppingPrices.reduce((sum, price) => sum + price, 0);
  return productPrice + SIZE_SURCHARGE[size] + toppingTotal;
}
