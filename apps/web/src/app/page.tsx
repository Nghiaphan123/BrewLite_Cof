// apps/web/src/app/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Product } from '@/types';
import { ProductCard } from '@/features/menu/ProductCard';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Thực đơn BrewLite</h1>
          <p className="text-sm text-stone-500">
            Đặt đồ uống và thanh toán không tiền mặt chỉ trong vài chạm
          </p>
        </div>
      </div>

      {loading && (
        <div data-testid="menu-loading" className="py-12 text-center text-stone-500">
          Đang tải thực đơn...
        </div>
      )}

      {!loading && error && (
        <div
          data-testid="menu-error"
          className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700"
        >
          <p className="font-medium">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <div data-testid="menu-empty" className="py-12 text-center text-stone-500">
          Hiện chưa có sản phẩm nào trong menu.
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div
          data-testid="menu-grid"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}