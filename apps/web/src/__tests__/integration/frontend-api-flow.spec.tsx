// apps/web/src/__tests__/integration/frontend-api-flow.spec.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MenuPage } from '@/features/menu/menu-page';
import OrderHistoryPage from '@/app/orders/page';
import CheckoutPage from '@/app/checkout/page';
import LoginPage from '@/app/login/page';
import { AccountMenu } from '@/components/AccountMenu';
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
    sessionStorage.removeItem('brewlite-pending-qr');
    useCartStore.getState().clearCart();
    useAuthStore.getState().setAuth('fake-jwt-token', {
      id: 'u1',
      name: 'Test User',
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

  it('lọc menu theo tab và thêm nhanh món vào giỏ hàng', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [
          { id: 'coffee-1', name: 'Cà phê sữa', price: 29000, imageUrl: '' },
          { id: 'tea-1', name: 'Trà đào cam sả', price: 39000, imageUrl: '' },
          { id: 'blend-1', name: 'Matcha đá xay', price: 52000, imageUrl: '' },
        ],
        total: 3,
      }),
    } as Response);

    render(<MenuPage />);
    await waitFor(() => {
      expect(screen.getByTestId('menu-grid')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('tab', { name: /Trà/ }));
    expect(screen.getByText('Trà đào cam sả')).toBeInTheDocument();
    expect(screen.queryByText('Cà phê sữa')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Tất cả/ }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Thêm nhanh Cà phê sữa vào giỏ' }),
    );
    expect(useCartStore.getState().getTotalItems()).toBe(1);
    expect(screen.getByRole('link', { name: /Giỏ hàng, hiện có 1 sản phẩm/ })).toBeInTheDocument();
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
      expect(screen.getByTestId('qr-payment-panel')).toBeInTheDocument();
    });
    expect(screen.getByTestId('payment-qr')).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('checkout-error')).toBeInTheDocument();
    });

    // Giỏ hàng vẫn còn nguyên 2 sản phẩm
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('xóa phiên không hợp lệ và hướng dẫn đăng nhập lại khi tạo QR bị từ chối', async () => {
    useCartStore.getState().addItem(
      { id: 'p1', name: 'Cà phê sữa', price: 29000, imageUrl: '' },
      'S',
      [],
    );
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid token' }),
    } as Response);

    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('checkout-error')).toHaveTextContent(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    });

    expect(screen.getByRole('link', { name: 'Đăng nhập lại để tạo mã QR' })).toHaveAttribute(
      'href',
      '/login?redirect=%2Fcheckout',
    );
    expect(useAuthStore.getState().token).toBeNull();
    expect(useCartStore.getState().getTotalItems()).toBe(1);
  });

  it('đăng nhập sau đăng ký để nhận JWT và tiếp tục thanh toán', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'u2', name: 'New User', email: 'new@brewlite.vn', loyaltyPoints: 0 },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          accessToken: 'valid-jwt-token',
          user: { id: 'u2', name: 'New User', email: 'new@brewlite.vn', loyaltyPoints: 0 },
        }),
      } as Response);

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký ngay' }));
    fireEvent.change(screen.getByTestId('auth-name'), {
      target: { value: 'New User' },
    });
    fireEvent.change(screen.getByTestId('auth-email'), {
      target: { value: 'new@brewlite.vn' },
    });
    fireEvent.change(screen.getByTestId('auth-password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/menu');
    });
    expect(fetchSpy.mock.calls[0][1]?.body).toBe(
      JSON.stringify({
        name: 'New User',
        email: 'new@brewlite.vn',
        password: 'password123',
      }),
    );
    expect(useAuthStore.getState().token).toBe('valid-jwt-token');
    expect(localStorage.getItem('brewlite_token')).toBe('valid-jwt-token');
  });

  it('hiển thị tên và thông tin tài khoản trong menu tài khoản', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'u1',
        name: 'Test User',
        email: 'test@brewlite.vn',
        loyaltyPoints: 25,
        createdAt: '2026-01-15T00:00:00.000Z',
      }),
    } as Response);

    render(<AccountMenu />);
    expect(screen.getByTestId('account-display-name')).toHaveTextContent('Test User');
    fireEvent.click(screen.getByTestId('account-menu-button'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xem thông tin' }));

    expect(await screen.findByTestId('profile-name')).toHaveTextContent('Test User');
    expect(screen.getByText('test@brewlite.vn')).toBeInTheDocument();
    expect(screen.getByText('25 điểm')).toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({ cache: 'no-store' }),
    );
  });

  it('đổi mật khẩu từ menu tài khoản sau khi xác nhận mật khẩu mới', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Password changed successfully' }),
    } as Response);

    render(<AccountMenu />);
    fireEvent.click(screen.getByTestId('account-menu-button'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đổi mật khẩu' }));
    fireEvent.change(screen.getByTestId('current-password'), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByTestId('new-password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.change(screen.getByTestId('confirm-password'), {
      target: { value: 'newpassword123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));

    expect(await screen.findByTestId('password-success')).toHaveTextContent(
      'Đổi mật khẩu thành công.',
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/password'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
        }),
      }),
    );
  });

  it('có nút quay lại giỏ hàng ở trang thanh toán', () => {
    render(<CheckoutPage />);
    expect(screen.getByRole('link', { name: /Quay lại giỏ hàng/ })).toHaveAttribute('href', '/cart');
  });

  it('khôi phục mã QR thanh toán đang chờ sau khi tải lại trang', async () => {
    sessionStorage.setItem(
      'brewlite-pending-qr',
      JSON.stringify({
        orderId: '1042',
        amount: 50000,
        image: 'data:image/svg+xml;charset=utf-8,qr',
      }),
    );

    render(<CheckoutPage />);

    await waitFor(() => {
      expect(screen.getByTestId('qr-payment-panel')).toBeInTheDocument();
    });
    expect(screen.getByText('Đơn 1042 · 50.000₫')).toBeInTheDocument();
    expect(screen.getByTestId('payment-qr')).toHaveAttribute('src', 'data:image/svg+xml;charset=utf-8,qr');
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
      expect(screen.getByTestId('qr-payment-panel')).toBeInTheDocument();
    });
    expect(screen.getByText(/chưa kết nối ngân hàng hoặc cổng thanh toán thật/)).toBeInTheDocument();
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