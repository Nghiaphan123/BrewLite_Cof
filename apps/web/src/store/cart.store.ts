import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartItem, Product, Promotion, SizeOption, Topping } from '@/types';
import { calculateDiscount, calculateLineTotal, calculateUnitPrice } from '@/features/product/pricing';

interface CartState {
  items: CartItem[];
  promoCode: string;
  promotion: Promotion | null;
  addItem: (product: Product, size: SizeOption, toppings: Topping[], qty?: number) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  removeItem: (cartItemId: string) => void;
  setPromotion: (promotion: Promotion | null) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotalPrice: () => number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildCartItemId(productId: string, size: SizeOption, toppings: Topping[]): string {
  const toppingIds = toppings.map((t) => t.id).sort().join(',');
  return `${productId}__${size}__${toppingIds}`;
}

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], Pick<CartState, 'items' | 'promoCode' | 'promotion'>>(
    (set, get) => ({
      items: [],
      promoCode: '',
      promotion: null,

      addItem: (product, size, toppings, qty = 1) => {
        const cartItemId = buildCartItemId(product.id, size, toppings);
        set((state) => {
          const existingIndex = state.items.findIndex((i) => i.cartItemId === cartItemId);
          if (existingIndex > -1) {
            const updated = [...state.items];
            const newQty = updated[existingIndex].qty + qty;
            updated[existingIndex] = {
              ...updated[existingIndex],
              qty: newQty,
              lineTotal: calculateLineTotal(product.price, size, toppings, newQty),
            };
            return { items: updated };
          }

          const unitPrice = calculateUnitPrice(product.price, size, toppings);
          const newItem: CartItem = {
            cartItemId,
            product,
            size,
            toppings,
            qty,
            unitPrice,
            lineTotal: unitPrice * qty,
          };
          return { items: [...state.items, newItem] };
        });
      },

      updateQty: (cartItemId, qty) => {
        set((state) => {
          if (qty <= 0) {
            return { items: state.items.filter((i) => i.cartItemId !== cartItemId) };
          }
          return {
            items: state.items.map((item) =>
              item.cartItemId === cartItemId
                ? {
                    ...item,
                    qty,
                    lineTotal: calculateLineTotal(item.product.price, item.size, item.toppings, qty),
                  }
                : item
            ),
          };
        });
      },

      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.cartItemId !== cartItemId),
        }));
      },

      setPromotion: (promotion) => set({ promotion, promoCode: promotion?.code ?? '' }),

      clearCart: () => set({ items: [], promoCode: '', promotion: null }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.qty, 0),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.lineTotal, 0),

      getDiscount: () => calculateDiscount(get().getSubtotal(), get().promotion),

      getTotalPrice: () => Math.max(0, get().getSubtotal() - get().getDiscount()),
    }),
    {
      name: 'brewlite-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, promoCode: state.promoCode, promotion: state.promotion }),
      skipHydration: true,
      // Bản cũ dùng mã topping riêng của web (pearl, cream...) mà API không nhận,
      // và chỉ lưu tên mã giảm giá nên không tính lại được; người dùng nhập lại mã.
      version: 2,
      migrate: (persisted) => {
        const saved = persisted as Pick<CartState, 'items'>;
        return {
          items: (saved.items ?? []).filter((item) => item.toppings.every((t) => UUID_PATTERN.test(t.id))),
          promoCode: '',
          promotion: null,
        };
      },
    },
  ),
);