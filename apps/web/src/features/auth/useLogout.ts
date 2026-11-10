import { useRouter } from 'next/navigation';
import { clearLocalCart } from '@/features/cart/cart-sync';
import { useAuthStore } from '@/store/auth.store';
import { runWithLoading, wait } from '@/store/ui.store';

export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return () =>
    runWithLoading('Đang đăng xuất...', async () => {
      // Chờ một nhịp ngắn để màn hình load che kịp trước khi xóa phiên,
      // tránh nháy trạng thái "chưa đăng nhập" trên trang hiện tại.
      await wait(300);
      logout();
      clearLocalCart();
      // Dùng replace thay push để không để lại /admin trong history sau khi đăng xuất.
      // Không gọi holdLoadingUntilNavigation ở đây — overlay sẽ tự tắt khi
      // runWithLoading kết thúc; dùng hold ở đây khiến overlay treo vô hạn.
      router.replace('/login');
    });
}
