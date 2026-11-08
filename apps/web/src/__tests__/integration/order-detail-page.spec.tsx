import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderConfirmationPage from '@/app/orders/[id]/page';
import { useAuthStore } from '@/store/auth.store';

let mockOrderId = 'order-1';
let mockSearchParams = new URLSearchParams();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: mockOrderId }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/orders',
}));

function mockHistory(orders: unknown[]) {
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ items: orders, total: orders.length }),
  } as Response);
}

const paidOrder = {
  id: 'order-1',
  code: 'BL-2026-0001',
  status: 'PAID',
  total: 45000,
  createdAt: '2026-11-01T00:00:00.000Z',
  items: [{ productId: 'p1', name: 'Latte', size: 'M', qty: 1, lineTotal: 45000, toppings: [] }],
};

describe('Trang chi tiết / xác nhận đơn hàng', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockOrderId = 'order-1';
    mockSearchParams = new URLSearchParams();
    useAuthStore.getState().setAuth('fake-jwt-token', { id: 'u1', email: 'test@brewlite.vn' });
  });

  it('đơn đã thanh toán: hiện thành công, mã đơn và trạng thái từ server', async () => {
    mockSearchParams = new URLSearchParams('status=PAID');
    mockHistory([paidOrder]);

    render(<OrderConfirmationPage />);

    expect(await screen.findByText('Đặt hàng thành công')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-order-id')).toHaveTextContent('BL-2026-0001');
    expect(screen.getByTestId('confirm-order-status')).toHaveTextContent('Đã thanh toán');
  });

  it('?status=PAYMENT_FAILED: không được báo "Đặt hàng thành công"', async () => {
    mockSearchParams = new URLSearchParams('status=PAYMENT_FAILED');
    mockHistory([{ ...paidOrder, status: 'PAYMENT_FAILED' }]);

    render(<OrderConfirmationPage />);

    expect(await screen.findByText('Thanh toán chưa thành công')).toBeInTheDocument();
    expect(screen.queryByText('Đặt hàng thành công')).not.toBeInTheDocument();
    expect(screen.getByTestId('confirm-order-status')).toHaveTextContent('Thanh toán thất bại');
  });

  it('server báo trạng thái khác ?status=: tin server, không tin URL', async () => {
    mockSearchParams = new URLSearchParams('status=PAID');
    mockHistory([{ ...paidOrder, status: 'PENDING' }]);

    render(<OrderConfirmationPage />);

    expect(await screen.findByTestId('confirm-order-status')).toHaveTextContent('Chờ xử lý');
    expect(screen.queryByText('Đặt hàng thành công')).not.toBeInTheDocument();
  });

  it('mã đơn không tồn tại: chỉ hiện một thông báo, không hiện "Đã thanh toán"', async () => {
    mockOrderId = 'khong-co';
    mockHistory([paidOrder]);

    render(<OrderConfirmationPage />);

    expect(await screen.findByTestId('order-not-found')).toBeInTheDocument();
    expect(screen.queryByText(/Đã thanh toán/)).not.toBeInTheDocument();
    expect(screen.queryByTestId('confirm-order-status')).not.toBeInTheDocument();
    expect(screen.queryByText('Không tìm thấy thông tin sản phẩm trong đơn hàng này')).not.toBeInTheDocument();
  });

  it('mở được bằng mã đơn BL-YYYY-NNNN', async () => {
    mockOrderId = 'BL-2026-0001';
    mockHistory([paidOrder]);

    render(<OrderConfirmationPage />);

    expect(await screen.findByTestId('confirm-order-status')).toHaveTextContent('Đã thanh toán');
  });
});
