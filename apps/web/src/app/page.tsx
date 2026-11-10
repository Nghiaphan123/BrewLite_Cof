'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { MenuPage } from '@/features/menu/menu-page';

export default function HomePage() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!useAuthStore.getState().token) {
      router.replace('/login');
    } else if (useAuthStore.getState().user?.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [token, user, router]);

  if (!token || user?.role === 'ADMIN') {
    return null;
  }

  return <MenuPage />;
}
