import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { CartSync } from '@/components/CartSync';
import { clearLocalCart } from '@/features/cart/cart-sync';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

const latte = { id: 'p1', name: 'Latte', price: 45000, imageUrl: '/l.jpg' };
const mocha = { id: 'p2', name: 'Mocha', price: 49000, imageUrl: '/m.jpg' };

const pearl = { id: '20000000-0000-4000-8000-000000000001', name: 'Trân châu đen', price: 5000 };

const savedLine = (product: typeof latte, qty: number, toppings: (typeof pearl)[] = []) => ({
  productId: product.id,
  size: 'M',
  qty,
  toppingIds: toppings.map((topping) => topping.id),
  toppings,
  product,
});

function mockApi(saved: { items: unknown[]; promoCode: string; promotion?: unknown }) {
  return vi.spyOn(global, 'fetch').mockImplementation(async () =>
    ({ ok: true, status: 200, json: async () => saved }) as Response,
  );
}

const putBodies = (spy: ReturnType<typeof mockApi>) =>
  spy.mock.calls
    .filter(([, init]) => init?.method === 'PUT')
    .map(([, init]) => JSON.parse(String(init?.body)));

const qtyByName = () =>
  Object.fromEntries(useCartStore.getState().items.map((item) => [item.product.name, item.qty]));

const login = (id = 'u1') => useAuthStore.getState().setAuth('jwt', { id, email: `${id}@brewlite.vn` });

describe('Đồng bộ giỏ hàng với API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useAuthStore.getState().logout();
    clearLocalCart();
  });

  it('khách đăng nhập: gộp giỏ khách với giỏ đã lưu và lưu lại lên server', async () => {
    useCartStore.getState().addItem(latte, 'M', [], 1);
    useCartStore.getState().addItem(mocha, 'M', [], 2);
    const fetchSpy = mockApi({ items: [savedLine(latte, 2)], promoCode: '', promotion: null });

    login();
    render(<CartSync />);

    await waitFor(() => expect(putBodies(fetchSpy)).toHaveLength(1));
    expect(qtyByName()).toEqual({ Latte: 3, Mocha: 2 });
    expect(putBodies(fetchSpy)[0].items).toHaveLength(2);
  });

  it('effect chạy hai lần (StrictMode): chỉ gộp giỏ một lần, không nhân đôi số lượng', async () => {
    useCartStore.getState().addItem(latte, 'M', [], 1);
    const fetchSpy = mockApi({ items: [savedLine(latte, 2), savedLine(mocha, 1)], promoCode: '', promotion: null });

    login();
    render(
      <StrictMode>
        <CartSync />
      </StrictMode>,
    );

    await waitFor(() => expect(putBodies(fetchSpy)).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(qtyByName()).toEqual({ Latte: 3, Mocha: 1 });
    expect(putBodies(fetchSpy)).toHaveLength(1);
  });

  it('thiết bị mới với giỏ trống (StrictMode): lấy đúng số lượng đã lưu', async () => {
    const fetchSpy = mockApi({ items: [savedLine(latte, 2)], promoCode: '', promotion: null });

    login();
    render(
      <StrictMode>
        <CartSync />
      </StrictMode>,
    );

    await waitFor(() => expect(qtyByName()).toEqual({ Latte: 2 }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(qtyByName()).toEqual({ Latte: 2 });
    expect(putBodies(fetchSpy)).toHaveLength(0);
  });

  it('tải lại trang: lấy giỏ từ server và không cộng dồn số lượng', async () => {
    localStorage.setItem('brewlite-cart-owner', 'u1');
    useCartStore.getState().addItem(latte, 'M', [], 5);
    const fetchSpy = mockApi({ items: [savedLine(latte, 2, [pearl])], promoCode: 'BREW10', promotion: { code: 'BREW10', type: 'PERCENT', value: 10, minOrderTotal: 0 } });

    login();
    render(<CartSync />);

    await waitFor(() => expect(useCartStore.getState().promoCode).toBe('BREW10'));
    const [item] = useCartStore.getState().items;
    expect(item.qty).toBe(2);
    expect(item.toppings).toEqual([pearl]);
    expect(item.lineTotal).toBe((45000 + 5000 + 5000) * 2);
    expect(putBodies(fetchSpy)).toHaveLength(0);
  });

  it('giỏ còn thay đổi chưa lưu: gửi lên server thay vì ghi đè bằng bản cũ', async () => {
    localStorage.setItem('brewlite-cart-owner', 'u1');
    localStorage.setItem('brewlite-cart-dirty', '1');
    useCartStore.getState().addItem(latte, 'M', [], 5);
    const fetchSpy = mockApi({ items: [], promoCode: '', promotion: null });

    login();
    render(<CartSync />);

    await waitFor(() => expect(putBodies(fetchSpy)).toHaveLength(1));
    expect(qtyByName()).toEqual({ Latte: 5 });
    expect(localStorage.getItem('brewlite-cart-dirty')).toBeNull();
  });

  it('tài khoản khác đăng nhập: bỏ giỏ còn sót của tài khoản trước', async () => {
    localStorage.setItem('brewlite-cart-owner', 'u1');
    useCartStore.getState().addItem(latte, 'M', [], 5);
    const fetchSpy = mockApi({ items: [savedLine(mocha, 1)], promoCode: '', promotion: null });

    login('u2');
    render(<CartSync />);

    await waitFor(() => expect(qtyByName()).toEqual({ Mocha: 1 }));
    expect(putBodies(fetchSpy)).toHaveLength(0);
  });

  it('thay đổi giỏ sau khi đăng nhập thì tự lưu, gộp các thao tác liên tiếp', async () => {
    const fetchSpy = mockApi({ items: [], promoCode: '', promotion: null });
    login();
    render(<CartSync />);
    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));

    useCartStore.getState().addItem(latte, 'M', [], 1);
    useCartStore.getState().addItem(latte, 'M', [], 1);

    await waitFor(() => expect(putBodies(fetchSpy)).toHaveLength(1));
    expect(putBodies(fetchSpy)[0].items[0].qty).toBe(2);
  });

  it('API lỗi: vẫn giữ giỏ trong trình duyệt', async () => {
    useCartStore.getState().addItem(latte, 'M', [], 1);
    const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    login();
    render(<CartSync />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(qtyByName()).toEqual({ Latte: 1 });
  });

  it('khách chưa đăng nhập: không gọi API giỏ hàng', async () => {
    const fetchSpy = mockApi({ items: [], promoCode: '', promotion: null });
    render(<CartSync />);
    useCartStore.getState().addItem(latte, 'M', [], 1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('đăng xuất: xóa giỏ và dấu sở hữu trong trình duyệt', () => {
    localStorage.setItem('brewlite-cart-owner', 'u1');
    useCartStore.getState().addItem(latte, 'M', [], 1);

    clearLocalCart();

    expect(useCartStore.getState().items).toEqual([]);
    expect(localStorage.getItem('brewlite-cart-owner')).toBeNull();
  });
});
