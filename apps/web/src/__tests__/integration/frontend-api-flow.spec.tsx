// apps/web/src/__tests__/integration/frontend-api-flow.spec.tsx
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MenuPage } from '@/features/menu/menu-page';
import OrderHistoryPage from '@/app/orders/page';
import ProfilePage from '@/app/profile/page';
import CartPage from '@/app/cart/page';
import CheckoutPage from '@/app/checkout/page';
import LoginPage from '@/app/login/page';
import AccountPage from '@/app/account/page';
import { AccountMenu } from '@/components/AccountMenu';
import { AppFeedback } from '@/components/AppFeedback';
import { CartStoreHydration } from '@/components/CartStoreHydration';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';

const pushMock = vi.fn();
let mockPathname = '/login';
let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  useParams: () => ({ id: 'prod-1' }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

describe('Integration Test: Frontend <-> Backend API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    pushMock.mockReset();
    mockPathname = '/login';
    useUiStore.getState().releaseLoading();
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
            items: [
              {
                productId: 'product-1',
                productName: 'Cà phê sữa',
                size: 'M',
                qty: 2,
                lineTotal: 35000,
              },
            ],
          },
        ],
        total: 1,
      }),
    } as Response);

    render(<OrderHistoryPage />);

    await waitFor(() => {
      expect(screen.getByTestId('history-order-order-1')).toBeInTheDocument();
    });
    expect(screen.getByText('Đã thanh toán')).toBeInTheDocument();
    expect(screen.getByText('Cà phê sữa')).toBeInTheDocument();
    expect(screen.getByText('Size: M • SL: 2')).toBeInTheDocument();
    expect(screen.getAllByText('35.000₫')).toHaveLength(2);
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
    await waitFor(() => {
      expect(screen.getByTestId('confirm-payment-btn')).toBeEnabled();
    });
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

  it('gửi toppingIds khi tạo đơn và chỉ gửi mã giảm giá khi đang được giảm', async () => {
    const topping = { id: '20000000-0000-4000-8000-000000000001', name: 'Trân châu đen', price: 5000 };
    useCartStore.getState().addItem(
      { id: 'p1', name: 'Latte', price: 45000, imageUrl: '' },
      'L',
      [topping],
      2,
    );
    useCartStore.getState().setPromotion({ code: 'WELCOME20K', type: 'FIXED' as const, value: 20000, minOrderTotal: 50000 });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1042', status: 'PENDING', total: 100000 }),
    } as Response);

    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));
    await screen.findByTestId('qr-payment-panel');

    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({
      items: [{ productId: 'p1', size: 'L', qty: 2, toppingIds: [topping.id] }],
      promoCode: 'WELCOME20K',
    });
  });

  it('không gửi mã giảm giá đã hết điều kiện, để đơn không bị API từ chối', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 25000, imageUrl: '' }, 'S', [], 1);
    useCartStore.getState().setPromotion({ code: 'WELCOME20K', type: 'FIXED' as const, value: 20000, minOrderTotal: 50000 });
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1042', status: 'PENDING', total: 25000 }),
    } as Response);

    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));
    await screen.findByTestId('qr-payment-panel');

    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body)).promoCode).toBeUndefined();
  });

  it('mã giảm giá không hợp lệ: báo lỗi tiếng Việt và không áp dụng', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Promotion X not found', code: 'PROMO_NOT_FOUND' }),
    } as Response);

    render(<CartPage />);
    fireEvent.change(screen.getByTestId('promo-input'), { target: { value: 'sai' } });
    fireEvent.click(screen.getByTestId('apply-promo-btn'));

    expect(await screen.findByTestId('promo-error')).toHaveTextContent('Mã khuyến mãi không tồn tại.');
    expect(useCartStore.getState().promoCode).toBe('');
  });

  it('mã giảm giá hợp lệ: chuẩn hóa chữ hoa và trừ vào tổng tiền', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 100000, imageUrl: '' }, 'S', [], 1);
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ code: 'BREW10', type: 'PERCENT', value: 10, minOrderTotal: 0, discountAmount: 10000 }),
    } as Response);

    render(<CartPage />);
    fireEvent.change(screen.getByTestId('promo-input'), { target: { value: ' brew10 ' } });
    fireEvent.click(screen.getByTestId('apply-promo-btn'));

    await waitFor(() => expect(useCartStore.getState().promoCode).toBe('BREW10'));
    expect(JSON.parse(String(fetchSpy.mock.calls[0][1]?.body))).toEqual({ code: 'BREW10', subtotal: 100000 });
    expect(screen.getByTestId('cart-total')).toHaveTextContent('90.000');
  });

  it('khôi phục giỏ hàng từ localStorage sau khi tải lại trang', async () => {
    useCartStore.getState().addItem(
      { id: 'p1', name: 'Cappuccino', price: 45000, imageUrl: '' },
      'M',
      [],
      2,
    );
    const savedCart = localStorage.getItem('brewlite-cart');
    useCartStore.setState({ items: [], promoCode: '', promotion: null });
    localStorage.setItem('brewlite-cart', savedCart!);

    render(<CartStoreHydration />);

    await waitFor(() => {
      expect(useCartStore.getState().getTotalItems()).toBe(2);
    });
  });

  it('layout gốc gắn CartStoreHydration để giỏ hàng được nạp lại', () => {
    const layoutSource = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    expect(layoutSource).toContain('<CartStoreHydration />');
  });

  it('giữ màn hình load khi đăng nhập cho tới khi đã chuyển trang', async () => {
    useAuthStore.getState().logout();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'valid-jwt-token',
        user: { id: 'u2', name: 'new', email: 'new@brewlite.vn', loyaltyPoints: 0 },
      }),
    } as Response);

    const view = render(
      <>
        <LoginPage />
        <AppFeedback />
      </>,
    );
    fireEvent.change(screen.getByTestId('auth-email'), { target: { value: 'new@brewlite.vn' } });
    fireEvent.change(screen.getByTestId('auth-password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    expect(await screen.findByTestId('app-loading')).toHaveTextContent('Đang đăng nhập...');
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/');
    });
    await waitFor(() => {
      expect(screen.getByTestId('auth-submit-btn')).toBeEnabled();
    });
    expect(screen.getByTestId('app-loading')).toBeInTheDocument();

    mockPathname = '/';
    view.rerender(
      <>
        <LoginPage />
        <AppFeedback />
      </>,
    );
    await waitFor(() => {
      expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument();
    });
  });

  it('tắt màn hình load và báo lỗi khi đăng nhập thất bại', async () => {
    useAuthStore.getState().logout();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials', code: 'AUTH_INVALID' }),
    } as Response);

    render(
      <>
        <LoginPage />
        <AppFeedback />
      </>,
    );
    fireEvent.change(screen.getByTestId('auth-email'), { target: { value: 'a@brewlite.vn' } });
    fireEvent.change(screen.getByTestId('auth-password'), { target: { value: 'sai123' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    await screen.findByTestId('auth-error');
    expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('báo lỗi đăng nhập bằng tiếng Việt khi API trả AUTH_INVALID', async () => {
    useAuthStore.getState().logout();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials', code: 'AUTH_INVALID' }),
    } as Response);

    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: 'Đăng nhập tài khoản' })).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('auth-email'), { target: { value: 'a@brewlite.vn' } });
    fireEvent.change(screen.getByTestId('auth-password'), { target: { value: 'sai123' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    expect(await screen.findByTestId('auth-error')).toHaveTextContent('Email hoặc mật khẩu không đúng.');
  });

  it('dịch lỗi kiểm tra dữ liệu khi đăng ký', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: [
          'password must contain at least one letter and one digit',
          'password must be longer than or equal to 8 characters',
        ],
      }),
    } as Response);

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký ngay' }));
    fireEvent.change(screen.getByTestId('auth-email'), { target: { value: 'a@brewlite.vn' } });
    fireEvent.change(screen.getByTestId('auth-password'), { target: { value: '12345678' } });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    expect(await screen.findByTestId('auth-error')).toHaveTextContent(
      /^Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số\.$/,
    );
  });

  it('đăng ký thành công thì báo thành công, hiện loading rồi quay lại đăng nhập', async () => {
    useAuthStore.getState().logout();
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          user: { id: 'u2', name: 'new', email: 'new@brewlite.vn', loyaltyPoints: 0 },
        }),
      } as Response);

    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Chưa có tài khoản? Đăng ký ngay' }));
    expect(screen.getByRole('heading', { name: 'Đăng ký tài khoản' })).toBeInTheDocument();
    expect(screen.queryByTestId('auth-name')).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('auth-email'), {
      target: { value: 'new@brewlite.vn' },
    });
    fireEvent.change(screen.getByTestId('auth-password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByTestId('auth-submit-btn'));

    expect(await screen.findByTestId('register-success')).toHaveTextContent(
      'Đăng ký tài khoản thành công',
    );
    expect(screen.getByText('Đang chuyển đến trang đăng nhập...')).toBeInTheDocument();
    expect(screen.queryByTestId('auth-error')).not.toBeInTheDocument();
    expect(fetchSpy.mock.calls[0][1]?.body).toBe(
      JSON.stringify({
        email: 'new@brewlite.vn',
        password: 'password123',
        name: 'new',
      }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Đăng nhập tài khoản' }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('auth-email')).toHaveValue('new@brewlite.vn');
    expect(screen.getByTestId('auth-password')).toHaveValue('');
    expect(pushMock).not.toHaveBeenCalled();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('điều hướng từ menu tài khoản đến trang thông tin tài khoản', () => {
    useAuthStore.getState().setAuth('fake-jwt-token', {
      id: 'u1',
      name: 'Test User',
      email: 'test@brewlite.vn',
      loyaltyPoints: 25,
    });

    render(<AccountMenu />);
    expect(screen.getByTestId('account-display-name')).toHaveTextContent('Test User');
    fireEvent.click(screen.getByTestId('account-menu-button'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xem thông tin' }));
    expect(pushMock).toHaveBeenCalledWith('/account');

    render(<AccountPage />);
    expect(screen.getAllByText('Test User')).toHaveLength(2);
    expect(screen.getByText('test@brewlite.vn')).toBeInTheDocument();
    expect(screen.getByText('25 điểm')).toBeInTheDocument();
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

  it.each([
    ['method-wallet', 'WALLET'],
    ['method-card', 'CARD'],
  ])('đã tạo QR vẫn đổi được sang %s và thanh toán đúng đơn đó', async (testId, paymentMethod) => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);
    const fetchSpy = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1042', status: 'PENDING', total: 45000 }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ orderId: '1042', status: 'PAID' }),
      } as Response);

    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));
    await screen.findByTestId('qr-payment-panel');
    await waitFor(() => expect(screen.getByTestId('confirm-payment-btn')).toBeEnabled());

    expect(screen.getByTestId(testId)).toBeEnabled();
    fireEvent.click(screen.getByTestId(testId));

    expect(screen.queryByTestId('qr-payment-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('method-note')).toHaveTextContent('không tạo thêm đơn mới');
    expect(screen.getByTestId('confirm-payment-btn')).toHaveTextContent('Xác nhận thanh toán');

    fireEvent.click(screen.getByTestId('confirm-payment-btn'));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/orders/1042?status=PAID'));
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchSpy.mock.calls[1][1]?.body))).toMatchObject({
      orderId: '1042',
      method: paymentMethod,
    });
  });

  it('đổi sang ví rồi quay lại QR: vẫn thấy đúng mã QR cũ', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1042', status: 'PENDING', total: 45000 }),
    } as Response);

    render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));
    await screen.findByTestId('qr-payment-panel');
    await waitFor(() => expect(screen.getByTestId('confirm-payment-btn')).toBeEnabled());

    fireEvent.click(screen.getByTestId('method-wallet'));
    fireEvent.click(screen.getByTestId('method-qr'));

    expect(screen.getByText('Đơn 1042 · 45.000₫')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-payment-btn')).toHaveTextContent('Tôi đã quét mã');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('đang tạo QR: hiện khung chờ ngay trong trang, không che toàn màn hình', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1042', status: 'PENDING', total: 45000 }),
    } as Response);

    render(
      <>
        <CheckoutPage />
        <AppFeedback />
      </>,
    );
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));

    expect(screen.getByTestId('qr-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument();
    await screen.findByTestId('qr-payment-panel');
    expect(screen.queryByTestId('qr-loading')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('confirm-payment-btn')).toBeEnabled());
  });

  it('tải lại trang khi đang chờ QR: dùng lại đơn cũ, không tạo đơn mới', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1042', status: 'PENDING', total: 45000 }),
    } as Response);

    const firstVisit = render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));
    await screen.findByTestId('qr-payment-panel');
    firstVisit.unmount();

    render(<CheckoutPage />);

    expect(await screen.findByText('Đơn 1042 · 45.000₫')).toBeInTheDocument();
    expect(screen.getByTestId('payment-qr')).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('giỏ đã đổi sau khi tạo QR: bỏ mã QR cũ vì không còn đúng số tiền', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '1042', status: 'PENDING', total: 45000 }),
    } as Response);

    const firstVisit = render(<CheckoutPage />);
    fireEvent.click(screen.getByTestId('confirm-payment-btn'));
    await screen.findByTestId('qr-payment-panel');
    firstVisit.unmount();
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '' }, 'S', [], 1);

    render(<CheckoutPage />);

    await waitFor(() => expect(sessionStorage.getItem('brewlite-pending-qr')).toBeNull());
    expect(screen.queryByTestId('qr-payment-panel')).not.toBeInTheDocument();
    expect(screen.getByTestId('confirm-payment-btn')).toHaveTextContent('Tạo mã QR thanh toán');
  });

  it('trang lịch sử hiện tên món và topping của đơn', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{
          id: 'o1',
          status: 'PAID',
          total: 120000,
          createdAt: '2026-11-01T00:00:00.000Z',
          items: [{
            productId: 'p1',
            name: 'Latte',
            size: 'L',
            qty: 2,
            lineTotal: 120000,
            toppings: [{ id: 't1', name: 'Trân châu đen', price: 5000 }],
          }],
        }],
        total: 1,
      }),
    } as Response);

    render(<OrderHistoryPage />);

    expect(await screen.findByText('Latte')).toBeInTheDocument();
    expect(screen.getByTestId('order-item-toppings')).toHaveTextContent('Topping: Trân châu đen');
  });

  it('trang tài khoản gọi API thật khi đổi mật khẩu và báo lỗi tiếng Việt', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ items: [], total: 0 }) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Current password is incorrect', code: 'CURRENT_PASSWORD_INVALID' }),
      } as Response);
    mockSearchParams = new URLSearchParams('tab=password');

    const view = render(<ProfilePage />);
    const [current, next, confirm] = Array.from(view.container.querySelectorAll('input[type=password]'));
    fireEvent.change(current, { target: { value: 'matkhau-sai1' } });
    fireEvent.change(next, { target: { value: 'matkhaumoi1' } });
    fireEvent.change(confirm, { target: { value: 'matkhaumoi1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật mật khẩu' }));

    expect(await screen.findByText('Mật khẩu hiện tại không đúng.')).toBeInTheDocument();
    mockSearchParams = new URLSearchParams();
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
    await waitFor(() => {
      expect(screen.getByTestId('confirm-payment-btn')).toBeEnabled();
    });
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