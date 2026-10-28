import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { CartItem, Product, SizeOption, Topping } from '@/types';
import { calculateDiscount, calculateLineTotal, calculateUnitPrice } from '@/features/product/pricing';

interface CartState {
  items: CartItem[];
  promoCode: string;
  addItem: (product: Product, size: SizeOption, toppings: Topping[], qty?: number) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  removeItem: (cartItemId: string) => void;
  setPromoCode: (code: string) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getDiscount: () => number;
  getTotalPrice: () => number;
}

export function buildCartItemId(productId: string, size: SizeOption, toppings: Topping[]): string {
  const toppingIds = toppings.map((t) => t.id).sort().join(',');
  return `${productId}__${size}__${toppingIds}`;
}

export const useCartStore = create<CartState>()(
  persist<CartState, [], [], Pick<CartState, 'items' | 'promoCode'>>(
    (set, get) => ({
      items: [],
      promoCode: '',

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

      setPromoCode: (code) => set({ promoCode: code }),

      clearCart: () => set({ items: [], promoCode: '' }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.qty, 0),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.lineTotal, 0),

      getDiscount: () => calculateDiscount(get().getSubtotal(), get().promoCode),

      getTotalPrice: () => Math.max(0, get().getSubtotal() - get().getDiscount()),
    }),
    {
      name: 'brewlite-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items, promoCode: state.promoCode }),
      skipHydration: true,
    },
  ),
);