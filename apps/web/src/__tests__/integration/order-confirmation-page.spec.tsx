import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OrderConfirmationRoute from '@/app/orders/[id]/confirmation/page';
import { useAuthStore } from '@/store/auth.store';

const replaceMock = vi.fn();
let mockId = 'BL-2026-0042';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: replaceMock, back: vi.fn() }),
  useParams: () => ({ id: mockId }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => `/orders/${mockId}/confirmation`,
}));

const paidOrder = {
  id: 'uuid-42',
  code: 'BL-2026-0042',
  status: 'PAID',
  total: 70000,
  createdAt: '2026-11-07T10:00:00.000Z',
  items: [
    { productId: 'p1', name: 'Latte', size: 'M', qty: 1, lineTotal: 50000, toppings: [] },
    { productId: 'p2', name: 'Trà đào', size: 'L', qty: 1, lineTotal: 40000, toppings: [] },
  ],
  payment: { method: 'WALLET', paidAt: '2026-11-07T10:01:00.000Z', loyaltyPointsEarned: 70 },
};

function ok(body: unknown) {
  return { ok: true, status: 200, json: async () => body } as Response;
}

describe('Trang xác nhận đơn hàng /orders/[id]/confirmation (mục 10 và 8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    replaceMock.mockReset();
    mockId = 'BL-2026-0042';
    useAuthStore.getState().setAuth('fake-jwt-token', { id: 'u1', email: 'test@brewlite.vn' });
  });

  it('đơn đã trả tiền: mã đơn, trạng thái, giảm giá, tổng tiền và điểm thưởng', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(ok(paidOrder));

    render(<OrderConfirmationRoute />);

    expect(await screen.findByText('Đặt hàng thành công')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-order-code')).toHaveTextContent('#BL-2026-0042');
    expect(screen.getByTestId('confirm-order-status')).toHaveTextContent('Đã thanh toán');
    expect(screen.getByTestId('confirm-discount')).toHaveTextContent('−20.000₫');
    expect(screen.getByTestId('confirm-total')).toHaveTextContent('70.000₫');
    expect(screen.getByTestId('confirm-points')).toHaveTextContent('+70 điểm thưởng');
    expect(screen.getByRole('link', { name: 'Về trang chủ' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Xem lịch sử đơn' })).toHaveAttribute('href', '/orders');
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/orders/BL-2026-0042');
  });

  it('không tìm thấy hoặc không phải đơn của mình (404): một thông báo an toàn', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ statusCode: 404, message: 'Order not found', code: 'ORDER_NOT_FOUND' }),
    } as Response);

    render(<OrderConfirmationRoute />);

    expect(await screen.findByTestId('confirmation-not-found')).toHaveTextContent('Không tìm thấy đơn hàng');
    expect(screen.queryByText('Đặt hàng thành công')).not.toBeInTheDocument();
    expect(screen.queryByTestId('confirm-order-status')).not.toBeInTheDocument();
  });

  it('lỗi máy chủ: hiện lỗi và tải lại được bằng nút "Thử lại"', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) } as Response)
      .mockResolvedValueOnce(ok(paidOrder));

    render(<OrderConfirmationRoute />);

    expect(await screen.findByTestId('confirmation-error')).toHaveTextContent('Không tải được đơn hàng');
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Đặt hàng thành công')).toBeInTheDocument();
  });

  it('đơn thanh toán thất bại: không báo thành công, có link quay lại thanh toán', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(ok({ ...paidOrder, status: 'PAYMENT_FAILED', payment: null }));

    render(<OrderConfirmationRoute />);

    expect(await screen.findByText('Thanh toán chưa thành công')).toBeInTheDocument();
    expect(screen.queryByText('Đặt hàng thành công')).not.toBeInTheDocument();
    expect(screen.queryByTestId('confirm-points')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Quay lại thanh toán' })).toHaveAttribute('href', '/checkout');
  });

  it('link theo id (không phải mã đơn): tìm mã trong lịch sử rồi tải chi tiết theo mã', async () => {
    mockId = 'uuid-42';
    const fetchSpy = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(ok({ items: [{ ...paidOrder, payment: undefined }], total: 1 }))
      .mockResolvedValueOnce(ok(paidOrder));

    render(<OrderConfirmationRoute />);

    expect(await screen.findByTestId('confirm-points')).toBeInTheDocument();
    expect(String(fetchSpy.mock.calls[0][0])).toContain('/orders/me');
    expect(String(fetchSpy.mock.calls[1][0])).toContain('/orders/BL-2026-0042');
  });

  it('chưa đăng nhập: chuyển sang trang đăng nhập rồi quay lại đúng trang này', async () => {
    useAuthStore.getState().logout();
    const fetchSpy = vi.spyOn(global, 'fetch');

    render(<OrderConfirmationRoute />);

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith('/login?redirect=%2Forders%2FBL-2026-0042%2Fconfirmation'),
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
