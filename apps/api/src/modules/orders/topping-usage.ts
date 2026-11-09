/**
 * toppingUsage — how many portions of each topping an order consumes.
 *
 * Why it exists:
 * - Toppings have their own stock (`toppings.stock`, edited by the admin).
 *   A paid order must take those portions out of stock, and cancelling a paid
 *   order must give them back. Both the payment and the cancellation need the
 *   same count, so the rule lives here once.
 *
 * Rule:
 * - One portion of a topping per cup: a line of qty 3 with "Trân châu đen"
 *   uses 3 portions of it.
 * - The same topping on several lines is added up, so the stock check covers
 *   the whole order, not each line on its own.
 * - A topping listed twice on one line counts once (an order item stores each
 *   topping once: order_item_toppings has the key (order_item_id, topping_id)).
 *
 * Pure function: no I/O, unit-tested in topping-usage.spec.ts.
 */
export interface ToppingUsageLine {
  qty: number;
  toppingIds: readonly string[];
}

/** Portions needed per topping id, in the order the toppings first appear. */
export function toppingUsage(lines: readonly ToppingUsageLine[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const line of lines) {
    for (const toppingId of new Set(line.toppingIds)) {
      usage.set(toppingId, (usage.get(toppingId) ?? 0) + line.qty);
    }
  }
  return usage;
}
