'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';

export function Navbar() {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { token, user, logout } = useAuthStore();

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-emerald-800">
          ☕ BrewLite
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-stone-700">
          <Link href="/" className="hover:text-emerald-700">
            Menu
          </Link>
          <Link href="/orders" className="hover:text-emerald-700">
            Lịch sử đơn
          </Link>

          {token ? (
            <div className="flex items-center gap-3">
              <span
                data-testid="loyalty-badge"
                className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800"
              >
                ⭐ {user?.loyaltyPoints ?? 0} điểm
              </span>
              <button
                onClick={logout}
                className="text-xs text-red-600 hover:underline"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-lg border border-emerald-700 px-3 py-1.5 text-emerald-700 hover:bg-emerald-50"
            >
              Đăng nhập
            </Link>
          )}

          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-1.5 text-white hover:bg-emerald-800"
          >
            <span>Giỏ hàng</span>
            <span
              data-testid="cart-badge"
              className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-emerald-800"
            >
              {totalItems}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}