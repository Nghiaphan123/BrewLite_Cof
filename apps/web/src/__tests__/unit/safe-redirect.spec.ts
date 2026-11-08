import { describe, expect, it } from 'vitest';
import { getSafeRedirect } from '@/lib/safe-redirect';

describe('getSafeRedirect', () => {
  it('giữ nguyên đường dẫn nội bộ', () => {
    expect(getSafeRedirect('/checkout')).toBe('/checkout');
    expect(getSafeRedirect('/orders/1042?status=PAID')).toBe('/orders/1042?status=PAID');
  });

  it('dùng trang mặc định khi không có redirect', () => {
    expect(getSafeRedirect(null)).toBe('/');
    expect(getSafeRedirect('')).toBe('/');
    expect(getSafeRedirect(undefined, '/menu')).toBe('/menu');
  });

  it('chặn chuyển hướng sang domain khác', () => {
    expect(getSafeRedirect('https://evil.example')).toBe('/');
    expect(getSafeRedirect('//evil.example')).toBe('/');
    expect(getSafeRedirect('/\\evil.example')).toBe('/');
    expect(getSafeRedirect('javascript:alert(1)')).toBe('/');
    expect(getSafeRedirect('/\t/evil.example')).toBe('/');
  });
});
