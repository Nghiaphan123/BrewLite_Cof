// apps/web/src/app/products/[id]/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Product, SizeOption, Topping } from '@/types';
import {
  AVAILABLE_TOPPINGS,
  SIZE_SURCHARGE,
  calculateLineTotal,
} from '@/features/product/pricing';
import { useCartStore } from '@/store/cart.store';

function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const productId = String(params?.id || '');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [size, setSize] = useState<SizeOption>('M');
  const [selectedToppings, setSelectedToppings] = useState<Topping[]>([]);
  const [qty, setQty] = useState<number>(1);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await apiClient.getProductById(productId);
        setProduct(data);
      } catch (err: any) {
        setError(err.message || 'Không tìm thấy sản phẩm');
      } finally {
        setLoading(false);
      }
    }
    if (productId) load();
  }, [productId]);

  const toggleTopping = (topping: Topping) => {
    setSelectedToppings((prev) =>
      prev.some((t) => t.id === topping.id)
        ? prev.filter((t) => t.id !== topping.id)
        : [...prev, topping]
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-stone-500">Đang tải chi tiết sản phẩm...</div>;
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-red-600">{error || 'Sản phẩm không tồn tại'}</p>
        <Link href="/" className="mt-4 inline-block text-emerald-700 underline">
          ← Quay lại Menu
        </Link>
      </div>
    );
  }

  const totalPrice = calculateLineTotal(product.price, size, selectedToppings, qty);

  const handleAddToCart = () => {
    addItem(product, size, selectedToppings, qty);
    router.push('/cart');
  };

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <Link href="/" className="text-sm font-medium text-emerald-700 hover:underline">
        ← Quay lại Menu
      </Link>

      <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-stone-900">{product.name}</h1>
        <p className="mt-1 text-stone-600">
          Giá gốc: <span className="font-semibold">{product.price.toLocaleString('vi-VN')}₫</span>
        </p>

        {/* Chọn Size S / M / L */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Chọn Size
          </h2>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(['S', 'M', 'L'] as SizeOption[]).map((s) => (
              <button
                key={s}
                type="button"
                data-testid={`size-${s}`}
                onClick={() => setSize(s)}
                className={`rounded-lg border py-2.5 text-sm font-semibold transition ${
                  size === s
                    ? 'border-emerald-700 bg-emerald-700 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-800 hover:bg-stone-100'
                }`}
              >
                {s} {SIZE_SURCHARGE[s] > 0 ? `(+${SIZE_SURCHARGE[s] / 1000}k)` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Chọn Topping */}
        <div className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
            Topping
          </h2>
          <div className="mt-2 space-y-2">
            {AVAILABLE_TOPPINGS.map((topping) => {
              const checked = selectedToppings.some((t) => t.id === topping.id);
              return (
                <label
                  key={topping.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-stone-200 p-3 hover:bg-stone-50"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      data-testid={`topping-${topping.id}`}
                      checked={checked}
                      onChange={() => toggleTopping(topping)}
                      className="h-4 w-4 accent-emerald-700"
                    />
                    <span className="text-sm font-medium text-stone-800">{topping.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-stone-600">
                    +{topping.price.toLocaleString('vi-VN')}₫
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Số lượng */}
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-stone-700">Số lượng</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="h-8 w-8 rounded-full border border-stone-300 font-bold"
            >
              -
            </button>
            <span data-testid="detail-qty" className="font-semibold">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="h-8 w-8 rounded-full border border-stone-300 font-bold"
            >
              +
            </button>
          </div>
        </div>

        {/* Tổng giá & Nút Thêm vào giỏ */}
        <div className="mt-6 border-t border-stone-200 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-stone-600">Tạm tính:</span>
            <span data-testid="detail-total-price" className="text-xl font-bold text-emerald-800">
              {totalPrice.toLocaleString('vi-VN')}₫
            </span>
          </div>

          <button
            type="button"
            data-testid="add-to-cart-btn"
            onClick={handleAddToCart}
            className="w-full rounded-xl bg-emerald-700 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Thêm vào giỏ
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage() {
  return (
    <React.Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8 text-center text-stone-500">Đang tải sản phẩm...</div>}>
      <ProductDetailContent />
    </React.Suspense>
  );
}