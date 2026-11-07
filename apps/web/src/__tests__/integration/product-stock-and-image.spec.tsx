import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductDetailPage from '@/app/products/[id]/page';
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

describe('Trang chi tiết sản phẩm: ảnh món (mục 6)', () => {
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
});
