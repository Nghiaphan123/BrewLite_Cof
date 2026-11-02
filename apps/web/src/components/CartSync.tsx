'use client';

import { useEffect } from 'react';
import { cartSnapshot, loadCartForUser, markCartDirty, pushCart } from '@/features/cart/cart-sync';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';

const SAVE_DELAY_MS = 400;

export function CartSync() {
  const userId = useAuthStore((state) => (state.token ? state.user?.id : undefined));

  useEffect(() => {
    if (!userId) return;

    let active = true;
    let lastSaved = '';
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let unsubscribe = () => {};

    const startWatching = () => {
      lastSaved = cartSnapshot();
      unsubscribe = useCartStore.subscribe(() => {
        const snapshot = cartSnapshot();
        if (snapshot === lastSaved) return;
        lastSaved = snapshot;
        markCartDirty();
        clearTimeout(saveTimer);
        // Lỗi mạng không chặn thao tác: giỏ giữ cờ chưa lưu và được gửi lại ở lần tải trang sau.
        saveTimer = setTimeout(() => void pushCart().catch(() => {}), SAVE_DELAY_MS);
      });
    };

    void (async () => {
      await useCartStore.persist.rehydrate();
      await loadCartForUser(userId).catch(() => {});
      if (active) startWatching();
    })();

    return () => {
      active = false;
      clearTimeout(saveTimer);
      unsubscribe();
    };
  }, [userId]);

  return null;
}
