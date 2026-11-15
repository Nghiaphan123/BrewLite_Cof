import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProductDetailPage from '@/app/products/[id]/page';
import { ProductCard } from '@/features/menu/ProductCard';
import { useCartStore } from '@/store/cart.store';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  useParams: () => ({ id: 'p1' }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/products/p1',
}));

function mockProduct(stock: number | undefined) {
  vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id: 'p1',
      name: 'Latte',
      price: 45000,
      imageUrl: 'http://localhost:3000/images/products/1.jpg',
      ...(stock === undefined ? {} : { stock }),
      toppings: [],
    }),
  } as Response);
}

describe('Trang chi tiết sản phẩm: ảnh món (mục 6) và tồn kho (mục 5)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.getState().clearCart();
  });

  it('hiện ảnh món với alt là tên món', async () => {
    mockProduct(10);
    render(<ProductDetailPage />);

    const image = await screen.findByRole('img', { name: 'Latte' });
    expect(image).toHaveAttribute('src', expect.stringContaining('/images/products/1.jpg'));
    expect(screen.getByTestId('product-detail-image')).toBeInTheDocument();
  });

  it('món hết hàng: báo hết hàng và khoá nút thêm vào giỏ', async () => {
    mockProduct(0);
    render(<ProductDetailPage />);

    expect(await screen.findByTestId('stock-notice')).toHaveTextContent('tạm hết hàng');
    expect(screen.getByTestId('add-to-cart-btn')).toBeDisabled();
    expect(screen.getByTestId('add-to-cart-btn')).toHaveTextContent('Hết hàng');
    fireEvent.click(screen.getByTestId('add-to-cart-btn'));
    expect(useCartStore.getState().getTotalItems()).toBe(0);
  });

  it('không cho chọn quá số ly còn lại, đã trừ số ly cùng món trong giỏ', async () => {
    useCartStore.getState().addItem({ id: 'p1', name: 'Latte', price: 45000, imageUrl: '', stock: 3 }, 'L', [], 1);
    mockProduct(3);
    render(<ProductDetailPage />);

    const plus = await screen.findByRole('button', { name: 'Tăng số lượng' });
    fireEvent.click(plus);
    expect(screen.getByTestId('detail-qty')).toHaveTextContent('2');
    expect(plus).toBeDisabled(); // 3 trong kho − 1 trong giỏ = tối đa 2
  });

  it('API không gửi tồn kho thì không chặn (backend sẽ kiểm tra khi thanh toán)', async () => {
    mockProduct(undefined);
    render(<ProductDetailPage />);

    expect(await screen.findByTestId('add-to-cart-btn')).toBeEnabled();
    expect(screen.queryByTestId('stock-notice')).not.toBeInTheDocument();
  });
});

describe('Thẻ món ở menu: tồn kho (mục 5)', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
  });

  it('món hết hàng: có nhãn "Hết hàng" và không thêm nhanh được', () => {
    render(<ProductCard product={{ id: 'p1', name: 'Latte', price: 45000, imageUrl: '', stock: 0 }} />);

    expect(screen.getByTestId('out-of-stock-p1')).toHaveTextContent('Hết hàng');
    expect(screen.queryByRole('button', { name: 'Thêm Latte vào giỏ hàng' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Latte đã hết hàng' })).toBeDisabled();
  });

  it('còn hàng: thêm nhanh được, hết số ly còn lại thì khoá nút', () => {
    render(<ProductCard product={{ id: 'p1', name: 'Latte', price: 45000, imageUrl: '', stock: 1 }} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mua ngay Latte' }));
    expect(useCartStore.getState().getTotalItems()).toBe(1);
    expect(screen.getByRole('button', { name: 'Giỏ đã có hết số Latte còn lại' })).toBeDisabled();
  });
});
