import { describe, expect, it } from 'vitest';
import { calculateUnitPrice } from './pricing.js';

describe('calculateUnitPrice', () => {
  it.each([
    ['S', 35000],
    ['M', 40000],
    ['L', 45000],
  ] as const)('adds the size %s surcharge to the S price', (size, expected) => {
    expect(calculateUnitPrice(35000, size)).toBe(expected);
  });

  it('adds every topping price', () => {
    expect(calculateUnitPrice(35000, 'L', [5000, 8000])).toBe(58000);
  });
});
