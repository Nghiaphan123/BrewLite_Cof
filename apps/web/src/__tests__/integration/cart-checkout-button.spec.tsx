import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import CartPage from '@/app/cart/page';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/cart',
}));

describe('US-05: nút "Thanh toán" ở giỏ hàng hiển thị tổng tiền', () => {
  beforeEach(() => {
    pushMock.mockReset();
    useCartStore.getState().clearCart();
    useAuthStore.getState().setAuth('fake-jwt-token', { id: 'u1', email: 'test@brewlite.vn' });
  });

  it('giỏ có món: nút ghi "Thanh toán" kèm tổng tiền', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 2);

    render(<CartPage />);

    expect(screen.getByTestId('proceed-checkout-btn')).toHaveTextContent('Thanh toán · 90.000₫');
  });

  it('có mã giảm giá: nút hiện tổng sau khi giảm, khớp dòng "Tổng cộng"', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 2);
    useCartStore.getState().setPromotion({ code: 'WELCOME20K', type: 'FIXED', value: 20000, minOrderTotal: 50000 });

    render(<CartPage />);

    expect(screen.getByTestId('cart-total')).toHaveTextContent('70.000₫');
    expect(screen.getByTestId('proceed-checkout-btn')).toHaveTextContent('Thanh toán · 70.000₫');
  });

  it('bấm nút thì sang trang thanh toán', () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);

    render(<CartPage />);
    fireEvent.click(screen.getByTestId('proceed-checkout-btn'));

    expect(pushMock).toHaveBeenCalledWith('/checkout');
  });

  it('giỏ trống: không có nút thanh toán', () => {
    render(<CartPage />);

    expect(screen.queryByTestId('proceed-checkout-btn')).not.toBeInTheDocument();
  });
});
