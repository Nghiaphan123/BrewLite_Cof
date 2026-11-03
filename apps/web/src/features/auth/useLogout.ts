import { useRouter } from 'next/navigation';
import { clearLocalCart } from '@/features/cart/cart-sync';
import { useAuthStore } from '@/store/auth.store';
import { runWithLoading, useUiStore, wait } from '@/store/ui.store';

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return () =>
    runWithLoading('Đang đăng xuất...', async () => {
      // Giữ phiên tới khi màn hình load đã che trang, để trang hiện tại không nháy trạng thái "chưa đăng nhập".
      await wait(300);
      logout();
      clearLocalCart();
      useUiStore.getState().holdLoadingUntilNavigation();
      router.push('/login');
    });
}
