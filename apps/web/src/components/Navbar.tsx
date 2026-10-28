'use client';

import Link from 'next/link';
import { useCartStore } from '@/store/cart.store';
import { AccountMenu } from '@/components/AccountMenu';

export function Navbar() {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/menu" className="text-xl font-bold tracking-tight text-emerald-800">
          ☕ BrewLite
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-stone-700">
          <Link href="/menu" className="hover:text-emerald-700">
            Menu
          </Link>
          <Link href="/orders" className="hover:text-emerald-700">
            Lịch sử đơn
          </Link>

          <AccountMenu />

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