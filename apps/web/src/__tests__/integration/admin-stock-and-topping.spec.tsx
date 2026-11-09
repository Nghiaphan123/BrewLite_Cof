import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductDetailPage from '@/app/products/[id]/page';
import CartPage from '@/app/cart/page';
import { StockTable } from '@/features/admin/StockTable';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import type { Topping } from '@/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: 'p1' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/products/p1',
}));

const pearl: Topping = { id: 't-pearl', name: 'Trân châu đen', price: 5000, stock: 2 };
const cheese: Topping = { id: 't-cheese', name: 'Kem cheese', price: 5000, stock: 0 };
const latte = { id: 'p1', name: 'Latte', price: 45000, imageUrl: '', stock: 20 };

function mockProductDetail() {
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({ ...latte, toppings: [cheese, pearl] }),
  } as Response);
}

describe('Trang chi tiết món: tồn kho topping (mục 2.1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.getState().clearCart();
  });

  it('topping hết hàng có nhãn "Hết" và không chọn được', async () => {
    mockProductDetail();
    render(<ProductDetailPage />);

    const cheeseBox = await screen.findByTestId('topping-t-cheese');
    expect(cheeseBox).toBeDisabled();
    expect(screen.getByTestId('topping-soldout-t-cheese')).toHaveTextContent('Hết');
    expect(screen.getByTestId('topping-t-pearl')).toBeEnabled();
  });

  it('số ly tối đa tính cả topping đã chọn (đã trừ phần topping trong giỏ)', async () => {
    // Giỏ đã có 1 ly dùng trân châu; trân châu còn 2 phần -> chỉ thêm được 1 ly nữa.
    useCartStore.getState().addItem(latte, 'S', [pearl], 1);
    mockProductDetail();
    render(<ProductDetailPage />);

    fireEvent.click(await screen.findByTestId('topping-t-pearl'));
    const plus = screen.getByRole('button', { name: 'Tăng số lượng' });
    expect(plus).toBeDisabled();
    expect(screen.getByTestId('detail-qty')).toHaveTextContent('1');
    expect(screen.getByTestId('add-to-cart-btn')).toBeEnabled();
  });

  it('topping đã dùng hết phần trong giỏ: báo và khoá nút thêm', async () => {
    useCartStore.getState().addItem(latte, 'S', [pearl], 2);
    mockProductDetail();
    render(<ProductDetailPage />);

    fireEvent.click(await screen.findByTestId('topping-t-pearl'));
    expect(screen.getByTestId('stock-notice')).toHaveTextContent('Topping bạn chọn không còn đủ');
    expect(screen.getByTestId('add-to-cart-btn')).toBeDisabled();
    expect(screen.getByTestId('add-to-cart-btn')).toHaveTextContent('Topping không đủ');
  });
});

describe('Giỏ hàng: cảnh báo topping không đủ (mục 2.2)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.getState().clearCart();
    useAuthStore.getState().setAuth('fake-jwt-token', { id: 'u1', email: 'test@brewlite.vn' });
  });

  it('giỏ cần nhiều phần topping hơn số còn: hiện cảnh báo trên dòng đó', () => {
    useCartStore.getState().addItem(latte, 'S', [pearl], 3);
    render(<CartPage />);

    const item = useCartStore.getState().items[0];
    expect(screen.getByTestId(`topping-warning-${item.cartItemId}-t-pearl`)).toHaveTextContent(
      'Topping Trân châu đen chỉ còn 2 phần',
    );
    expect(screen.getByRole('button', { name: 'Tăng số lượng' })).toBeDisabled();
  });

  it('topping đã hết: báo hết và hướng dẫn xoá ly đó', () => {
    useCartStore.getState().addItem(latte, 'S', [cheese], 1);
    render(<CartPage />);

    const item = useCartStore.getState().items[0];
    expect(screen.getByTestId(`topping-warning-${item.cartItemId}-t-cheese`)).toHaveTextContent(
      'Topping Kem cheese đã hết',
    );
  });

  it('đủ topping thì không cảnh báo', () => {
    useCartStore.getState().addItem(latte, 'S', [pearl], 2);
    render(<CartPage />);

    expect(screen.queryByText(/Topping Trân châu đen/)).not.toBeInTheDocument();
  });
});

describe('Bảng tồn kho của trang admin', () => {
  const rows = [
    { id: 'p1', name: 'Latte', price: 45000, stock: 30 },
    { id: 'p2', name: 'Cà phê phin giới hạn', price: 55000, stock: 0 },
  ];

  it('hiện số còn lại và trạng thái kho của từng món', () => {
    render(
      <StockTable itemLabel="Món" unit="ly" searchPlaceholder="Tìm món..." emptyText="Trống" rows={rows} loading={false} onSave={vi.fn()} />,
    );

    expect(screen.getByTestId('stock-row-p1')).toHaveTextContent('30 ly còn lại');
    expect(screen.getByTestId('stock-row-p1')).toHaveTextContent('Còn hàng');
    expect(screen.getByTestId('stock-row-p2')).toHaveTextContent('0 ly còn lại');
    expect(screen.getByTestId('stock-row-p2')).toHaveTextContent('Hết hàng');
  });

  it('sửa số rồi bấm Lưu thì gửi đúng số mới', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    render(
      <StockTable itemLabel="Món" unit="ly" searchPlaceholder="Tìm món..." emptyText="Trống" rows={rows} loading={false} onSave={onSave} />,
    );

    const input = screen.getByLabelText('Tồn kho mới của Cà phê phin giới hạn');
    fireEvent.change(input, { target: { value: '15' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Lưu' })[1]);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('p2', 15));
  });

  it('không cho số âm, và nút Lưu khoá khi chưa đổi gì', () => {
    render(
      <StockTable itemLabel="Món" unit="ly" searchPlaceholder="Tìm món..." emptyText="Trống" rows={rows} loading={false} onSave={vi.fn()} />,
    );

    const saveButtons = screen.getAllByRole('button', { name: 'Lưu' });
    expect(saveButtons[0]).toBeDisabled();

    fireEvent.click(screen.getAllByTitle('-10')[1]);
    expect(screen.getByLabelText('Tồn kho mới của Cà phê phin giới hạn')).toHaveValue(0);
    expect(saveButtons[1]).toBeDisabled();
  });

  it('tìm theo tên món', () => {
    render(
      <StockTable itemLabel="Món" unit="ly" searchPlaceholder="Tìm món..." emptyText="Trống" rows={rows} loading={false} onSave={vi.fn()} />,
    );

    fireEvent.change(screen.getByPlaceholderText('Tìm món...'), { target: { value: 'phin' } });
    expect(screen.queryByTestId('stock-row-p1')).not.toBeInTheDocument();
    expect(screen.getByTestId('stock-row-p2')).toBeInTheDocument();
  });
});
