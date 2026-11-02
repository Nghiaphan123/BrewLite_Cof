import { apiClient, ServerCart } from '@/lib/api';
import { calculateUnitPrice } from '@/features/product/pricing';
import { buildCartItemId, useCartStore } from '@/store/cart.store';
import { CartItem } from '@/types';

// Giỏ trong trình duyệt đang là bản của tài khoản nào, và đã lưu lên server chưa.
const OWNER_KEY = 'brewlite-cart-owner';
const DIRTY_KEY = 'brewlite-cart-dirty';

/** Mã QR đang chờ thanh toán của tab này. */
export const PENDING_QR_KEY = 'brewlite-pending-qr';

const MAX_QTY = 99;

export function fromServerCart(cart: ServerCart): CartItem[] {
  return cart.items.map((line) => {
    const { toppings } = line;
    const unitPrice = calculateUnitPrice(line.product.price, line.size, toppings);
    return {
      cartItemId: buildCartItemId(line.productId, line.size, toppings),
      product: line.product,
      size: line.size,
      toppings,
      qty: line.qty,
      unitPrice,
      lineTotal: unitPrice * line.qty,
    };
  });
}

/** Gộp giỏ khách vào giỏ đã lưu: cùng món thì cộng số lượng, tối đa 99 như API. */
export function mergeCartItems(guest: CartItem[], saved: CartItem[]): CartItem[] {
  const merged = new Map(saved.map((item) => [item.cartItemId, item]));
  for (const item of guest) {
    const existing = merged.get(item.cartItemId);
    const qty = Math.min((existing?.qty ?? 0) + item.qty, MAX_QTY);
    merged.set(item.cartItemId, { ...item, qty, lineTotal: item.unitPrice * qty });
  }
  return [...merged.values()];
}

function currentPayload() {
  const { items, promoCode } = useCartStore.getState();
  return {
    items: items.map((item) => ({
      productId: item.product.id,
      size: item.size,
      qty: item.qty,
      toppingIds: item.toppings.map((topping) => topping.id),
    })),
    promoCode: promoCode || undefined,
  };
}

/** Chuỗi so sánh để biết giỏ có thật sự đổi so với lần lưu gần nhất hay không. */
export const cartSnapshot = () => JSON.stringify(currentPayload());

/** Đánh dấu ngay khi giỏ đổi, để tải lại trang trong lúc chờ lưu không làm mất thay đổi. */
export const markCartDirty = () => localStorage.setItem(DIRTY_KEY, '1');

export async function pushCart(): Promise<void> {
  markCartDirty();
  await apiClient.saveCart(currentPayload());
  localStorage.removeItem(DIRTY_KEY);
}

let loading: { userId: string; promise: Promise<void> } | null = null;

/**
 * Đồng bộ một lần sau khi có phiên đăng nhập, gồm cả khi tải lại trang.
 * Hai lần gọi trùng nhau dùng chung một lượt, nếu không giỏ khách sẽ bị gộp hai lần và nhân đôi số lượng.
 */
export function loadCartForUser(userId: string): Promise<void> {
  if (loading?.userId === userId) return loading.promise;

  const promise = syncCartForUser(userId).finally(() => {
    loading = null;
  });
  loading = { userId, promise };
  return promise;
}

async function syncCartForUser(userId: string): Promise<void> {
  const owner = localStorage.getItem(OWNER_KEY);
  const hasUnsavedChanges = owner === userId && localStorage.getItem(DIRTY_KEY) !== null;

  if (hasUnsavedChanges) {
    await pushCart();
    return;
  }

  const saved = await apiClient.getCart();
  const savedItems = fromServerCart(saved);
  localStorage.removeItem(DIRTY_KEY);
  localStorage.setItem(OWNER_KEY, userId);

  // Chỉ giỏ khách mới được gộp; giỏ còn lại của tài khoản khác thì bỏ.
  if (owner === null) {
    const { items: guestItems, promotion: guestPromotion } = useCartStore.getState();
    const promotion = guestPromotion ?? saved.promotion;
    useCartStore.setState({
      items: mergeCartItems(guestItems, savedItems),
      promotion,
      promoCode: promotion?.code ?? '',
    });
    if (guestItems.length > 0) await pushCart();
    return;
  }

  useCartStore.setState({
    items: savedItems,
    promotion: saved.promotion,
    promoCode: saved.promotion?.code ?? '',
  });
}

/** Đăng xuất: giỏ vẫn nằm trên server, người dùng tiếp theo của trình duyệt không thấy nó. */
export function clearLocalCart(): void {
  useCartStore.getState().clearCart();
  sessionStorage.removeItem(PENDING_QR_KEY);
  localStorage.removeItem(OWNER_KEY);
  localStorage.removeItem(DIRTY_KEY);
}
