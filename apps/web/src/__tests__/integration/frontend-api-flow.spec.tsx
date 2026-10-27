// apps/web/src/__tests__/integration/frontend-api-flow.spec.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MenuPage from '@/app/page';
import OrderHistoryPage from '@/app/orders/page';
import CheckoutPage from '@/app/checkout/page';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: 'prod-1' }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('Integration Test: Frontend <-> Backend API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    useCartStore.getState().clearCart();
    useAuthStore.getState().setAuth('fake-jwt-token', {
      id: 'u1',
      email: 'test@brewlite.vn',
      loyaltyPoints: 10,
    });
  });

  it('Trang Menu gọi GET /products hiển thị loading rồi render danh sách sản phẩm', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: '1', name: 'Cà phê sữa', price: 35000, imageUrl: 'http://localhost:3000/images/products/2.jpg' },
          { id: '2', name: 'Cappuccino', price: 45000, imageUrl: 'http://localhost:3000/images/products/9.jpg' },
        ],
        total: 2,
      }),
    } as Response);

    render(<MenuPage />);
    expect(screen.getByTestId('menu-loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('menu-grid')).toBeInTheDocument();
    });

    expect(screen.getByText('Cà phê sữa')).toBeInTheDocument();
    expect(screen.getByText('Cappuccino')).toBeInTheDocument();
  });

  it('Trang lịch sử đơn hàng lấy items từ response { items, total }', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          {
            id: 'order-1',
            status: 'PAID',
            total: 35000,
            createdAt: '2026-10-26T00:00:00.000Z',
          },
        ],
        total: 1,
      }),
    } as Response);

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('history-order-order-1')).toBeInTheDocument();
    });
    expect(screen.getByText('PAID')).toBeInTheDocument();
  });

  it('Trang Menu hiển thị thông báo lỗi khi API /products thất bại', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Lỗi máy chủ nội bộ' }),
    } as Response);

    render(<MenuPage />);

    await waitFor(() => {
      expect(screen.getByTestId('menu-error')).toBeInTheDocument();
    });
    expect(screen.getByText('Lỗi máy chủ nội bộ')).toBeInTheDocument();
  });

  it('Luồng Thanh toán: giữ nguyên giỏ hàng nếu POST /payments trả về PAYMENT_FAILED', async () => {
    useCartStore.getState().addItem(
      { id: 'p1', name: 'Trà đào', price: 39000, imageUrl: '/images/products/15.jpg' },
      'L',
      [],
      2
    );

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      // Lần 1: POST /orders -> PENDING
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1042', status: 'PENDING', total: 98000 }),
      } as Response)
      // Lần 2: POST /payments -> PAYMENT_FAILED
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orderId: '1042', status: 'PAYMENT_FAILED' }),
      } as Response);

    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('checkout-error')).toBeInTheDocument();
    });

    // Giỏ hàng vẫn còn nguyên 2 sản phẩm
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('Luồng Thanh toán: gửi JWT + Idempotency-Key, cộng điểm thưởng và chuyển sang trang xác nhận khi PAID', async () => {
    useCartStore.getState().addItem(
      { id: 'p1', name: 'Cappuccino', price: 45000, imageUrl: '/images/products/9.jpg' },
      'M',
      [],
      1
    );

    const fetchSpy = vi
      .spyOn(global, 'fetch')
      // Lần 1: POST /orders
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1042', status: 'PENDING', total: 50000 }),
      } as Response)
      // Lần 2: POST /payments
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orderId: '1042',
          status: 'PAID',
          loyaltyPointsEarned: 5,
        }),
      } as Response);

    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/orders/1042?status=PAID');
    });

    // Kiểm tra header Authorization Bearer JWT và Idempotency-Key đã được gửi
    const orderCallHeaders = (fetchSpy.mock.calls[0][1]?.headers || {}) as Record<string, string>;
    expect(orderCallHeaders['Authorization']).toBe('Bearer fake-jwt-token');

    const paymentCallHeaders = (fetchSpy.mock.calls[1][1]?.headers || {}) as Record<string, string>;
    expect(paymentCallHeaders['Idempotency-Key']).toBe('idem_1042_WALLET');

    // Giỏ hàng được làm trống và điểm thưởng được cộng thêm 5 (10 + 5 = 15)
    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(useAuthStore.getState().user?.loyaltyPoints).toBe(15);
  });
});