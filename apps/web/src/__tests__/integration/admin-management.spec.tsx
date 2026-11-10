import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminPage from '@/app/admin/page';
import { StockTable } from '@/features/admin/StockTable';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import type { Promotion, User } from '@/types';

let currentTab = 'users';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(`tab=${currentTab}`),
  usePathname: () => '/admin',
}));

const adminUser: User = { id: 'u-admin', name: 'admin', email: 'admin@brewlite.vn', role: 'ADMIN', blocked: false };
const customer: User = { id: 'u-1', name: 'Khách Một', email: 'customer01@brewlite.test', role: 'CUSTOMER', blocked: false };
const promo: Promotion = {
  id: 'p-1',
  code: 'BREW10',
  type: 'PERCENT',
  value: 10,
  minOrderTotal: 0,
  active: true,
  validFrom: '2026-01-01T00:00:00Z',
  validTo: '2027-12-31T00:00:00Z',
};

describe('Trang admin: khoá / mở tài khoản', () => {
  beforeEach(() => {
    currentTab = 'users';
    useAuthStore.getState().setAuth('fake-admin-token', adminUser);
    vi.spyOn(apiClient, 'getAdminUsers').mockResolvedValue([adminUser, customer]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('khách hàng có nút "Khoá"; tài khoản quản trị viên thì không', async () => {
    render(<AdminPage />);

    expect(await screen.findByTestId('user-toggle-u-1')).toHaveTextContent('Khoá');
    expect(screen.queryByTestId('user-toggle-u-admin')).not.toBeInTheDocument();
    expect(screen.getByTestId('user-status-u-1')).toHaveTextContent('Hoạt động');
  });

  it('bấm "Khoá", xác nhận: gọi API rồi đổi sang "Đã khoá" và nút "Mở khoá"', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const block = vi.spyOn(apiClient, 'setAdminUserBlocked').mockResolvedValue({ ...customer, blocked: true });
    render(<AdminPage />);

    fireEvent.click(await screen.findByTestId('user-toggle-u-1'));

    await waitFor(() => expect(screen.getByTestId('user-status-u-1')).toHaveTextContent('Đã khoá'));
    expect(block).toHaveBeenCalledWith('u-1', true);
    expect(screen.getByTestId('user-toggle-u-1')).toHaveTextContent('Mở khoá');
    expect(screen.getByRole('status')).toHaveTextContent('Đã khoá tài khoản Khách Một');
  });

  it('bấm "Khoá" nhưng chọn Huỷ ở hộp xác nhận thì không gọi API', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const block = vi.spyOn(apiClient, 'setAdminUserBlocked');
    render(<AdminPage />);

    fireEvent.click(await screen.findByTestId('user-toggle-u-1'));

    expect(block).not.toHaveBeenCalled();
    expect(screen.getByTestId('user-status-u-1')).toHaveTextContent('Hoạt động');
  });
});

describe('Trang admin: huỷ / kích hoạt lại mã khuyến mãi', () => {
  beforeEach(() => {
    currentTab = 'promotions';
    useAuthStore.getState().setAuth('fake-admin-token', adminUser);
    vi.spyOn(apiClient, 'getAdminPromotions').mockResolvedValue([promo]);
  });
  afterEach(() => vi.restoreAllMocks());

  it('bấm "Huỷ mã", xác nhận: mã chuyển sang "Đã huỷ", nút thành "Kích hoạt lại"', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const setActive = vi.spyOn(apiClient, 'setAdminPromotionActive').mockResolvedValue({ ...promo, active: false });
    render(<AdminPage />);

    fireEvent.click(await screen.findByTestId('promo-toggle-BREW10'));

    await waitFor(() => expect(screen.getByTestId('promo-toggle-BREW10')).toHaveTextContent('Kích hoạt lại'));
    expect(setActive).toHaveBeenCalledWith('p-1', false);
    expect(screen.getByText('Đã huỷ')).toBeInTheDocument();
  });

  it('kích hoạt lại mã đã huỷ không cần hộp xác nhận', async () => {
    vi.spyOn(apiClient, 'getAdminPromotions').mockResolvedValue([{ ...promo, active: false }]);
    const confirm = vi.spyOn(window, 'confirm');
    const setActive = vi.spyOn(apiClient, 'setAdminPromotionActive').mockResolvedValue({ ...promo, active: true });
    render(<AdminPage />);

    fireEvent.click(await screen.findByTestId('promo-toggle-BREW10'));

    await waitFor(() => expect(screen.getByTestId('promo-toggle-BREW10')).toHaveTextContent('Huỷ mã'));
    expect(setActive).toHaveBeenCalledWith('p-1', true);
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe('Bảng topping: đổi giá', () => {
  const rows = [{ id: 't-1', name: 'Trân châu đen', price: 5000, stock: 50 }];

  it('sửa giá rồi bấm "Lưu giá" thì gửi giá mới; chưa đổi thì nút bị khoá', async () => {
    const onSavePrice = vi.fn().mockResolvedValue(true);
    render(
      <StockTable
        itemLabel="Topping"
        unit="phần"
        searchPlaceholder="Tìm topping..."
        emptyText="Trống"
        rows={rows}
        loading={false}
        onSave={vi.fn()}
        onSavePrice={onSavePrice}
      />,
    );

    const save = screen.getByRole('button', { name: 'Lưu giá' });
    expect(save).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Giá mới của Trân châu đen'), { target: { value: '8000' } });
    fireEvent.click(save);

    await waitFor(() => expect(onSavePrice).toHaveBeenCalledWith('t-1', 8000));
  });

  it('không nhập được giá âm', () => {
    render(
      <StockTable
        itemLabel="Topping"
        unit="phần"
        searchPlaceholder="Tìm topping..."
        emptyText="Trống"
        rows={rows}
        loading={false}
        onSave={vi.fn()}
        onSavePrice={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Giá mới của Trân châu đen'), { target: { value: '-3000' } });
    expect(screen.getByLabelText('Giá mới của Trân châu đen')).toHaveValue(0);
  });

  it('bảng món (không truyền onSavePrice) chỉ hiện giá, không có ô sửa', () => {
    render(
      <StockTable itemLabel="Món" unit="ly" searchPlaceholder="Tìm món..." emptyText="Trống" rows={rows} loading={false} onSave={vi.fn()} />,
    );

    expect(screen.queryByLabelText('Giá mới của Trân châu đen')).not.toBeInTheDocument();
    expect(screen.getByTestId('stock-row-t-1')).toHaveTextContent('5.000');
  });
});

describe('Tài khoản bị khoá trong lúc đang đăng nhập', () => {
  afterEach(() => vi.restoreAllMocks());

  it('API trả ACCOUNT_BLOCKED: web xoá phiên đăng nhập và báo tài khoản bị khoá', async () => {
    useAuthStore.getState().setAuth('old-token', customer);
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ statusCode: 403, error: 'Forbidden', message: 'This account has been blocked', code: 'ACCOUNT_BLOCKED' }),
    } as Response);

    await expect(apiClient.getCart()).rejects.toThrow('Tài khoản của bạn đã bị khoá');
    expect(useAuthStore.getState().token).toBeNull();
  });
});
