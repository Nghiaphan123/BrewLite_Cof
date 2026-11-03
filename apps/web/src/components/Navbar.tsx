'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { AccountMenu } from '@/components/AccountMenu';

export function Navbar() {
  const totalItems = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href={isAdmin ? '/admin' : '/menu'} className="flex items-center gap-2 text-xl font-bold tracking-tight text-emerald-800">
          <span>☕ BrewLite</span>
          {isAdmin && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900 border border-amber-300">
              Admin
            </span>
          )}
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium text-stone-700 sm:gap-4">
          <Link href="/menu" className="hover:text-emerald-700">
            Menu
          </Link>

          {!isAdmin && (
            <Link href="/orders" className="hover:text-emerald-700">
              Lịch sử đơn
            </Link>
          )}

          {/* 3 more tabs + order tab for Admin */}
          {isAdmin && (
            <>
              <Link
                href="/admin?tab=toppings"
                className="hover:text-emerald-700 font-semibold text-emerald-950 flex items-center gap-1"
              >
                <span>🧋</span> Topping
              </Link>
              <Link
                href="/admin?tab=users"
                className="hover:text-emerald-700 font-semibold text-emerald-950 flex items-center gap-1"
              >
                <span>👥</span> Người dùng
              </Link>
              <Link
                href="/admin?tab=promotions"
                className="hover:text-emerald-700 font-semibold text-emerald-950 flex items-center gap-1"
              >
                <span>🏷️</span> Khuyến mãi
              </Link>
              <Link
                href="/admin?tab=orders"
                className="hover:text-emerald-700 font-semibold text-emerald-950 flex items-center gap-1"
              >
                <span>📋</span> Đơn hàng
              </Link>
            </>
          )}

          <AccountMenu />

          {!isAdmin && (
            <Link
              href="/cart"
              className="relative flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-white hover:bg-emerald-800"
            >
              <span>Giỏ hàng</span>
              <span
                key={totalItems}
                data-testid="cart-badge"
                className="flex h-5 min-w-[20px] animate-pop items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-emerald-800"
              >
                {totalItems}
              </span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
