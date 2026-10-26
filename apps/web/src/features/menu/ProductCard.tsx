'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div>
        <div className="mb-3 flex h-36 w-full items-center justify-center rounded-lg bg-stone-100 text-4xl">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full rounded-lg object-cover"
            />
          ) : (
            '☕'
          )}
        </div>
        <h3 className="text-base font-semibold text-stone-900">{product.name}</h3>
        <p className="mt-1 text-sm font-bold text-emerald-700">
          {product.price.toLocaleString('vi-VN')}₫
        </p>
      </div>

      <Link
        href={`/products/${product.id}`}
        className="mt-4 block w-full rounded-lg bg-emerald-700 py-2 text-center text-sm font-medium text-white hover:bg-emerald-800"
      >
        Chọn Size / Topping
      </Link>
    </div>
  );
}