import { describe, expect, it } from 'vitest';
import { toppingUsage } from './topping-usage.js';

describe('toppingUsage', () => {
  it('uses one portion of each topping per cup', () => {
    const usage = toppingUsage([{ qty: 3, toppingIds: ['pearl', 'cheese'] }]);
    expect(Object.fromEntries(usage)).toEqual({ pearl: 3, cheese: 3 });
  });

  it('adds up the same topping across lines', () => {
    const usage = toppingUsage([
      { qty: 2, toppingIds: ['pearl'] },
      { qty: 1, toppingIds: ['pearl', 'jelly'] },
    ]);
    expect(Object.fromEntries(usage)).toEqual({ pearl: 3, jelly: 1 });
  });

  it('counts a topping listed twice on one line once', () => {
    const usage = toppingUsage([{ qty: 2, toppingIds: ['pearl', 'pearl'] }]);
    expect(usage.get('pearl')).toBe(2);
  });

  it('returns nothing for an order without toppings', () => {
    expect(toppingUsage([{ qty: 4, toppingIds: [] }]).size).toBe(0);
    expect(toppingUsage([]).size).toBe(0);
  });
});
